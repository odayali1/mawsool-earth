import { flagUrl } from '../lib/flags';

type Props = {
  code: string;
  className?: string;
};

export function Flag({ code, className = '' }: Props) {
  const src = flagUrl(code);
  if (!src) return <span className={`flag flag-empty ${className}`} aria-hidden="true" />;
  return <img className={`flag ${className}`} src={src} alt="" draggable={false} />;
}
