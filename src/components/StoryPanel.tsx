import { phaseInsights, regionShareOf, type CountryRow, type PhaseStats } from '../lib/analytics';
import { formatCompact, formatFull, formatPct, formatTimes } from '../lib/format';
import type { PlacePoint } from '../lib/land';
import { REGION_COLOR, type RegionId } from '../lib/regions';
import type { PhaseFile } from '../phases/types';

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
      <p className="eyebrow">The shape of this phase</p>
      <div className="half">
        <span>{stats.halfCount}</span>
        <p>
          {stats.halfCount === 1 ? 'country holds' : 'countries hold'} half of all {phase.noun} in this phase.
        </p>
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

      <h2>Where they sit</h2>
      <div className="region-bar">
        {stats.regions.map((slice) => (
          <button
            key={slice.id}
            type="button"
            tabIndex={-1}
            aria-hidden="true"
            style={{ flexGrow: slice.value, background: REGION_COLOR[slice.id] }}
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
              <span>{slice.id}</span>
              <b>{formatPct(slice.share)}</b>
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
  const neighbor =
    row.code === 'unknown'
      ? null
      : row.rank === 1 && below
        ? `${formatCompact(row.value - below.value)} ahead of ${below.name}.`
        : above
          ? `${formatCompact(above.value - row.value)} behind ${above.name}.`
          : null;

  return (
    <div className="dossier">
      <button type="button" className="back" onClick={onBack}>
        All countries
      </button>
      <p className="eyebrow">{row.code === 'unknown' ? 'Off the map' : row.region}</p>
      <div className="dossier-title">
        {row.code !== 'unknown' && <span className="iso lg">{row.code}</span>}
        <h2>{row.name}</h2>
      </div>
      <p className="hero-num">{formatFull(row.value)}</p>
      <p className="hero-sub">{phase.noun}</p>

      {row.code === 'unknown' ? (
        <div className="body-copy">
          <p>
            These records have no country code in {phase.source}, so they stay in the total and off the planet.
            {stats.unknownRank ? ` Placed among the countries, they would rank ${stats.unknownRank}.` : ''}
          </p>
        </div>
      ) : (
        <>
          <div className="share-row">
            <div
              className="ring"
              style={{
                background: `conic-gradient(#00d2ff ${Math.max(0, Math.min(1, row.share)) * 360}deg, rgba(255,255,255,0.08) 0deg)`,
              }}
            >
              <div>
                <strong>{formatPct(row.share)}</strong>
                <small>of phase</small>
              </div>
            </div>
            <div className="facts">
              <article>
                <small>Rank</small>
                <strong>#{row.rank}</strong>
                <em>of {stats.locations.length}</em>
              </article>
              <article>
                <small>Versus median</small>
                <strong>{formatTimes(stats.median > 0 ? row.value / stats.median : 0)}</strong>
                <em>the middle country</em>
              </article>
              <article>
                <small>Inside {row.region}</small>
                <strong>{formatPct(regionShareOf(stats, row))}</strong>
                <em>of that region</em>
              </article>
              <article>
                <small>Mapped share</small>
                <strong>{formatPct(stats.mappedTotal > 0 ? row.value / stats.mappedTotal : 0)}</strong>
                <em>excluding unmapped</em>
              </article>
            </div>
          </div>
          {neighbor && <p className="lead-copy slim">{neighbor}</p>}
          {place && !place.polygon && (
            <p className="hint">
              Shown as a beacon. This place is smaller than the country shapes on the base map.
            </p>
          )}
          {above && (
            <button type="button" className="jump" onClick={() => onSelect(above.code)}>
              <small>Country above</small>
              <strong>{above.name}</strong>
              <b>{formatCompact(above.value)}</b>
            </button>
          )}
          {below && row.rank > 0 && (
            <button type="button" className="jump" onClick={() => onSelect(below.code)}>
              <small>Country below</small>
              <strong>{below.name}</strong>
              <b>{formatCompact(below.value)}</b>
            </button>
          )}
        </>
      )}
    </div>
  );
}
