import type { PhaseFile } from './types';

/**
 * Every JSON file in this folder is a phase.
 * Add the next record set with:
 *   node scripts/import-summary.mjs "your-file.csv" your-phase-id --order 2 --code 02 --title "..." --noun "..." --singular "..." --kicker "Phase 02" --summary "..."
 * The new file shows up here on its own.
 */
const modules = import.meta.glob('./*.json', { eager: true });

function unwrap(mod: unknown): PhaseFile {
  if (mod && typeof mod === 'object' && 'default' in mod) {
    return (mod as { default: PhaseFile }).default;
  }
  return mod as PhaseFile;
}

export const phases: PhaseFile[] = Object.values(modules)
  .map(unwrap)
  .sort((a, b) => a.order - b.order);
