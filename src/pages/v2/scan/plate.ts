// Saudi plates carry the same registration twice: an Arabic row and a Latin row.
// Tesseract reads the Latin row reliably and the Arabic row barely at all, so the
// scanner targets the Latin row and hands the result back for the officer to confirm.

const ARABIC_INDIC_DIGITS = '٠١٢٣٤٥٦٧٨٩';

export function toLatinDigits(input: string): string {
  return input.replace(/[٠-٩]/g, (d) => String(ARABIC_INDIC_DIGITS.indexOf(d)));
}

// 1-4 letters and 1-4 digits, in either order, optionally spaced out.
const LETTERS_FIRST = /([A-Z][\s.]{0,2}){1,4}([0-9][\s.]{0,2}){1,4}/;
const DIGITS_FIRST = /([0-9][\s.]{0,2}){1,4}([A-Z][\s.]{0,2}){1,4}/;

function format(candidate: string): string {
  const letters = candidate.replace(/[^A-Z]/g, '');
  const digits = candidate.replace(/[^0-9]/g, '');
  if (!letters || !digits) return '';
  return `${letters.split('').join(' ')} ${digits}`;
}

/** Best-effort plate string from raw OCR text. Empty when nothing plausible was read. */
export function normalizePlate(raw: string): string {
  const lines = toLatinDigits(raw.toUpperCase())
    .split(/\r?\n/)
    .map((line) => line.replace(/[^A-Z0-9\s.]/g, '').replace(/\s+/g, ' ').trim())
    .filter(Boolean);

  const matches: string[] = [];
  for (const line of lines) {
    const hit = line.match(LETTERS_FIRST) ?? line.match(DIGITS_FIRST);
    if (hit) matches.push(hit[0]);
  }

  if (matches.length === 0) return '';

  // Prefer the candidate carrying the most characters - OCR noise tends to be short.
  const best = matches.reduce((a, b) =>
    b.replace(/[^A-Z0-9]/g, '').length > a.replace(/[^A-Z0-9]/g, '').length ? b : a
  );
  return format(best);
}
