import { phaseInsights, type CountryRow, type PhaseStats } from '../lib/analytics';
import { formatCompact, formatFull } from '../lib/format';
import type { PlacePoint } from '../lib/land';
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
    <div className="dossier">
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
      {row.code !== 'unknown' && (
        <p className="hint">
          Country {row.rank} of {stats.locations.length}
        </p>
      )}
      {phase.id === 'personal-email' && (
        <MailboxMix variant="list" heading="Mailbox mix" stats={stats} focus={row.code} />
      )}

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
