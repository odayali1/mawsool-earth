export function formatFull(value: number) {
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(Math.round(value));
}

export function formatCompact(value: number) {
  return new Intl.NumberFormat('en', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value);
}

/** Percent points already scaled, such as 42.87 → "42.87%". */
export function formatPoints(points: number) {
  if (!Number.isFinite(points) || points <= 0) return '0%';
  if (points < 0.005) return '<0.01%';
  return `${points.toFixed(2)}%`;
}

export function formatPct(ratio: number) {
  if (!Number.isFinite(ratio) || ratio <= 0) return '0%';
  const percent = ratio * 100;
  if (percent >= 10) return `${percent.toFixed(1)}%`;
  if (percent >= 1) return `${percent.toFixed(1)}%`;
  return `${percent.toFixed(2)}%`;
}

export function formatTimes(ratio: number) {
  if (!Number.isFinite(ratio) || ratio <= 0) return '0×';
  if (ratio >= 100) return `${Math.round(ratio).toLocaleString('en-US')}×`;
  return `${ratio.toFixed(ratio >= 10 ? 0 : 1)}×`;
}

export function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (char) => {
    switch (char) {
      case '&':
        return '&amp;';
      case '<':
        return '&lt;';
      case '>':
        return '&gt;';
      case '"':
        return '&quot;';
      default:
        return '&#39;';
    }
  });
}

export function joinNames(names: string[]) {
  if (names.length <= 1) return names[0] ?? '';
  if (names.length === 2) return `${names[0]} and ${names[1]}`;
  return `${names.slice(0, -1).join(', ')}, and ${names[names.length - 1]}`;
}
