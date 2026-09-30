const files = import.meta.glob('../../node_modules/flag-icons/flags/4x3/*.svg', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>;

const byCode = new Map<string, string>();
for (const [path, url] of Object.entries(files)) {
  const file = path.split(/[/\\]/).pop()?.replace('.svg', '').toUpperCase();
  if (file && url) byCode.set(file, url);
}

/** SVG flag from flag-icons (MIT). Returns null when that code has no flag. */
export function flagUrl(code: string) {
  return byCode.get(code.toUpperCase()) ?? null;
}
