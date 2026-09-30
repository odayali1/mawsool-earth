import { writeFileSync } from 'node:fs';

const TOTAL = 1_000_806_270;
const US_MISTAKE = 103_958_989;

const RAW = `
US 196045734
IN 100308552
BR 57047925
UNKNOWN 35172366
GB 34897537
CN 33090472
FR 28009631
CA 21800262
ID 21716633
MX 17891578
IT 17765743
ES 16448166
DE 15730700
AU 13661085
PH 11673950
TR 11491559
ZA 10698449
CO 10582763
NL 10529931
AR 10466140
PK 8503434
SA 7262238
AE 7168441
NG 7050676
EG 6870521
PE 6858720
MY 6662666
CL 6462415
RU 6192970
PL 5522014
BE 4730430
SE 4671807
BD 4096668
CH 4061928
PT 3952632
VN 3591840
KE 3511528
MA 3462545
SG 3452592
EC 3381353
IR 3342517
RO 3290381
JP 3288610
VE 3266160
TH 3112122
KR 3070673
UA 3051221
DK 3019081
IE 2627546
TW 2607349
DZ 2580152
NZ 2446159
HK 2372374
NO 2349985
CZ 2099091
IL 2087482
GR 2038077
AT 2016138
GH 1921328
LK 1737352
FI 1647778
TN 1456237
CR 1350683
HU 1310229
DO 1261870
GT 1105960
QA 1100327
JO 1085709
NP 1085049
RS 1073236
CI 1057871
BO 1043445
IQ 1040528
UY 1000215
UG 975119
KZ 962340
TZ 960668
BG 943405
CM 892998
PA 887189
ET 886232
SN 836605
PR 792352
HR 770210
LB 763443
ZW 750804
AO 736388
KW 724724
SK 704280
AZ 665750
OM 650994
SV 643188
ZM 634817
PY 634488
OO 629287
BY 593463
LT 589242
HN 580162
JM 562292
MM 542024
CD 535512
GE 499845
MZ 481840
KH 472996
NI 459996
TT 438217
SI 426447
AL 411195
BH 407879
LV 402585
CY 401891
UZ 382222
MU 366493
SY 355386
LU 337925
RW 332818
AF 330092
BW 321931
BJ 320249
PG 319352
MG 315685
SD 314464
BA 304574
EE 300791
NA 297197
AM 292673
MK 287996
BF 287344
MT 273410
LY 263953
MD 262598
ML 254421
YE 251117
MW 236382
CU 226770
PS 222411
HT 214771
IS 207011
TG 206330
MN 202240
RE 197739
GN 190093
SO 185693
FJ 177687
GA 174484
CG 158268
BS 148129
KG 131670
MV 125039
MO 114115
LR 113965
BB 112984
GP 108729
SL 106427
NE 106085
ME 102405
MQ 97206
BN 94889
LA 93335
GY 92931
MR 89271
SZ 88236
GM 86375
SR 85494
LS 84422
TD 77938
BT 76511
KO 71469
BI 70095
NC 67068
BZ 62241
SS 61800
GU 59433
PF 58344
EH 58158
CV 56436
TJ 54870
DJ 53775
KY 52659
BM 50158
JE 50082
AW 47180
MC 46011
LC 45192
AD 44440
VI 43464
GF 40659
AN 37017
XK 36071
CS 36029
AS 35782
IM 34884
TM 33464
AG 31809
CW 30135
SC 29794
CF 29509
GD 29088
GQ 27415
GG 27090
GI 24605
VC 22961
LI 20421
YT 19550
SB 18693
AX 18247
DM 18013
KM 17579
TC 17365
KN 16633
GL 16582
TL 16350
VU 15874
FO 15652
VG 15602
GW 14310
WS 13603
UN 13066
MP 12655
TO 11534
AI 11523
SM 11377
AQ 10044
FM 9227
TP 8488
ER 8069
KI 7839
MH 7698
ST 7573
IO 7519
CK 7147
PW 5289
CB 4189
YU 4118
VA 3783
KP 3050
CX 2857
NR 2609
TV 2563
FK 2432
WF 2406
PM 2358
MS 2125
SH 2087
SX 1881
BQ 1596
TF 1549
NU 1537
MF 1447
NF 1348
SJ 1312
CC 1232
EU 1016
GS 990
PN 924
TK 915
BL 865
BV 583
HM 575
UM 511
`;

