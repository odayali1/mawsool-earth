const STOPS: Array<[number, [number, number, number]]> = [
  [0, [36, 20, 96]],
  [0.28, [93, 23, 213]],
  [0.58, [36, 104, 255]],
  [0.82, [0, 196, 245]],
  [1, [150, 244, 255]],
];

function mix(a: [number, number, number], b: [number, number, number], t: number): [number, number, number] {
  return [
    Math.round(a[0] + (b[0] - a[0]) * t),
    Math.round(a[1] + (b[1] - a[1]) * t),
    Math.round(a[2] + (b[2] - a[2]) * t),
  ];
}

export function ramp(t: number) {
  const clamped = Math.min(1, Math.max(0, t));
  let index = 1;
  while (index < STOPS.length && STOPS[index][0] < clamped) index += 1;
  const [t0, c0] = STOPS[index - 1];
  const [t1, c1] = STOPS[Math.min(index, STOPS.length - 1)];
  const span = t1 - t0 || 1;
  const [r, g, b] = mix(c0, c1, (clamped - t0) / span);
  return `rgb(${r}, ${g}, ${b})`;
}

export function extrusion(value: number, max: number, hot: boolean) {
  if (value <= 0 || max <= 0) return 0.001;
  const t = Math.sqrt(value / max);
  return 0.004 + t * 0.1 + (hot ? 0.018 : 0);
}

export type LandTone = 'empty' | 'dim' | 'hot' | 'idle';

export function capColor(value: number, max: number, tone: LandTone) {
  if (tone === 'empty') return 'rgba(170, 200, 255, 0.045)';
  if (tone === 'dim') return 'rgba(90, 110, 150, 0.08)';
  if (tone === 'hot') return '#b8f6ff';
  return ramp(Math.sqrt(value / Math.max(max, 1)));
}

export function sideColor(tone: LandTone) {
  if (tone === 'empty') return 'rgba(0, 0, 0, 0)';
  if (tone === 'dim') return 'rgba(12, 16, 32, 0.2)';
  if (tone === 'hot') return 'rgba(0, 190, 230, 0.72)';
  return 'rgba(28, 10, 72, 0.8)';
}

export function strokeColor(tone: LandTone) {
  if (tone === 'hot') return '#d9fbff';
  if (tone === 'dim') return 'rgba(140, 160, 190, 0.12)';
  if (tone === 'empty') return 'rgba(170, 210, 255, 0.2)';
  return 'rgba(190, 236, 255, 0.38)';
}
