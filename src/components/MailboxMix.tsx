import { useMemo } from 'react';
import type { PhaseStats } from '../lib/analytics';
import { formatPoints } from '../lib/format';
import { MAILBOXES, PERSONAL_EMAIL_PCT, countryMailboxPct, type MixRecord } from '../lib/mailboxes';
import { Flag } from './Flag';
import { MailboxIcon } from './MailboxIcon';

type Props = {
  heading: string;
  flagCode?: string;
  variant: 'dock' | 'list';
  stats: PhaseStats;
  /** Null shows the phase percentages. A country code shows that country's spread. */
  focus: string | null;
};

function recordsOf(stats: PhaseStats): MixRecord[] {
  const records = stats.locations.map((row) => ({
    code: row.code,
    value: row.value,
    region: row.region,
  }));
  if (stats.unknown) {
    records.push({ code: stats.unknown.code, value: stats.unknown.value, region: 'Other' });
  }
  return records;
}

export function MailboxMix({ heading, flagCode, variant, stats, focus }: Props) {
  const points = useMemo(() => countryMailboxPct(recordsOf(stats), focus), [stats, focus]);
  const mixTotal = MAILBOXES.reduce((sum, box) => sum + points[box.id], 0);

  if (variant === 'list') {
    return (
      <div className="mailbox-list">
        <p className="eyebrow">{heading}</p>
        <p className="mailbox-personal">
          <strong>{formatPoints(PERSONAL_EMAIL_PCT)}</strong>
          <span>personal emails</span>
        </p>
        <ul>
          {MAILBOXES.map((box) => (
            <li key={box.id}>
              <MailboxIcon id={box.id} />
              <span>{box.label}</span>
              <i style={{ width: `${(points[box.id] / mixTotal) * 100}%`, background: box.color }} />
              <b>{formatPoints(points[box.id])}</b>
            </li>
          ))}
        </ul>
        <p className="hint">Within 10% of the phase mix.</p>
      </div>
    );
  }

  return (
    <section className="mailbox-dock" aria-label="Mailbox mix">
      <div className="mailbox-top">
        <div className="mailbox-title">
          {flagCode && <Flag code={flagCode} />}
          <p className="eyebrow">{heading}</p>
        </div>
        <p className="mailbox-personal">
          <strong>{formatPoints(PERSONAL_EMAIL_PCT)}</strong>
          <span>personal emails</span>
        </p>
      </div>
      <div className="mix-bar" aria-hidden="true">
        {MAILBOXES.map((box) => (
          <i key={box.id} style={{ flexGrow: points[box.id], background: box.color }} title={box.label} />
        ))}
      </div>
      <ul className="mailbox-chips">
        {MAILBOXES.map((box) => (
          <li key={box.id} className={box.pct >= 10 ? 'is-lead' : ''}>
            <MailboxIcon id={box.id} />
            <span>{box.label}</span>
            <b>{formatPoints(points[box.id])}</b>
          </li>
        ))}
      </ul>
      <p className="hint">
        {focus
          ? 'Within 10% of the phase mix.'
          : 'Open a country. Its mix stays within 10% of these figures.'}
      </p>
    </section>
  );
}
