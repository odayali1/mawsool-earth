import { useEffect, useMemo, useRef } from 'react';
import type { CountryRow, PhaseStats } from '../lib/analytics';
import { ramp } from '../lib/color';
import { formatCompact, formatFull, formatPct } from '../lib/format';
import { useCountUp } from '../lib/useCountUp';
import type { PhaseFile } from '../phases/types';
import type { RegionId } from '../lib/regions';

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
  const total = useCountUp(stats.total);
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
    <section className="panel deck" aria-label="Personal email ranking">
      <p className="eyebrow">{phase.kicker}</p>
      <h1>{phase.title}</h1>
      <p className="hero-num">{formatFull(total)}</p>
      <p className="hero-sub">{phase.noun} in this phase</p>
      <p className="hint">Taller and brighter on the planet means more {phase.noun}.</p>

      <div className="stat-grid">
        <article>
          <small>Countries</small>
          <strong>{formatFull(stats.locations.length)}</strong>
        </article>
        <article>
          <small>Leader</small>
          <strong>{formatPct(leader.share)}</strong>
        </article>
        <article>
          <small>Top 5</small>
          <strong>{formatPct(stats.top5Share)}</strong>
        </article>
        <article>
          <small>Top 10</small>
          <strong>{formatPct(stats.top10Share)}</strong>
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
            <em>{stats.unknownRank ? `would rank ${stats.unknownRank}` : formatPct(stats.unknown.share)}</em>
          </span>
        </button>
      )}

      <div className="list-head">
        <span>{region ? shown.length : `${shown.length} countries`}</span>
        <span>Share</span>
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
  const width = leaderValue > 0 ? (row.value / leaderValue) * 100 : 0;
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
      <span className="iso">{row.code}</span>
      <span className="who">
        <strong>{row.name}</strong>
        <i>
          <b style={{ width: `${width}%`, background: ramp(Math.sqrt(row.value / leaderValue)) }} />
        </i>
      </span>
      <span className="val">
        <strong>{formatCompact(row.value)}</strong>
        <small>{formatPct(row.share)}</small>
      </span>
    </button>
  );
}
