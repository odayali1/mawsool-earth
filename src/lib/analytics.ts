import type { PhaseFile } from '../phases/types';
import { formatCompact, formatFull } from './format';
import { regionOf, type RegionId } from './regions';

export type CountryRow = {
  code: string;
  name: string;
  value: number;
  region: RegionId;
  share: number;
  rank: number;
};

export type RegionSlice = {
  id: RegionId;
  value: number;
  countries: number;
  share: number;
};

export type PhaseStats = {
  total: number;
  mappedTotal: number;
  locations: CountryRow[];
  unknown: CountryRow | null;
  unknownRank: number | null;
  leader: CountryRow;
  median: number;
  top5Share: number;
  top10Share: number;
  halfCount: number;
  regions: RegionSlice[];
};

export type Insight = {
  tone: 'lead' | 'body';
  text: string;
};

export function analyze(phase: PhaseFile): PhaseStats {
  const total = phase.records.reduce((sum, record) => sum + record.value, 0);
  const unknownSource = phase.records.find((record) => record.code === 'unknown') ?? null;
  const mapped = phase.records
    .filter((record) => record.code !== 'unknown' && record.value > 0)
    .sort((a, b) => b.value - a.value);

  const locations: CountryRow[] = mapped.map((record, index) => ({
    code: record.code,
    name: record.name,
    value: record.value,
    region: regionOf(record.code),
    share: total > 0 ? record.value / total : 0,
    rank: index + 1,
  }));

  if (import.meta.env.DEV) {
    for (const row of locations) {
      if (row.region === 'Other') console.warn(`No region mapping for ${row.code}`);
    }
  }

  const mappedTotal = locations.reduce((sum, row) => sum + row.value, 0);
  const unknown: CountryRow | null = unknownSource
    ? {
        code: 'unknown',
        name: unknownSource.name,
        value: unknownSource.value,
        region: 'Other',
        share: total > 0 ? unknownSource.value / total : 0,
        rank: 0,
      }
    : null;

  const unknownRank = unknown
    ? locations.filter((row) => row.value > unknown.value).length + 1
    : null;

  const leader = locations[0];
  if (!leader) throw new Error(`Phase ${phase.id} has no countries`);
  const mid = Math.floor(locations.length / 2);
  const median =
    locations.length === 0
      ? 0
      : locations.length % 2 === 1
        ? locations[mid].value
        : (locations[mid - 1].value + locations[mid].value) / 2;

  const sumTop = (count: number) =>
    locations.slice(0, count).reduce((sum, row) => sum + row.value, 0);

  let running = 0;
  let halfCount = 0;
  for (const row of locations) {
    running += row.value;
    halfCount += 1;
    if (total > 0 && running >= total * 0.5) break;
  }

  const regionTotals = new Map<RegionId, { value: number; countries: number }>();
  for (const row of locations) {
    const current = regionTotals.get(row.region) ?? { value: 0, countries: 0 };
    current.value += row.value;
    current.countries += 1;
    regionTotals.set(row.region, current);
  }
  const regions: RegionSlice[] = [...regionTotals.entries()]
    .map(([id, meta]) => ({
      id,
      value: meta.value,
      countries: meta.countries,
      share: total > 0 ? meta.value / total : 0,
    }))
    .sort((a, b) => b.countries - a.countries || b.value - a.value);

  return {
    total,
    mappedTotal,
    locations,
    unknown,
    unknownRank,
    leader,
    median,
    top5Share: total > 0 ? sumTop(5) / total : 0,
    top10Share: total > 0 ? sumTop(10) / total : 0,
    halfCount,
    regions,
  };
}

export function phaseInsights(stats: PhaseStats, noun: string): Insight[] {
  const insights: Insight[] = [
    {
      tone: 'lead',
      text: `${formatFull(stats.total)} ${noun} across ${stats.locations.length} countries.`,
    },
    {
      tone: 'body',
      text: `The footprint covers ${stats.regions.length} regions.`,
    },
  ];
  if (stats.unknown && stats.unknown.value > 0) {
    insights.push({
      tone: 'body',
      text: `${formatCompact(stats.unknown.value)} ${noun} have no country code yet. They stay inside the total.`,
    });
  }
  return insights;
}
