import type { RegionId } from './regions';

/** Mailbox mix for the personal-email phase. Percent points, not counts. */
export const PERSONAL_EMAIL_PCT = 94.38;

export type MailboxId =
  | 'gmail'
  | 'yahoo'
  | 'hotmail'
  | 'aol'
  | 'live'
  | 'apple'
  | 'outlook'
  | 'privacy';

export type Mailbox = {
  id: MailboxId;
  label: string;
  pct: number;
  color: string;
};

/** Phase figures. A country stays within 10% of these, and the record-weighted average matches them. */
export const MAILBOXES: Mailbox[] = [
  { id: 'gmail', label: 'Gmail', pct: 42.87, color: '#EA4335' },
  { id: 'yahoo', label: 'Yahoo', pct: 16.42, color: '#6001D2' },
  { id: 'hotmail', label: 'Hotmail', pct: 15.4, color: '#F15A22' },
  { id: 'aol', label: 'AOL', pct: 2.72, color: '#F4F7FB' },
  { id: 'live', label: 'Live', pct: 1.74, color: '#00A4EF' },
  { id: 'apple', label: 'Apple', pct: 0.58, color: '#F5F5F7' },
  { id: 'outlook', label: 'Outlook', pct: 0.37, color: '#0F6CBD' },
  { id: 'privacy', label: 'Privacy', pct: 0.01, color: '#C9B6FF' },
];

const BAND = 0.1;

export type MixRecord = {
  code: string;
  value: number;
  region: RegionId;
};

/**
 * Direction only, from -1 to 1. 1 means the full +10% before the average is pulled back.
 * These follow where each mailbox is actually stronger: Gmail in mobile-first markets,
 * Yahoo in Japan/Taiwan/Hong Kong, Hotmail and Live in Latin America, Apple where iPhone
 * share is high, AOL in the United States. Every other country takes a smaller step off
 * its region so two neighbors are not copies.
 */
const REGION_LEAN: Record<RegionId, Partial<Record<MailboxId, number>>> = {
  Asia: { gmail: 0.25, apple: -0.35 },
  'North America': { gmail: 0.15, apple: 0.3 },
  'Latin America': { gmail: 0.15, hotmail: 0.45, live: 0.4, apple: -0.3 },
  Europe: { hotmail: 0.2, outlook: 0.25, apple: 0.1 },
  'Middle East & North Africa': { gmail: 0.12, apple: 0.18, yahoo: -0.1 },
  'Sub-Saharan Africa': { gmail: 0.35, apple: -0.65 },
  Oceania: { gmail: 0.12, apple: 0.45 },
  Other: {},
};

const COUNTRY_LEAN: Record<string, Partial<Record<MailboxId, number>>> = {
  US: { gmail: 0.28, apple: 0.65, aol: 1, yahoo: -0.35, hotmail: -0.15, outlook: 0.25 },
  CA: { gmail: 0.18, apple: 0.5, outlook: 0.15 },
  MX: { hotmail: 0.55, live: 0.45, gmail: 0.12, apple: -0.25 },
  JP: { yahoo: 1, gmail: -0.75, apple: 0.5, hotmail: -0.55 },
  TW: { yahoo: 0.9, gmail: -0.5, apple: 0.2 },
  HK: { yahoo: 0.6, apple: 0.35, gmail: -0.15 },
  KR: { gmail: -0.3, apple: 0.4, yahoo: -0.2 },
  IN: { gmail: 0.55, apple: -0.85, yahoo: -0.2 },
  ID: { gmail: 0.4, apple: -0.5 },
  PH: { gmail: 0.35, yahoo: 0.25 },
  SG: { apple: 0.4, gmail: 0.12 },
  BR: { gmail: 0.28, hotmail: 0.5, live: 0.4 },
  GB: { apple: 0.45, hotmail: 0.3, outlook: 0.2, gmail: 0.12 },
  DE: { gmail: -0.2, outlook: 0.45, apple: 0.2 },
  FR: { gmail: -0.15, outlook: 0.25, apple: 0.15 },
  AU: { apple: 0.55, gmail: 0.12 },
  NZ: { apple: 0.4 },
  AE: { apple: 0.5, gmail: 0.08 },
  SA: { apple: 0.7, gmail: 0.55, yahoo: -0.45, hotmail: -0.2 },
  QA: { apple: 0.45 },
  KW: { apple: 0.4 },
  NG: { gmail: 0.4, apple: -0.7 },
  TR: { hotmail: 0.45, gmail: 0.08 },
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function hashUnit(text: string) {
  let hash = 2166136261;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return ((hash >>> 0) / 4294967295) * 2 - 1;
}

function signal(record: MixRecord, id: MailboxId) {
  const noted = COUNTRY_LEAN[record.code]?.[id];
  const base = noted ?? REGION_LEAN[record.region]?.[id] ?? 0;
  const spread = noted === undefined ? 0.8 : 0.22;
  return clamp(base + hashUnit(`${record.code}:${id}`) * spread, -1, 1);
}

function multipliers(records: MixRecord[], id: MailboxId) {
  const total = records.reduce((sum, record) => sum + record.value, 0);
  const factors = new Map<string, number>();
  if (total <= 0) return factors;

  for (const record of records) {
    factors.set(record.code, 1 + BAND * signal(record, id));
  }

  for (let step = 0; step < 24; step += 1) {
    let mean = 0;
    for (const record of records) {
      mean += (record.value / total) * (factors.get(record.code) ?? 1);
    }
    const delta = 1 - mean;
    if (Math.abs(delta) < 1e-8) break;
    for (const record of records) {
      factors.set(record.code, clamp((factors.get(record.code) ?? 1) + delta, 1 - BAND, 1 + BAND));
    }
  }

  return factors;
}

/** Phase percentages when code is null. Otherwise that country's spread around them. */
export function countryMailboxPct(records: MixRecord[], code: string | null) {
  if (import.meta.env.DEV) auditMix(records);
  if (!code) {
    return Object.fromEntries(MAILBOXES.map((box) => [box.id, box.pct])) as Record<MailboxId, number>;
  }

  const points = {} as Record<MailboxId, number>;
  for (const box of MAILBOXES) {
    const factor = multipliers(records, box.id).get(code) ?? 1;
    points[box.id] = box.pct * factor;
  }
  return points;
}

let audited = false;

function auditMix(records: MixRecord[]) {
  if (audited || records.length === 0) return;
  audited = true;
  const total = records.reduce((sum, record) => sum + record.value, 0);
  for (const box of MAILBOXES) {
    const factors = multipliers(records, box.id);
    let mean = 0;
    let min = Infinity;
    let max = -Infinity;
    for (const record of records) {
      const factor = factors.get(record.code) ?? 1;
      mean += (record.value / total) * factor;
      min = Math.min(min, factor);
      max = Math.max(max, factor);
    }
    if (min < 1 - BAND - 1e-6 || max > 1 + BAND + 1e-6 || Math.abs(mean - 1) > 0.002) {
      console.warn(`Mailbox ${box.id} left its band`, { min, max, mean });
    }
  }
}
