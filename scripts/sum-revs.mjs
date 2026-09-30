import fs from 'fs';
import path from 'path';

const root = path.resolve(import.meta.dirname, '..');
const files = ['clone-rev (1).csv', 'email-rev (1).csv', 'emailrev3 (1).csv'];

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
        if (quoted && line[i + 1] === '"') {
          current += '"';
          i += 1;
          continue;
        }
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
const totals = new Map();
const names = new Map();
const report = [];

for (const file of files) {
  const rows = parseCsv(fs.readFileSync(path.join(root, file), 'utf8'));
  const seen = new Map();
  let fileSum = 0;
  for (const cols of rows) {
    if (cols.length !== 2) throw new Error(`${file} expected 2 columns, got ${cols.length}: ${cols.join('|')}`);
    const label = cols[0].trim();
    const match = label.match(/^([A-Z]{2})(?:\s+[—–-]\s+(.+))?$/);
    if (!match) throw new Error(`${file} unreadable country: ${label}`);
    const code = match[1];
    const named = match[2]?.trim();
    const value = Number(cols[1].replace(/,/g, '').trim());
    if (!Number.isInteger(value) || value < 0) throw new Error(`${file} bad count for ${code}: ${cols[1]}`);
    seen.set(code, (seen.get(code) ?? 0) + 1);
    totals.set(code, (totals.get(code) ?? 0) + value);
    if (named) names.set(code, named);
    fileSum += value;
  }
  const dupes = [...seen.entries()].filter(([, count]) => count > 1);
  report.push({ file, rows: rows.length, sum: fileSum, dupes });
}

const records = [...totals.entries()]
  .map(([code, value]) => {
    let name = names.get(code);
    if (!name) {
      try {
        const resolved = displayNames.of(code);
        name = resolved && resolved !== code ? resolved : code;
      } catch {
        name = code;
      }
    }
    return { code, name, value };
  })
  .sort((a, b) => b.value - a.value || a.code.localeCompare(b.code));

const grand = records.reduce((sum, record) => sum + record.value, 0);
const fileGrand = report.reduce((sum, item) => sum + item.sum, 0);
if (grand !== fileGrand) throw new Error(`Sum mismatch ${grand} vs ${fileGrand}`);

const phasePath = path.join(root, 'src/phases/personal-email.json');
const phase = JSON.parse(fs.readFileSync(phasePath, 'utf8'));
phase.source = files.join(' + ');
phase.summary = 'Personal email records, summed by country across the three source files.';
phase.records = records;
fs.writeFileSync(phasePath, `${JSON.stringify(phase, null, 2)}\n`);

const land = JSON.parse(fs.readFileSync(path.join(root, 'public/geo/land.json'), 'utf8'));
const landCodes = new Set(land.features.map((feature) => feature.properties.iso).filter(Boolean));
const missingLand = records.filter((record) => !landCodes.has(record.code)).map((record) => record.code);

console.log(JSON.stringify({ report, countries: records.length, grand, missingLand }, null, 2));
