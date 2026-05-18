const UNIQUE_VIOLATION_ERROR_CODE = '23505';

export function isUniqueViolation(error: unknown): boolean {
  const code =
    typeof error === 'object' && error !== null
      ? (error as {code?: unknown}).code
      : undefined;

  return code === UNIQUE_VIOLATION_ERROR_CODE;
}
