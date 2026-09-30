import { useMemo, useState } from 'react';
import { formatFull } from '../lib/format';

/** Shape of the documented refresh: 500M hits, 97% unchanged, 15M surgical updates. */
const DOCUMENTED_BOOK = 500_000_000;
const STATIC_SHARE = 0.97;
const BOOK_MIN = 1_000_000;
const BOOK_MAX = 1_000_000_000;

const PRESETS = [
  { id: 'documented', label: '500M hits', book: DOCUMENTED_BOOK },
  { id: 'exact', label: '310M exact', book: 310_000_000 },
  { id: 'graph', label: '1B graph', book: 1_000_000_000 },
] as const;

function bookFromSlider(position: number) {
  const t = position / 1000;
  return Math.round(BOOK_MIN * (BOOK_MAX / BOOK_MIN) ** t);
}

function sliderFromBook(book: number) {
  const t = Math.log(book / BOOK_MIN) / Math.log(BOOK_MAX / BOOK_MIN);
  return Math.round(Math.min(1, Math.max(0, t)) * 1000);
}

function money(value: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);
}

function unitPrice(cents: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(cents / 100);
}

type Lock = { code: string; name: string };

export function JobChangeEngine({ locks }: { locks: Lock[] }) {
  const [book, setBook] = useState(DOCUMENTED_BOOK);
  const [cents, setCents] = useState(1);

  const model = useMemo(() => {
    const unchanged = Math.round(book * STATIC_SHARE);
    const surgical = book - unchanged;
    return {
      unchanged,
      surgical,
      loss: unchanged * (cents / 100),
    };
  }, [book, cents]);

  return (
    <section className="engine" aria-label="Job change engine">
      <aside className="engine-card haystack">
        <header>
          <i />
          <div>
            <strong>The haystack</strong>
            <span>Full recrawl</span>
          </div>
        </header>
        <p>
          <span>Unchanged</span>
          <b>{formatFull(model.unchanged)}</b>
        </p>
        <p className="is-waste">
          <span>Status</span>
          <b>Wasted</b>
        </p>
        <div className="mixline" aria-hidden="true">
          <i />
        </div>
      </aside>

      <aside className="engine-card needles">
        <header>
          <i />
          <div>
            <strong>The needles</strong>
            <span>Webhook</span>
          </div>
        </header>
        <p>
          <span>Surgical</span>
          <b>{formatFull(model.surgical)}</b>
        </p>
        <ul>
          {locks.length === 0 && <li>Sweeping</li>}
          {locks.map((lock) => (
            <li key={lock.code}>
              <em />
              {lock.name}
              <b>Needs update</b>
            </li>
          ))}
        </ul>
      </aside>

      <form className="engine-bar" onSubmit={(event) => event.preventDefault()}>
        <div className="engine-controls">
          <div className="engine-presets" role="group" aria-label="Book size presets">
            {PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                className={book === preset.book ? 'is-on' : ''}
                onClick={() => setBook(preset.book)}
              >
                {preset.label}
              </button>
            ))}
          </div>
          <label>
            <span>Records in the refresh</span>
            <strong>{formatFull(book)}</strong>
            <input
              type="range"
              min={0}
              max={1000}
              value={sliderFromBook(book)}
              aria-valuetext={formatFull(book)}
              onChange={(event) => setBook(bookFromSlider(Number(event.target.value)))}
            />
          </label>
          <label>
            <span>Cost per check</span>
            <strong>{unitPrice(cents)}</strong>
            <input
              type="range"
              min={0}
              max={100}
              value={cents}
              aria-valuetext={unitPrice(cents)}
              onChange={(event) => setCents(Number(event.target.value))}
            />
          </label>
        </div>
        <dl className="engine-counters">
          <div>
            <dt>Full refresh</dt>
            <dd>{formatFull(book)}</dd>
          </div>
          <div>
            <dt>Unchanged</dt>
            <dd>{formatFull(model.unchanged)}</dd>
          </div>
          <div>
            <dt>Surgical updates</dt>
            <dd>{formatFull(model.surgical)}</dd>
          </div>
          <div className="is-loss">
            <dt>Lost on a full refresh</dt>
            <dd>{money(model.loss)}</dd>
          </div>
        </dl>
      </form>
    </section>
  );
}
