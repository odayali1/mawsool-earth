import type { PhaseFile } from '../phases/types';
import { asset } from '../lib/asset';
import { formatCompact } from '../lib/format';

type Props = {
  phase: PhaseFile;
  total: number;
  orbit: boolean;
  room: 'earth' | 'engine';
  onPhase: (id: string) => void;
  onRoom: (room: 'earth' | 'engine') => void;
  onOrbit: (on: boolean) => void;
};

export function TopBar({ phase, total, orbit, room, onPhase, onRoom, onOrbit }: Props) {
  const emailOn = room === 'earth' && phase.id === 'personal-email';
  const graphOn = room === 'earth' && phase.id === 'profile-graph';
  const engineOn = room === 'engine';

  return (
    <header className="topbar">
      <div className="brand">
        <img src={asset('brand/logo-on-dark.svg')} alt="Mawsool" />
        <div>
          <strong>Earth Analytics</strong>
          <span>Three rooms</span>
        </div>
      </div>

      <div className="phases" role="tablist" aria-label="Three rooms">
        <button
          type="button"
          role="tab"
          aria-selected={emailOn}
          className={emailOn ? 'room-tab room-email is-on' : 'room-tab room-email'}
          onClick={() => onPhase('personal-email')}
        >
          <span className="tab-icons" aria-hidden="true">
            <PersonIcon />
            <MailIcon />
          </span>
          <small>01</small>
          <span>
            <strong>Personal Email</strong>
            <em>By country</em>
          </span>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={engineOn}
          className={engineOn ? 'room-tab room-engine is-on' : 'room-tab room-engine'}
          onClick={() => onRoom('engine')}
        >
          <span className="tab-icons" aria-hidden="true">
            <EngineIcon />
          </span>
          <small>02</small>
          <span>
            <strong>Job Change</strong>
            <em>Radar on earth</em>
          </span>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={graphOn}
          className={graphOn ? 'room-tab room-graph is-on' : 'room-tab room-graph'}
          onClick={() => onPhase('profile-graph')}
        >
          <span className="tab-icons" aria-hidden="true">
            <ProfilesIcon />
          </span>
          <small>03</small>
          <span>
            <strong>1B Profiles</strong>
            <em>Fill counts</em>
          </span>
        </button>
      </div>

      <div className="top-actions">
        {room === 'earth' && (
          <p className="top-total">
            <strong>{formatCompact(total)}</strong>
            <span>{phase.noun}</span>
          </p>
        )}
        <button type="button" className={orbit ? 'orbit is-on' : 'orbit'} onClick={() => onOrbit(!orbit)}>
          <i />
          {orbit ? 'Orbiting' : 'Resume orbit'}
        </button>
      </div>
    </header>
  );
}

function PersonIcon() {
  return (
    <svg className="tab-icon" viewBox="0 0 24 24">
      <circle cx="12" cy="8" r="3.1" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M5.6 19.2c1.15-3.15 3.4-4.7 6.4-4.7s5.25 1.55 6.4 4.7"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg className="tab-icon" viewBox="0 0 24 24">
      <rect x="3.4" y="5.4" width="17.2" height="13.2" rx="2" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M4.4 7.4 12 13.1l7.6-5.7"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function EngineIcon() {
  return (
    <svg className="tab-icon" viewBox="0 0 24 24">
      <path
        d="M4 10.5h2.2l1.6-2.2h6.4l1.6 2.2H20v5.2h-1.7a2.7 2.7 0 0 1-5.2 0H9.9a2.7 2.7 0 0 1-5.2 0H4v-5.2Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <path d="M9.2 10.6h5.6" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

function ProfilesIcon() {
  return (
    <svg className="tab-icon" viewBox="0 0 24 24">
      <rect x="4" y="4.2" width="16" height="4.2" rx="1.2" fill="none" stroke="currentColor" strokeWidth="1.7" />
      <rect x="4" y="9.9" width="16" height="4.2" rx="1.2" fill="none" stroke="currentColor" strokeWidth="1.7" />
      <rect x="4" y="15.6" width="16" height="4.2" rx="1.2" fill="none" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  );
}
