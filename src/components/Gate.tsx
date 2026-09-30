import { type FormEvent, type ReactNode, useId, useState } from 'react';
import { asset } from '../lib/asset';

const PASSWORD_SHA256 = '4892ce767ed400115c44be8d3a88c497b08b9576bbfa0a74ff2edc1b9d478a68';
const SESSION_KEY = 'mawsool-earth-open';

function hex(buffer: ArrayBuffer) {
  return [...new Uint8Array(buffer)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

function same(left: string, right: string) {
  if (left.length !== right.length) return false;
  let diff = 0;
  for (let index = 0; index < left.length; index += 1) {
    diff |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }
  return diff === 0;
}

export function Gate({ children }: { children: ReactNode }) {
  const fieldId = useId();
  const errorId = useId();
  const [open, setOpen] = useState(() => sessionStorage.getItem(SESSION_KEY) === '1');
  const [password, setPassword] = useState('');
  const [shown, setShown] = useState(false);
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState(false);

  if (open) return children;

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(false);
    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(password));
    const accepted = same(hex(digest), PASSWORD_SHA256);
    setBusy(false);
    if (!accepted) {
      setError(true);
      return;
    }
    sessionStorage.setItem(SESSION_KEY, '1');
    setOpen(true);
  }

  return (
    <main className="gate">
      <div className="gate-glow gate-glow-a" aria-hidden="true" />
      <div className="gate-glow gate-glow-b" aria-hidden="true" />
      <div className="gate-orbit" aria-hidden="true" />
      <form className={error ? 'gate-card is-wrong' : 'gate-card'} onSubmit={submit}>
        <img src={asset('brand/logo-on-dark.svg')} alt="Mawsool" />
        <p className="eyebrow">Private room</p>
        <h1>Mawsool Earth</h1>
        <p className="gate-copy">Three rooms are inside. Pick one after you enter.</p>
        <ul className="gate-rooms">
          <li>
            <small>01</small>
            <strong>Personal Email</strong>
            <em>Counted by country</em>
          </li>
          <li>
            <small>02</small>
            <strong>Job Change</strong>
            <em>Radar on the earth</em>
          </li>
          <li>
            <small>03</small>
            <strong>1B Profiles</strong>
            <em>Field counts for the database</em>
          </li>
        </ul>
        <label htmlFor={fieldId}>Password</label>
        <div className="gate-field">
          <input
            id={fieldId}
            type={shown ? 'text' : 'password'}
            name="password"
            autoComplete="current-password"
            autoFocus
            value={password}
            spellCheck={false}
            aria-invalid={error}
            aria-describedby={error ? errorId : undefined}
            onChange={(event) => {
              setPassword(event.target.value);
              setError(false);
            }}
          />
          <button type="button" aria-pressed={shown} onClick={() => setShown((value) => !value)}>
            {shown ? 'Hide' : 'Show'}
          </button>
        </div>
        <p id={errorId} className="gate-error" role="alert">
          {error ? 'That password does not open the room.' : ''}
        </p>
        <button className="gate-enter" type="submit" disabled={busy || password.length === 0}>
          {busy ? 'Checking' : 'Enter'}
        </button>
      </form>
    </main>
  );
}
