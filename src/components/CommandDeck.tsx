import { useEffect, useMemo, useRef } from 'react';
import type { CountryRow, PhaseStats } from '../lib/analytics';
import { presence, ramp } from '../lib/color';
import { formatCompact, formatFull } from '../lib/format';
import { PROFILE_TOTAL } from '../lib/profile-fills';
import { useCountUp } from '../lib/useCountUp';
import type { PhaseFile } from '../phases/types';
import type { RegionId } from '../lib/regions';
import { Flag } from './Flag';

type Props = {
  phase: PhaseFile;
  stats: PhaseStats;
  query: string;
  region: RegionId | null;
  hover: string | null;
  selected: string | null;
  onQuery: (value: string) => void;
  onRegion: (region: RegionId | null) => void;
  onHover: (code: string | null) => void;
  onSelect: (code: string | null) => void;
};

export function CommandDeck({
  phase,
  stats,
  query,
  region,
  hover,
  selected,
  onQuery,
  onRegion,
  onHover,
  onSelect,
}: Props) {
  const searchRef = useRef<HTMLInputElement>(null);
  const graph = phase.id === 'profile-graph';
  const total = useCountUp(graph ? PROFILE_TOTAL : stats.total);
  const leader = stats.leader;

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== '/' || event.metaKey || event.ctrlKey || event.altKey) return;
      const tag = (event.target as HTMLElement | null)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      event.preventDefault();
      searchRef.current?.focus();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    if (!selected || selected === 'unknown') return;
    document.getElementById(`country-${selected}`)?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [selected]);

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return stats.locations.filter((row) => {
      if (region && row.region !== region) return false;
      if (!q) return true;
      return row.name.toLowerCase().includes(q) || row.code.toLowerCase().includes(q);
    });
  }, [stats.locations, query, region]);

  const unknownVisible =
    stats.unknown &&
    !region &&
    (!query.trim() ||
      'unknown'.includes(query.trim().toLowerCase()) ||
      stats.unknown.name.toLowerCase().includes(query.trim().toLowerCase()));

  return (
    <section className="panel deck" aria-label={graph ? 'Profile ranking' : 'Personal email ranking'}>
      <p className="eyebrow">{phase.kicker}</p>
      <h1>{phase.title}</h1>
      <p className="hero-num">{formatFull(total)}</p>
      <p className="hero-sub">{graph ? 'profiles in the database' : `${phase.noun} in this phase`}</p>
      <p className="hint">
        {graph
          ? 'Open a country. Its card counts how many of its profiles carry each field. Figures in this room can differ by up to 5%.'
          : 'Open any country. The number is the records on file.'}
      </p>

      <div className="stat-grid">
        <article>
          <small>Countries</small>
          <strong>{formatFull(stats.locations.length)}</strong>
        </article>
        <article>
          <small>Regions</small>
          <strong>{formatFull(stats.regions.length)}</strong>
        </article>
        <article>
          <small>Unmapped</small>
          <strong>{stats.unknown ? formatCompact(stats.unknown.value) : '0'}</strong>
        </article>
        <article>
          <small>Broadest reach</small>
          <strong className="stat-name">{stats.regions[0]?.id ?? '—'}</strong>
        </article>
      </div>

      <label className="search">
        <span className="sr">Search countries</span>
        <input
          ref={searchRef}
          value={query}
          placeholder="Search countries"
          onChange={(event) => onQuery(event.target.value)}
        />
        <kbd>/</kbd>
      </label>

      {region && (
        <button type="button" className="filter-chip" onClick={() => onRegion(null)}>
          {region}
          <span>Clear</span>
        </button>
      )}

      {unknownVisible && stats.unknown && (
        <button
          type="button"
          className={selected === 'unknown' ? 'ghost-card is-on' : 'ghost-card'}
          onClick={() => onSelect(selected === 'unknown' ? null : 'unknown')}
        >
          <span>
            <small>Unmapped</small>
            <strong>{stats.unknown.name}</strong>
          </span>
          <span>
            <b>{formatCompact(stats.unknown.value)}</b>
            <em>no country code</em>
          </span>
        </button>
      )}

      <div className="list-head">
        <span>{region ? shown.length : `${shown.length} countries`}</span>
        <span>{graph ? 'Profiles' : 'Records'}</span>
      </div>
      <ol className="rank-list">
        {shown.map((row) => (
          <li key={row.code}>
            <CountryButton
              row={row}
              leaderValue={leader.value}
              active={selected === row.code}
              hot={hover === row.code}
              onHover={onHover}
              onSelect={onSelect}
            />
          </li>
        ))}
        {shown.length === 0 && <li className="empty">No country matches that search.</li>}
      </ol>
    </section>
  );
}

function CountryButton({
  row,
  leaderValue,
  active,
  hot,
  onHover,
  onSelect,
}: {
  row: CountryRow;
  leaderValue: number;
  active: boolean;
  hot: boolean;
  onHover: (code: string | null) => void;
  onSelect: (code: string | null) => void;
}) {
  const depth = 34 + presence(row.value, leaderValue) * 66;
  return (
    <button
      id={`country-${row.code}`}
      type="button"
      className={active ? 'row is-on' : hot ? 'row is-hot' : 'row'}
      aria-pressed={active}
      onMouseEnter={() => onHover(row.code)}
      onMouseLeave={() => onHover(null)}
      onFocus={() => onHover(row.code)}
      onBlur={() => onHover(null)}
      onClick={() => onSelect(active ? null : row.code)}
    >
      <span className={`rank r${Math.min(row.rank, 4)}`}>{String(row.rank).padStart(2, '0')}</span>
      <Flag code={row.code} />
      <span className="who">
        <strong>{row.name}</strong>
        <i>
          <b style={{ width: `${depth}%`, background: ramp(0.4 + presence(row.value, leaderValue) * 0.6) }} />
        </i>
      </span>
      <span className="val">
        <strong>{formatCompact(row.value)}</strong>
      </span>
    </button>
  );
}
