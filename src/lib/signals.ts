import type { CountryRow } from './analytics';
import type { PlacePoint } from './land';

export type SweepNode = {
  code: string;
  name: string;
  lat: number;
  lng: number;
  kind: 'noise' | 'signal';
};

function unit(seed: string) {
  let hash = 2166136261;
  for (let index = 0; index < seed.length; index += 1) {
    hash = Math.imul(hash ^ seed.charCodeAt(index), 16777619);
  }
  return (hash >>> 0) / 4294967295;
}

/** Equal nodes across countries. Signals are spaced around the planet, not sized by record count. */
export function sweepNodes(rows: CountryRow[], places: Map<string, PlacePoint>): SweepNode[] {
  const nodes: SweepNode[] = [];
  const dust: SweepNode[] = [];
  for (const row of rows) {
    const place = places.get(row.code);
    if (!place) continue;
    nodes.push({
      code: row.code,
      name: row.name,
      lat: place.lat,
      lng: place.lng,
      kind: 'noise',
    });
    for (let speckle = 0; speckle < 2; speckle += 1) {
      dust.push({
        code: `${row.code}:${speckle}`,
        name: row.name,
        lat: place.lat + (unit(`${row.code}:lat:${speckle}`) - 0.5) * 6,
        lng: place.lng + (unit(`${row.code}:lng:${speckle}`) - 0.5) * 6,
        kind: 'noise',
      });
    }
  }
  const around = [...nodes].sort((a, b) => a.lng - b.lng || a.lat - b.lat);
  const step = Math.max(1, Math.floor(around.length / 16));
  for (let index = 0; index < around.length; index += step) around[index].kind = 'signal';
  return [...nodes, ...dust];
}

/** Degrees the beam has traveled past this longitude, 0–360. */
export function degreesPast(lng: number, sweep: number) {
  return (sweep - lng + 360) % 360;
}
