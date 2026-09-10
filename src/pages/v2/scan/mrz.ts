// Parser for the Machine Readable Zone printed on passports (TD3) and ID cards (TD1),
// per ICAO Doc 9303. OCR output is noisy, so every field that carries a check digit is
// verified and the result reports which fields could not be confirmed.

export interface MrzResult {
  format: 'TD1' | 'TD3';
  documentType: 'passport' | 'id_card';
  documentNumber: string;
  surname: string;
  givenNames: string;
  fullName: string;
  nationality: string;
  birthDate: string;
  expiryDate: string;
  sex: string;
  checks: { documentNumber: boolean; birthDate: boolean; expiryDate: boolean };
  valid: boolean;
}

const MRZ_CHARS = /[^A-Z0-9<]/g;

// OCR reads digits as look-alike letters; only safe to undo inside all-numeric fields.
const TO_DIGIT: Record<string, string> = {
  O: '0', Q: '0', D: '0', U: '0',
  I: '1', L: '1',
  Z: '2',
  S: '5',
  G: '6',
  T: '7',
  B: '8',
  A: '4',
};

function charValue(c: string): number {
  if (c >= '0' && c <= '9') return c.charCodeAt(0) - 48;
  if (c >= 'A' && c <= 'Z') return c.charCodeAt(0) - 55;
  return 0;
}

export function checkDigit(input: string): number {
  const weights = [7, 3, 1];
  let sum = 0;
  for (let i = 0; i < input.length; i++) {
    sum += charValue(input[i]) * weights[i % 3];
  }
  return sum % 10;
}

function digitsOnly(field: string): string {
  return field
    .split('')
    .map((c) => (c >= '0' && c <= '9' ? c : TO_DIGIT[c] ?? c))
    .join('');
}

// Mirror of TO_DIGIT, for fields that can only contain letters (nationality).
const TO_LETTER: Record<string, string> = {
  '0': 'O', '1': 'I', '2': 'Z', '4': 'A', '5': 'S', '6': 'G', '7': 'T', '8': 'B',
};

function lettersOnly(field: string): string {
  return field
    .replace(/</g, '')
    .split('')
    .map((c) => TO_LETTER[c] ?? c)
    .join('');
}

// Document numbers are alphanumeric, so their text is checked exactly as read.
function verify(field: string, digit: string): boolean {
  return String(checkDigit(field)) === digitsOnly(digit);
}

// Dates are all-numeric, so look-alike letters are repaired before checking.
function verifyNumeric(field: string, digit: string): boolean {
  return String(checkDigit(digitsOnly(field))) === digitsOnly(digit);
}

function parseName(raw: string): { surname: string; givenNames: string; fullName: string } {
  const [surnamePart = '', givenPart = ''] = raw.split('<<');
  const clean = (s: string) => s.replace(/</g, ' ').replace(/\s+/g, ' ').trim();
  const surname = clean(surnamePart);
  const givenNames = clean(givenPart);
  return { surname, givenNames, fullName: [givenNames, surname].filter(Boolean).join(' ') };
}

function fit(line: string, length: number): string {
  return line.length >= length ? line.slice(0, length) : line.padEnd(length, '<');
}

function parseTD3(lines: string[]): MrzResult {
  const l1 = fit(lines[0], 44);
  const l2 = fit(lines[1], 44);

  const documentNumber = l2.slice(0, 9).replace(/<+$/, '');
  const birthDate = digitsOnly(l2.slice(13, 19));
  const expiryDate = digitsOnly(l2.slice(21, 27));

  return {
    format: 'TD3',
    documentType: 'passport',
    documentNumber,
    ...parseName(l1.slice(5)),
    nationality: lettersOnly(l2.slice(10, 13)),
    birthDate,
    expiryDate,
    sex: l2[20] === 'M' || l2[20] === 'F' ? l2[20] : '',
    checks: {
      documentNumber: verify(l2.slice(0, 9), l2[9]),
      birthDate: verifyNumeric(l2.slice(13, 19), l2[19]),
      expiryDate: verifyNumeric(l2.slice(21, 27), l2[27]),
    },
    valid: false,
  };
}

function parseTD1(lines: string[]): MrzResult {
  const l1 = fit(lines[0], 30);
  const l2 = fit(lines[1], 30);
  const l3 = fit(lines[2], 30);

  const documentNumber = l1.slice(5, 14).replace(/<+$/, '');
  const birthDate = digitsOnly(l2.slice(0, 6));
  const expiryDate = digitsOnly(l2.slice(8, 14));

  return {
    format: 'TD1',
    documentType: 'id_card',
    documentNumber,
    ...parseName(l3),
    nationality: lettersOnly(l2.slice(15, 18)),
    birthDate,
    expiryDate,
    sex: l2[7] === 'M' || l2[7] === 'F' ? l2[7] : '',
    checks: {
      documentNumber: verify(l1.slice(5, 14), l1[14]),
      birthDate: verifyNumeric(l2.slice(0, 6), l2[6]),
      expiryDate: verifyNumeric(l2.slice(8, 14), l2[14]),
    },
    valid: false,
  };
}

/** Pull the MRZ out of raw OCR text. Returns null when no plausible MRZ is present. */
export function parseMrz(rawText: string): MrzResult | null {
  const candidates = rawText
    .toUpperCase()
    .split(/\r?\n/)
    .map((line) => line.replace(/\s/g, '').replace(MRZ_CHARS, ''))
    .filter((line) => line.length >= 26);

  if (candidates.length === 0) return null;

  const td3 = candidates.filter((l) => l.length >= 40 && l.length <= 48);
  const td1 = candidates.filter((l) => l.length >= 27 && l.length <= 33);

  let result: MrzResult | null = null;
  if (td3.length >= 2) {
    result = parseTD3(td3.slice(-2));
  } else if (td1.length >= 3) {
    result = parseTD1(td1.slice(-3));
  } else {
    return null;
  }

  result.valid = Object.values(result.checks).every(Boolean);
  return result;
}

/** YYMMDD as printed in the MRZ, shown back to the officer as YYYY-MM-DD. */
export function formatMrzDate(yymmdd: string, isBirthDate: boolean): string {
  if (!/^\d{6}$/.test(yymmdd)) return '';
  const yy = Number(yymmdd.slice(0, 2));
  const currentYY = new Date().getFullYear() % 100;
  // Births can't be in the future; expiry dates can't be far in the past.
  const century = isBirthDate ? (yy > currentYY ? 1900 : 2000) : yy < currentYY - 20 ? 2100 : 2000;
  return `${century + yy}-${yymmdd.slice(2, 4)}-${yymmdd.slice(4, 6)}`;
}
