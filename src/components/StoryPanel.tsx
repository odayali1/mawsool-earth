import { phaseInsights, type CountryRow, type PhaseStats } from '../lib/analytics';
import { formatCompact, formatFull } from '../lib/format';
import type { PlacePoint } from '../lib/land';
import { filledCount, PROFILE_FIELDS, PROFILE_TOTAL } from '../lib/profile-fills';
import { REGION_COLOR, type RegionId } from '../lib/regions';
import type { PhaseFile } from '../phases/types';
import { Flag } from './Flag';
import { MailboxMix } from './MailboxMix';

type Props = {
  phase: PhaseFile;
  stats: PhaseStats;
  selected: string | null;
  region: RegionId | null;
  places: Map<string, PlacePoint>;
  onSelect: (code: string | null) => void;
  onRegion: (region: RegionId | null) => void;
};

export function StoryPanel({ phase, stats, selected, region, places, onSelect, onRegion }: Props) {
  const row =
    selected === 'unknown'
      ? stats.unknown
      : (stats.locations.find((item) => item.code === selected) ?? null);

  if (phase.id === 'profile-graph' && selected === 'unindexed') {
    const pending = PROFILE_TOTAL - stats.total;
    return (
      <section className="panel story" aria-live="polite">
        <div className="dossier is-profile">
          <button type="button" className="back" onClick={() => onSelect(null)}>
            All countries
          </button>
          <div className="dossier-title">
            <div>
              <p className="eyebrow">Not indexed yet</p>
              <h2>Outside the country index</h2>
            </div>
          </div>
          <p className="hero-num">{formatFull(pending)}</p>
          <p className="hero-sub">profiles</p>
          <p className="index-note">
            These profiles are in the database of {formatFull(PROFILE_TOTAL)}. They are not in the country index of{' '}
            {formatFull(stats.total)} yet, so they stay off the map and out of the country cards.
          </p>
        </div>
      </section>
    );
  }

  if (row) {
    return (
      <section className="panel story" aria-live="polite">
        <Dossier
          phase={phase}
          stats={stats}
          row={row}
          place={places.get(row.code)}
          onBack={() => onSelect(null)}
          onSelect={onSelect}
        />
      </section>
    );
  }

  if (phase.id === 'profile-graph') {
    return (
      <section className="panel story" aria-label="Profile field counts">
        <p className="eyebrow">Database</p>
        <h2>Field counts</h2>
        <p className="hint">
          Counts for all {formatFull(PROFILE_TOTAL)} profiles. {formatFull(stats.total)} are in the country index.{' '}
          {formatFull(PROFILE_TOTAL - stats.total)} are not indexed yet. Country cards use the same fields on that
          country’s own profile count.
        </p>
        <p className="index-note">Index note. Figures in this room can differ by up to 5%.</p>
        <FillCounts profiles={PROFILE_TOTAL} />
        <p className="source">{phase.summary}</p>
      </section>
    );
  }

  const insights = phaseInsights(stats, phase.noun);
  const [lead, ...rest] = insights;

  return (
    <section className="panel story" aria-label="Phase story">
      <p className="eyebrow">Global footprint</p>
      <div className="half">
        <span>{stats.locations.length}</span>
        <p>countries carrying {phase.noun}.</p>
      </div>
      {lead && <p className="lead-copy">{lead.text}</p>}
      <div className="body-copy">
        {rest.map((insight) => (
          <p key={insight.text}>{insight.text}</p>
        ))}
      </div>

      <div className="scale-block">
        <div className="scale" />
        <div className="scale-labels">
          <span>Fewer {phase.noun}</span>
          <span>More</span>
        </div>
      </div>

      <h2>Coverage</h2>
      <div className="region-bar">
        {stats.regions.map((slice) => (
          <button
            key={slice.id}
            type="button"
            tabIndex={-1}
            aria-hidden="true"
            style={{ flexGrow: slice.countries, background: REGION_COLOR[slice.id] }}
            onClick={() => onRegion(region === slice.id ? null : slice.id)}
          />
        ))}
      </div>
      <ul className="region-list">
        {stats.regions.map((slice) => (
          <li key={slice.id}>
            <button
              type="button"
              aria-pressed={region === slice.id}
              className={region === slice.id ? 'is-on' : ''}
              onClick={() => onRegion(region === slice.id ? null : slice.id)}
            >
              <i style={{ background: REGION_COLOR[slice.id] }} />
              <span>
                {slice.id}
                <em>
                  {slice.countries} {slice.countries === 1 ? 'country' : 'countries'}
                </em>
              </span>
              <b>{formatCompact(slice.value)}</b>
            </button>
          </li>
        ))}
      </ul>

      <p className="source">
        {phase.summary} Source file · {phase.source}
      </p>
    </section>
  );
}

