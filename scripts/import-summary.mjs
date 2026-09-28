/**
 * Turn a country total-summary CSV into a phase file the globe can load.
 *
 * Columns: Country Code, Country Name, Total Count
 *
 * node scripts/import-summary.mjs "emailrev3 - Total Summary.csv" personal-email \
 *   --order 1 --code 01 --title "Personal Email" --noun "personal emails" \
 *   --singular "personal email" --kicker "Phase 01" \
 *   --summary "Personal email records, counted by country."
 */
import fs from 'fs';
import path from 'path';

const args = process.argv.slice(2);
const file = args[0];
const id = args[1];

if (!file || !id) {
  console.error('Usage: node scripts/import-summary.mjs <csv> <phase-id> [--order 1 --code 01 ...]');
  process.exit(1);
}

function flag(name, fallback) {
  const index = args.indexOf(`--${name}`);
  if (index === -1 || !args[index + 1]) return fallback;
  return args[index + 1];
}

function parseCsv(text) {
  const lines = text.replace(/^\uFEFF/, '').split(/\r?\n/).filter((line) => line.trim().length > 0);
  const rows = [];
  for (const line of lines.slice(1)) {
    const cols = [];
    let current = '';
    let quoted = false;
    for (let i = 0; i < line.length; i += 1) {
      const char = line[i];
      if (char === '"') {
        quoted = !quoted;
        continue;
      }
      if (char === ',' && !quoted) {
        cols.push(current);
        current = '';
        continue;
      }
      current += char;
    }
    cols.push(current);
    rows.push(cols);
  }
  return rows;
}

const displayNames = new Intl.DisplayNames(['en'], { type: 'region' });

function cleanCode(raw) {
  const code = raw.trim();
  if (code === '(unknown)' || code.toLowerCase() === 'unknown') return 'unknown';
  return code.toUpperCase();
}

function cleanName(code, raw) {
  const named = raw.match(/^[A-Z]{2}\s+[—–-]\s+(.+)$/);
  if (named) return named[1].trim();
  if (code === 'unknown') return 'Unknown country';
  try {
    const resolved = displayNames.of(code);
    if (resolved && resolved !== code) return resolved;
  } catch {
    /* keep the source text */
  }
  return raw.trim() || code;
}

const rows = parseCsv(fs.readFileSync(file, 'utf8'));
const records = rows.map((cols) => {
  const code = cleanCode(cols[0] ?? '');
  const name = cleanName(code, (cols[1] ?? '').trim());
  const value = Number(String(cols[2] ?? '0').replace(/,/g, '').trim());
  if (!code || !Number.isFinite(value)) {
    throw new Error(`Bad row: ${cols.join('|')}`);
  }
  return { code, name, value };
});

records.sort((a, b) => b.value - a.value);

const phase = {
  id,
  order: Number(flag('order', '1')),
  code: flag('code', '01'),
  title: flag('title', id),
  kicker: flag('kicker', 'Phase'),
  noun: flag('noun', 'records'),
  singular: flag('singular', 'record'),
  source: flag('source', path.basename(file)),
  summary: flag('summary', ''),
  records,
};

const out = path.resolve('src/phases', `${id}.json`);
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, `${JSON.stringify(phase, null, 2)}\n`);

const total = records.reduce((sum, record) => sum + record.value, 0);
const unknown = records.find((record) => record.code === 'unknown');
const mapped = records.filter((record) => record.code !== 'unknown');
let running = 0;
let half = 0;
for (const record of mapped) {
  running += record.value;
  half += 1;
  if (running >= total * 0.5) break;
}

console.log(`wrote ${out}`);
console.log(`records=${records.length} mapped=${mapped.length} total=${total.toLocaleString('en-US')} halfCount=${half}`);
if (unknown) console.log(`unknown=${unknown.value.toLocaleString('en-US')}`);
console.log(`leader=${mapped[0]?.name} ${mapped[0]?.value.toLocaleString('en-US')}`);

const landPath = path.resolve('public/geo/land.json');
const extraPath = path.resolve('src/lib/extra-places.json');
if (fs.existsSync(landPath)) {
  const land = JSON.parse(fs.readFileSync(landPath, 'utf8'));
  const polys = new Set(land.features.map((feature) => feature.properties.iso).filter(Boolean));
  const extra = fs.existsSync(extraPath) ? JSON.parse(fs.readFileSync(extraPath, 'utf8')) : {};
  const missing = mapped.filter((record) => !polys.has(record.code) && !extra[record.code]);
  const beacons = mapped.filter((record) => !polys.has(record.code) && extra[record.code]);
  console.log(`on globe polygons: ${mapped.length - beacons.length - missing.length}`);
  console.log(`beacons: ${beacons.map((record) => record.code).join(', ') || 'none'}`);
  if (missing.length) {
    console.log(`NO MAP POINT: ${missing.map((record) => `${record.code} ${record.name}`).join(' | ')}`);
  }
}
