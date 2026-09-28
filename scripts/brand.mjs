import fs from 'fs';

const source = fs.readFileSync('public/brand/logo.svg', 'utf8').replace(/^\uFEFF/, '');
fs.writeFileSync('public/brand/logo-on-dark.svg', source.replaceAll('fill="#222222"', 'fill="#F4F7FB"'));

const paths = [...source.matchAll(/<path d="(M(?:44|27)[^"]*)" fill="url\(#(paint[01]_linear_267_6941)\)"\/>/g)];
const defs = source.match(/<defs>[\s\S]*<\/defs>/)?.[0] ?? '';
const body = paths.map((match) => `<path d="${match[1]}" fill="url(#${match[2]})"/>`).join('');
fs.writeFileSync(
  'public/favicon.svg',
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 46 31">${body}${defs}</svg>\n`,
);
console.log('paths', paths.length, 'favicon', fs.statSync('public/favicon.svg').size);

const phase = JSON.parse(fs.readFileSync('src/phases/personal-email.json', 'utf8'));
const regionSrc = fs.readFileSync('src/lib/regions.ts', 'utf8');
const codes = [...regionSrc.matchAll(/^\s{2}([A-Z]{2}):/gm)].map((match) => match[1]);
const set = new Set(codes);
const missing = phase.records.filter((row) => row.code !== 'unknown' && !set.has(row.code)).map((row) => row.code);
const dupes = codes.filter((code, index) => codes.indexOf(code) !== index);
console.log('region keys', codes.length, 'missing', missing.join(',') || 'none', 'dupes', [...new Set(dupes)].join(',') || 'none');