const FIELD_GROUP: Record<string, string> = {
  public_id: 'Identity',
  full_name: 'Identity',
  urn: 'Identity',
  pronoun: 'Identity',
  logo_url: 'Identity',
  public_profile_url: 'Identity',
  connections_count: 'Presence',
  followers_count: 'Presence',
  last_verified_at: 'Presence',
  location: 'Presence',
  location_country: 'Presence',
  headline: 'Presence',
  job_function: 'Work',
  seniority: 'Work',
  industry: 'Work',
  experience: 'Work',
  summary: 'Work',
  ingestion_tag: 'Work',
  profile_embedding: 'Work',
  education: 'Record',
  skills: 'Record',
  certifications: 'Record',
  courses: 'Record',
  languages: 'Record',
  badges: 'Record',
  volunteer_experiences: 'Record',
  projects: 'Record',
  honors: 'Record',
  organizations: 'Record',
  publications: 'Record',
  patents: 'Record',
};

const GROUP_ORDER = ['Identity', 'Presence', 'Work', 'Record'];

function FillCounts({ profiles }: { profiles: number }) {
  const rows = PROFILE_FIELDS.map((field, index) => ({
    ...field,
    index,
    group: FIELD_GROUP[field.key] ?? 'Record',
    count: filledCount(profiles, field.bps),
  }));

  return (
    <div className="profile-card">
      {GROUP_ORDER.map((group) => {
        const items = rows
          .filter((field) => field.group === group)
          .sort((a, b) => b.count - a.count || a.index - b.index);
        return (
          <section key={group} className="fill-group">
            <h3>{group}</h3>
            <ol className="fill-list">
              {items.map((field) => (
                <li key={field.key}>
                  <i className="field-icon" aria-hidden="true">
                    <FieldIcon name={field.key} />
                  </i>
                  <span>
                    {field.label}
                    {'note' in field && field.note ? <em>{field.note}</em> : null}
                    <b style={{ width: `${profiles > 0 ? (field.count / profiles) * 100 : 0}%` }} />
                  </span>
                  <strong>{formatFull(field.count)}</strong>
                </li>
              ))}
            </ol>
          </section>
        );
      })}
    </div>
  );
}

