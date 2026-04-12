/**
 * Parse admin amount input (es-UY: miles con punto, decimales con coma).
 * Returns canonical string with dot decimal for the API.
 */
export function parseAmountInputToApiString(raw: string): string | null {
  const s = raw.replace(/\s/g, '');
  if (!s) return null;
  const cleaned = s.replace(/[^\d.,]/g, '');
  if (!cleaned) return null;

  const commaIdx = cleaned.lastIndexOf(',');
  if (commaIdx !== -1) {
    const intRaw = cleaned.slice(0, commaIdx);
    const fracRaw = cleaned.slice(commaIdx + 1);
    const intPart = intRaw.replace(/\./g, '').replace(/\D/g, '') || '0';
    const fracPart = fracRaw.replace(/\D/g, '').slice(0, 2);
    return fracPart ? `${intPart}.${fracPart}` : intPart;
  }

  const dotIdx = cleaned.lastIndexOf('.');
  if (dotIdx !== -1) {
    const after = cleaned.slice(dotIdx + 1);
    if (after.length <= 2 && /^\d+$/.test(after)) {
      const intPart =
        cleaned.slice(0, dotIdx).replace(/\./g, '').replace(/\D/g, '') || '0';
      return after ? `${intPart}.${after.slice(0, 2)}` : intPart;
    }
  }

  const intPart = cleaned.replace(/\./g, '').replace(/\D/g, '') || '0';
  return intPart === '0' && !/\d/.test(cleaned) ? null : intPart;
}
