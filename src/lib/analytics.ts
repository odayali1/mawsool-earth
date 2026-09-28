import type { PhaseFile } from '../phases/types';
import { formatCompact, formatPct, joinNames } from './format';
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

  const regionTotals = new Map<RegionId, number>();
  for (const row of locations) {
    regionTotals.set(row.region, (regionTotals.get(row.region) ?? 0) + row.value);
  }
  const regions: RegionSlice[] = [...regionTotals.entries()]
    .map(([id, value]) => ({ id, value, share: total > 0 ? value / total : 0 }))
    .sort((a, b) => b.value - a.value);

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
  const { locations, leader, total, halfCount, unknown, unknownRank } = stats;
  const insights: Insight[] = [];
  const nextThree = locations.slice(1, 4);
  const nextThreeSum = nextThree.reduce((sum, row) => sum + row.value, 0);

  if (nextThree.length === 3 && leader.value > nextThreeSum) {
    insights.push({
      tone: 'lead',
      text: sentence(
        `${withArticle(leader.name)} alone outweighs ${joinNames(nextThree.map((row) => withArticle(row.name)))} combined.`,
      ),
    });
  } else {
    insights.push({
      tone: 'lead',
      text: sentence(
        `${withArticle(leader.name)} leads with ${formatPct(leader.share)} of all ${noun} in this phase.`,
      ),
    });
  }

  if (halfCount > 1) {
    const almost = locations.slice(0, halfCount - 1);
    const tip = locations[halfCount - 1];
    const almostShare = almost.reduce((sum, row) => sum + row.value, 0) / total;
    insights.push({
      tone: 'body',
      text: `${sentence(`${joinNames(almost.map((row) => withArticle(row.name)))} hold ${formatPct(almostShare)}`)}. ${tip.name} is the country that carries this phase past halfway.`,
    });
  } else if (leader) {
    insights.push({
      tone: 'body',
      text: sentence(`${withArticle(leader.name)} alone holds more than half of all ${noun} in this phase.`),
    });
  }

  if (unknown && unknownRank) {
    const aheadOf = locations[unknownRank - 1];
    const place = aheadOf
      ? `they would rank ${ordinal(unknownRank)}, ahead of ${aheadOf.name}`
      : `they would rank ${ordinal(unknownRank)}`;
    insights.push({
      tone: 'body',
      text: `${formatCompact(unknown.value)} ${noun} have no country. Placed on this list, ${place}.`,
    });
  }

  return insights;
}

function withArticle(name: string) {
  if (name.startsWith('United ')) return `the ${name}`;
  return name;
}

function sentence(text: string) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function ordinal(value: number) {
  const mod100 = value % 100;
  if (mod100 >= 11 && mod100 <= 13) return `${value}th`;
  switch (value % 10) {
    case 1:
      return `${value}st`;
    case 2:
      return `${value}nd`;
    case 3:
      return `${value}rd`;
    default:
      return `${value}th`;
  }
}

export function regionShareOf(stats: PhaseStats, row: CountryRow) {
  const slice = stats.regions.find((region) => region.id === row.region);
  if (!slice || slice.value <= 0) return 0;
  return row.value / slice.value;
}