function FieldIcon({ name }: { name: string }) {
  const common = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  if (name === 'full_name' || name === 'pronoun') {
    return (
      <svg viewBox="0 0 24 24">
        <circle cx="12" cy="8" r="3" {...common} />
        <path d="M6 19c1.2-3 3.2-4.4 6-4.4S16.8 16 18 19" {...common} />
      </svg>
    );
  }
  if (name === 'public_id') {
    return (
      <svg viewBox="0 0 24 24">
        <rect x="4" y="6" width="16" height="12" rx="2" {...common} />
        <path d="M8 10h3M8 14h8" {...common} />
      </svg>
    );
  }
  if (name === 'urn' || name === 'public_profile_url') {
    return (
      <svg viewBox="0 0 24 24">
        <path d="M10 13a5 5 0 0 0 7.1.1l2-2a5 5 0 0 0-7.1-7.1l-1.1 1.1" {...common} />
        <path d="M14 11a5 5 0 0 0-7.1-.1l-2 2a5 5 0 0 0 7.1 7.1l1.1-1.1" {...common} />
      </svg>
    );
  }
  if (name === 'logo_url') {
    return (
      <svg viewBox="0 0 24 24">
        <rect x="4" y="5" width="16" height="14" rx="2" {...common} />
        <circle cx="9" cy="10" r="1.4" {...common} />
        <path d="M7 16l3.2-3.2L13 15.5 15.2 13 18 16" {...common} />
      </svg>
    );
  }
  if (name === 'connections_count' || name === 'followers_count' || name === 'organizations') {
    return (
      <svg viewBox="0 0 24 24">
        <circle cx="8" cy="9" r="2.2" {...common} />
        <circle cx="16" cy="9" r="2.2" {...common} />
        <path d="M4.8 17.5c.7-2 2.2-3 4.2-3s3.5 1 4.2 3M12.8 17.5c.7-2 2.2-3 4.2-3s3.5 1 4.2 3" {...common} />
      </svg>
    );
  }
  if (name === 'last_verified_at' || name === 'badges' || name === 'certifications' || name === 'honors') {
    return (
      <svg viewBox="0 0 24 24">
        <circle cx="12" cy="10" r="5" {...common} />
        <path d="M9.5 14.5 8.5 20l3.5-2 3.5 2-1-5.5" {...common} />
      </svg>
    );
  }
  if (name === 'location' || name === 'location_country') {
    return (
      <svg viewBox="0 0 24 24">
        <path d="M12 21s6-5.2 6-10a6 6 0 1 0-12 0c0 4.8 6 10 6 10Z" {...common} />
        <circle cx="12" cy="11" r="1.8" {...common} />
      </svg>
    );
  }
  if (name === 'headline' || name === 'summary' || name === 'publications') {
    return (
      <svg viewBox="0 0 24 24">
        <path d="M7 4.5h8l3 3V19a1.5 1.5 0 0 1-1.5 1.5h-9.5A1.5 1.5 0 0 1 5.5 19V6A1.5 1.5 0 0 1 7 4.5Z" {...common} />
        <path d="M15 4.8V8h3.2M8 12h8M8 16h6" {...common} />
      </svg>
    );
  }
  if (name === 'job_function' || name === 'experience' || name === 'industry') {
    return (
      <svg viewBox="0 0 24 24">
        <rect x="3.5" y="8" width="17" height="11" rx="1.6" {...common} />
        <path d="M9 8V6.4A1.4 1.4 0 0 1 10.4 5h3.2A1.4 1.4 0 0 1 15 6.4V8M3.5 12.5h17" {...common} />
      </svg>
    );
  }
  if (name === 'seniority' || name === 'skills' || name === 'profile_embedding') {
    return (
      <svg viewBox="0 0 24 24">
        <path d="M12 3.5 14.2 9H20l-4.6 3.4L17.2 18 12 14.8 6.8 18l1.8-5.6L4 9h5.8L12 3.5Z" {...common} />
      </svg>
    );
  }
  if (name === 'ingestion_tag' || name === 'languages') {
    return (
      <svg viewBox="0 0 24 24">
        <path d="M4 12a8 8 0 1 0 16 0A8 8 0 0 0 4 12Z" {...common} />
        <path d="M4 12h16M12 4c2.2 2.4 3.3 5.1 3.3 8S14.2 17.6 12 20c-2.2-2.4-3.3-5.1-3.3-8S9.8 6.4 12 4Z" {...common} />
      </svg>
    );
  }
  if (name === 'education' || name === 'courses') {
    return (
      <svg viewBox="0 0 24 24">
        <path d="M3 10 12 6l9 4-9 4-9-4Z" {...common} />
        <path d="M7 12.2V16c1.6 1.3 3.2 2 5 2s3.4-.7 5-2v-3.8" {...common} />
      </svg>
    );
  }
  if (name === 'volunteer_experiences') {
    return (
      <svg viewBox="0 0 24 24">
        <path d="M12 19s-6.5-3.8-6.5-8A3.5 3.5 0 0 1 12 8a3.5 3.5 0 0 1 6.5 3c0 4.2-6.5 8-6.5 8Z" {...common} />
      </svg>
    );
  }
  if (name === 'projects') {
    return (
      <svg viewBox="0 0 24 24">
        <path d="M4 8.5h6l2 2H20V18a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 18V8.5Z" {...common} />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24">
      <path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3 11c.4.5.7 1 .8 1.6h4.4c.1-.6.4-1.1.8-1.6A6 6 0 0 0 12 3Z" {...common} />
    </svg>
  );
}

function Dossier({
  phase,
  stats,
  row,
  place,
  onBack,
  onSelect,
}: {
  phase: PhaseFile;
  stats: PhaseStats;
  row: CountryRow;
  place: PlacePoint | undefined;
  onBack: () => void;
  onSelect: (code: string | null) => void;
}) {
  const above = row.rank > 1 ? stats.locations[row.rank - 2] : null;
  const below = stats.locations[row.rank] ?? null;
  return (
    <div className={phase.id === 'profile-graph' ? 'dossier is-profile' : 'dossier'}>
      <button type="button" className="back" onClick={onBack}>
        All countries
      </button>
      <div className="dossier-title">
        {row.code !== 'unknown' && <Flag code={row.code} className="lg" />}
        <div>
          <p className="eyebrow">{row.code === 'unknown' ? 'Off the map' : row.region}</p>
          <h2>{row.name}</h2>
        </div>
      </div>
      <p className="hero-num">{formatFull(row.value)}</p>
      <p className="hero-sub">{phase.noun}</p>
      {phase.id === 'profile-graph' && (
        <p className="index-note">Index note. Figures in this room can differ by up to 5%.</p>
      )}
      {row.code !== 'unknown' && (
        <p className="hint">
          Country {row.rank} of {stats.locations.length}
        </p>
      )}
      {phase.id === 'personal-email' && (
        <MailboxMix variant="list" heading="Mailbox mix" stats={stats} focus={row.code} />
      )}
      {phase.id === 'profile-graph' && <FillCounts profiles={row.value} />}

      {row.code === 'unknown' ? (
        <div className="body-copy">
          <p>These records have no country code in {phase.source}, so they stay in the total and off the planet.</p>
        </div>
      ) : (
        <>
          {place && !place.polygon && (
            <p className="hint">Shown as a beacon. This place is smaller than the country shapes on the base map.</p>
          )}
          {above && (
            <button type="button" className="jump" onClick={() => onSelect(above.code)}>
              <Flag code={above.code} />
              <span>
                <small>Country above</small>
                <strong>{above.name}</strong>
              </span>
              <b>{formatCompact(above.value)}</b>
            </button>
          )}
          {below && row.rank > 0 && (
            <button type="button" className="jump" onClick={() => onSelect(below.code)}>
              <Flag code={below.code} />
              <span>
                <small>Country below</small>
                <strong>{below.name}</strong>
              </span>
              <b>{formatCompact(below.value)}</b>
            </button>
          )}
        </>
      )}
    </div>
  );
}
