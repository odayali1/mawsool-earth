/**
 * Builds the slim country shapes used by the globe.
 *
 * Source: Natural Earth 1:110m admin-0, the same public-domain file
 * globe.gl ships in its choropleth example:
 * https://github.com/vasturiano/globe.gl/blob/master/example/datasets/ne_110m_admin_0_countries.geojson
 *
 * Raw file is expected at data/raw/ne_110m_admin_0_countries.geojson
 * (gitignored; re-download from the URL above).
 *
 * Writes public/geo/land.json
 */
import fs from 'fs';
import path from 'path';

const rawPath = path.resolve('data/raw/ne_110m_admin_0_countries.geojson');
const outPath = path.resolve('public/geo/land.json');

if (!fs.existsSync(rawPath)) {
  console.error(`Missing ${rawPath}`);
  console.error('Download the globe.gl Natural Earth file to that path and run again.');
  process.exit(1);
}

/** 110m ISO_A2 is "-99" for a few countries. Map the stable ADM0_A3 instead. */
const A3_TO_A2 = {
  FRA: 'FR',
  NOR: 'NO',
};

const SKIP = new Set(['ATA', 'ATF']);

function isoOf(properties) {
  const a3 = properties.ADM0_A3;
  if (SKIP.has(a3)) return { iso: null, skip: true };
  const a2 = properties.ISO_A2;
  if (typeof a2 === 'string' && /^[A-Z]{2}$/.test(a2)) return { iso: a2, skip: false };
  if (Object.prototype.hasOwnProperty.call(A3_TO_A2, a3)) {
    return { iso: A3_TO_A2[a3], skip: false };
  }
  return { iso: null, skip: false };
}

function polygonsOf(geometry) {
  if (!geometry) return [];
  if (geometry.type === 'Polygon') return [geometry.coordinates];
  if (geometry.type === 'MultiPolygon') return geometry.coordinates;
  return [];
}

function measureRing(ring) {
  if (!ring || ring.length < 4) return null;
  const lngs = ring.map((point) => point[0]);
  const lats = ring.map((point) => point[1]);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const wrap = maxLng - minLng > 180;
  const used = wrap
    ? ring.map(([lng, lat]) => [lng < 0 ? lng + 360 : lng, lat])
    : ring;

  let twice = 0;
  let cx = 0;
  let cy = 0;
  for (let i = 0; i < used.length - 1; i += 1) {
    const [x1, y1] = used[i];
    const [x2, y2] = used[i + 1];
    const cross = x1 * y2 - x2 * y1;
    twice += cross;
    cx += (x1 + x2) * cross;
    cy += (y1 + y2) * cross;
  }
  const area = Math.abs(twice) / 2;
  if (area < 1e-8) {
    return null;
  }
  let lng = cx / (3 * twice);
  const lat = cy / (3 * twice);
  if (wrap) lng = lng > 180 ? lng - 360 : lng;
  const insideLat = lat >= minLat - 1 && lat <= maxLat + 1;
  const insideLng = wrap
    ? true
    : lng >= minLng - 1 && lng <= maxLng + 1;
  const point = insideLat && insideLng && Number.isFinite(lat) && Number.isFinite(lng)
    ? { lat, lng }
    : { lat: (minLat + maxLat) / 2, lng: wrap ? (minLng + maxLng) / 2 : (minLng + maxLng) / 2 };
  return { area, lat: point.lat, lng: point.lng };
}

function focusPoint(geometry) {
  let best = null;
  for (const polygon of polygonsOf(geometry)) {
    const metrics = measureRing(polygon[0]);
    if (metrics && (!best || metrics.area > best.area)) best = metrics;
  }
  if (!best) return { lat: 0, lng: 0 };
  return { lat: round(best.lat), lng: round(best.lng) };
}

function round(n) {
  return Math.round(n * 1000) / 1000;
}

const raw = JSON.parse(fs.readFileSync(rawPath, 'utf8'));
const features = [];

for (const feature of raw.features) {
  const { iso, skip } = isoOf(feature.properties);
  if (skip) continue;
  const focus = focusPoint(feature.geometry);
  features.push({
    type: 'Feature',
    properties: { iso, lat: focus.lat, lng: focus.lng },
    geometry: feature.geometry,
  });
}

fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, JSON.stringify({ type: 'FeatureCollection', features }));

const withIso = features.filter((feature) => feature.properties.iso);
console.log(`land.json  features=${features.length}  coded=${withIso.length}  bytes=${fs.statSync(outPath).size}`);

const watch = ['US', 'FR', 'NO', 'RU', 'CA', 'CN', 'AU', 'BR', 'IN', 'GB', 'NZ', 'ID', 'ZA'];
for (const code of watch) {
  const found = withIso.find((feature) => feature.properties.iso === code);
  console.log(code, found ? `${found.properties.lat}, ${found.properties.lng}` : 'MISSING POLYGON');
}
