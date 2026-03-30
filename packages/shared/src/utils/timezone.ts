/**
 * Maps a country code (ISO 3166-1 alpha-2) to its primary IANA timezone.
 * Currently supports Uruguay and Argentina only.
 */
const COUNTRY_TIMEZONE_MAP: Record<string, string> = {
  UY: 'America/Montevideo',
  AR: 'America/Argentina/Buenos_Aires',
};

const DEFAULT_TIMEZONE = 'America/Montevideo';

/**
 * Returns the IANA timezone identifier for a given country code.
 * Falls back to America/Montevideo (Uruguay) if the country is not mapped.
 */
export function getTimezoneForCountry(
  countryCode: string | null | undefined,
): string {
  if (!countryCode) return DEFAULT_TIMEZONE;
  return COUNTRY_TIMEZONE_MAP[countryCode.toUpperCase()] ?? DEFAULT_TIMEZONE;
}
