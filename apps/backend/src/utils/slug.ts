const TRANSLITERATION_MAP: Record<string, string> = {
  á: 'a',
  é: 'e',
  í: 'i',
  ó: 'o',
  ú: 'u',
  ñ: 'n',
  ü: 'u',
  Á: 'a',
  É: 'e',
  Í: 'i',
  Ó: 'o',
  Ú: 'u',
  Ñ: 'n',
  Ü: 'u',
};

/**
 * Calendar date (YYYY-MM-DD) in America/Montevideo for slug disambiguation —
 * e.g. same tour name on different days (multi-function Tickantel events).
 */
export function formatUruguayDateForEventSlug(date: Date): string {
  return new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'America/Montevideo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

export function generateSlug(name: string): string {
  let slug = name.toLowerCase();

  // Transliterate Spanish characters
  for (const [from, to] of Object.entries(TRANSLITERATION_MAP)) {
    slug = slug.replaceAll(from, to);
  }

  // Replace non-alphanumeric characters with hyphens
  slug = slug.replace(/[^a-z0-9]+/g, '-');

  // Collapse multiple hyphens and trim
  slug = slug.replace(/-+/g, '-').replace(/^-|-$/g, '');

  return slug;
}

export async function generateUniqueSlug(
  name: string,
  checkExists: (slug: string) => Promise<boolean>,
): Promise<string> {
  const baseSlug = generateSlug(name);
  if (!(await checkExists(baseSlug))) {
    return baseSlug;
  }

  let suffix = 2;
  while (true) {
    const candidate = `${baseSlug}-${suffix}`;
    if (!(await checkExists(candidate))) {
      return candidate;
    }
    suffix++;
  }
}
