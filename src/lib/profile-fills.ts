export const PROFILE_TOTAL = 1_000_806_270;

export const PROFILE_FIELDS = [
  { key: 'public_id', label: 'public_id', bps: 10_000 },
  { key: 'full_name', label: 'full_name', bps: 10_000 },
  { key: 'connections_count', label: 'connections_count', bps: 10_000 },
  { key: 'followers_count', label: 'followers_count', bps: 10_000 },
  { key: 'last_verified_at', label: 'last_verified_at', bps: 10_000 },
  { key: 'location', label: 'location', bps: 9_996 },
  { key: 'headline', label: 'headline', bps: 9_904 },
  { key: 'location_country', label: 'location_country', bps: 9_336 },
  { key: 'job_function', label: 'job_function', bps: 8_731 },
  { key: 'seniority', label: 'seniority', bps: 8_731 },
  { key: 'urn', label: 'urn', bps: 8_393 },
  { key: 'pronoun', label: 'pronoun', bps: 8_393 },
  { key: 'industry', label: 'industry', bps: 6_733 },
  { key: 'experience', label: 'experience', bps: 6_079 },
  { key: 'education', label: 'education', bps: 3_714 },
  { key: 'skills', label: 'skills', bps: 2_689 },
  { key: 'logo_url', label: 'logo_url', bps: 2_577 },
  { key: 'ingestion_tag', label: 'ingestion_tag', bps: 1_436 },
  { key: 'summary', label: 'summary', bps: 1_397 },
  { key: 'profile_embedding', label: 'profile_embedding', note: 'AI vector search', bps: 1_167 },
  { key: 'public_profile_url', label: 'public_profile_url', bps: 969 },
  { key: 'badges', label: 'badges', bps: 625 },
  { key: 'languages', label: 'languages', bps: 594 },
  { key: 'certifications', label: 'certifications', bps: 556 },
  { key: 'volunteer_experiences', label: 'volunteer_experiences', bps: 267 },
  { key: 'courses', label: 'courses', bps: 173 },
  { key: 'projects', label: 'projects', bps: 142 },
  { key: 'honors', label: 'honors', bps: 138 },
  { key: 'organizations', label: 'organizations', bps: 116 },
  { key: 'publications', label: 'publications', bps: 83 },
  { key: 'patents', label: 'patents', bps: 7 },
] as const;

/** Integer count for a field. Basis points avoid binary rounding error. */
export function filledCount(profiles: number, bps: number) {
  const product = BigInt(profiles) * BigInt(bps) + 5_000n;
  return Number(product / 10_000n);
}
