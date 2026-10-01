import { readFileSync, writeFileSync } from 'node:fs';

const TOTAL = 1_000_806_270;

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

const EXPECTED = {
  US: 225_414_931,
  IN: 118_336_800,
  SA: 9_113_863,
  UNKNOWN: 4_320_071,
  UM: 511,
};

const listed = readFileSync(new URL('./location-counts.txt', import.meta.url), 'utf8')
  .trim()
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
for (const [code, value] of Object.entries(EXPECTED)) {
  const row = listed.find((item) => item.code === code);
  if (!row || row.value !== value) throw new Error(`${code} is ${row?.value}, expected ${value}`);
}

const names = new Intl.DisplayNames(['en'], { type: 'region' });
const records = listed.map((row) => ({
  code: row.code === 'UNKNOWN' ? 'unknown' : row.code,
  name: NAMES[row.code] ?? names.of(row.code) ?? row.code,
  value: row.value,
}));

const finalSum = records.reduce((sum, row) => sum + row.value, 0);
const notIndexed = TOTAL - finalSum;
if (notIndexed !== 7_642_592) throw new Error(`Not indexed gap is ${notIndexed}`);
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
    'Profiles by country from the location country counts. 7,642,592 profiles are in the database and are not indexed yet.',
  records: records.sort((a, b) => b.value - a.value),
};

writeFileSync(new URL('../src/phases/profile-graph.json', import.meta.url), `${JSON.stringify(phase, null, 2)}\n`);

console.log(
  JSON.stringify(
    {
      rows: listed.length,
      finalSum,
      us: usFinal.value,
      unknown: records.find((row) => row.code === 'unknown').value,
      india: records.find((row) => row.code === 'IN').value,
      saudi: records.find((row) => row.code === 'SA').value,
      notIndexed,
      headline: Number((BigInt(TOTAL) * 9904n + 5000n) / 10000n),
    },
    null,
    2,
  ),
);