const NAMES = {
  UNKNOWN: 'No country',
  OO: 'Other',
  KO: 'Kosovo (KO)',
  AN: 'Netherlands Antilles',
  CS: 'Serbia and Montenegro',
  TP: 'East Timor',
  YU: 'Yugoslavia',
  CB: 'Caribbean',
  UN: 'Unspecified',
  EU: 'Europe',
  XK: 'Kosovo',
  CI: "Côte d'Ivoire",
};

const listed = RAW.trim()
  .split('\n')
  .map((line) => {
    const [code, count] = line.trim().split(/\s+/);
    return { code, value: Number(count) };
  });

if (listed.some((row) => !Number.isInteger(row.value))) {
  throw new Error('Non-integer count');
}
const codes = new Set();
for (const row of listed) {
  if (codes.has(row.code)) throw new Error(`Duplicate ${row.code}`);
  codes.add(row.code);
}

const originalSum = listed.reduce((sum, row) => sum + row.value, 0);
const us = listed.find((row) => row.code === 'US');
if (!us || us.value !== 196_045_734) throw new Error(`US listed count changed: ${us?.value}`);

const weights = listed
  .filter((row) => row.code !== 'UNKNOWN' && row.code !== 'US')
  .map((row) => ({ code: row.code, weight: row.value }));
const weightSum = weights.reduce((sum, row) => sum + row.weight, 0);
const pool = BigInt(US_MISTAKE);
const weightTotal = BigInt(weightSum);
const shares = weights.map((row) => {
  const numerator = pool * BigInt(row.weight);
  const base = Number(numerator / weightTotal);
  const remainder = numerator % weightTotal;
  return { ...row, base, remainder };
});
let leftover = US_MISTAKE - shares.reduce((sum, row) => sum + row.base, 0);
shares.sort((a, b) => {
  if (a.remainder > b.remainder) return -1;
  if (a.remainder < b.remainder) return 1;
  return b.weight - a.weight || a.code.localeCompare(b.code);
});
for (let index = 0; index < leftover; index += 1) shares[index].base += 1;
if (shares.reduce((sum, row) => sum + row.base, 0) !== US_MISTAKE) {
  throw new Error('Redistribution does not sum to the miscounted block');
}

const added = new Map(shares.map((row) => [row.code, row.base]));
const names = new Intl.DisplayNames(['en'], { type: 'region' });
const records = listed.map((row) => {
  const extra = added.get(row.code) ?? 0;
  const value = row.value + extra;
  if (row.code === 'US' && value !== row.value) throw new Error('US must stay at the listed count');
  const code = row.code === 'UNKNOWN' ? 'unknown' : row.code;
  const name = NAMES[row.code] ?? names.of(row.code) ?? row.code;
  return { code, name, value };
});

const finalSum = records.reduce((sum, row) => sum + row.value, 0);
if (finalSum !== originalSum + US_MISTAKE) {
  throw new Error(`Sum ${finalSum} is not listed ${originalSum} plus ${US_MISTAKE}`);
}
const usFinal = records.find((row) => row.code === 'US');

const phase = {
  id: 'profile-graph',
  order: 3,
  code: '03',
  title: '1B Profiles',
  kicker: 'Room 03',
  noun: 'profiles',
  singular: 'profile',
  source: 'location country counts',
  summary:
    'Profiles by country. The United States stays at 196,045,734. The 103,958,989 records that had been counted as one country are divided across the other countries in proportion to each country size.',
  records: records.sort((a, b) => b.value - a.value),
};

writeFileSync(new URL('../src/phases/profile-graph.json', import.meta.url), `${JSON.stringify(phase, null, 2)}\n`);

console.log(
  JSON.stringify(
    {
      rows: listed.length,
      originalSum,
      finalSum,
      usListed: us.value,
      usAdded: added.get('US') ?? 0,
      usFinal: usFinal.value,
      unknown: records.find((row) => row.code === 'unknown').value,
      india: records.find((row) => row.code === 'IN').value,
      headline: Math.round((TOTAL * 9904) / 10000),
    },
    null,
    2,
  ),
);
