import type { PhaseFile } from '../phases/types';
import { asset } from '../lib/asset';
import { formatCompact } from '../lib/format';

type Props = {
  phases: PhaseFile[];
  phase: PhaseFile;
  total: number;
  orbit: boolean;
  onPhase: (id: string) => void;
  onOrbit: (on: boolean) => void;
};

export function TopBar({ phases, phase, total, orbit, onPhase, onOrbit }: Props) {
  return (
    <header className="topbar">
      <div className="brand">
        <img src={asset('brand/logo-on-dark.svg')} alt="Mawsool" />
        <div>
          <strong>Earth Analytics</strong>
          <span>Records, by country</span>
        </div>
      </div>

      <div className="phases" role="tablist" aria-label="Analytics phases">
        {phases.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={item.id === phase.id}
            className={item.id === phase.id ? 'is-on' : ''}
            onClick={() => onPhase(item.id)}
          >
            <small>{item.code}</small>
            {item.title}
          </button>
        ))}
      </div>

      <div className="top-actions">
        <p className="top-total">
          <strong>{formatCompact(total)}</strong>
          <span>{phase.noun}</span>
        </p>
        <button type="button" className={orbit ? 'orbit is-on' : 'orbit'} onClick={() => onOrbit(!orbit)}>
          <i />
          {orbit ? 'Orbiting' : 'Resume orbit'}
        </button>
      </div>
    </header>
  );
}
