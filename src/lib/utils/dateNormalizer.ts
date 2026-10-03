/**
 * Date Normalization Utility for AI & OCR Extraction
 * Identifies and normalizes printed packaging date formats:
 * - DD/MM/YYYY, DD-MM-YYYY, DD.MM.YYYY
 * - MM/YYYY, MM-YYYY
 * - DD/MM/YY, DD-MM-YY
 * - YYYY/MM/DD, YYYY-MM-DD
 * Strips prefix indicators: MFD, MFG, PKG, EXP, EXPIRY, BEST BEFORE, USE BY
 */

export interface NormalizedDateResult {
  isoDate: string | null
  confidence: 'HIGH' | 'MEDIUM' | 'UNCERTAIN'
  original: string
  label?: 'MFD' | 'EXPIRY' | 'GENERIC'
}

export function normalizePrintedDate(rawText: string | null | undefined): NormalizedDateResult {
  if (!rawText || typeof rawText !== 'string') {
    return { isoDate: null, confidence: 'UNCERTAIN', original: '' }
  }

  const trimmed = rawText.trim()
  if (!trimmed) {
    return { isoDate: null, confidence: 'UNCERTAIN', original: '' }
  }

  // Detect prefix type
  let label: 'MFD' | 'EXPIRY' | 'GENERIC' = 'GENERIC'
  const upper = trimmed.toUpperCase()
  if (upper.includes('MFD') || upper.includes('MFG') || upper.includes('MANUF') || upper.includes('PKG')) {
    label = 'MFD'
  } else if (upper.includes('EXP') || upper.includes('BEST BEFORE') || upper.includes('USE BY') || upper.includes('BB')) {
    label = 'EXPIRY'
  }

  // Strip non-date prefix/suffix characters
  const clean = trimmed
    .replace(/(?:MFD|MFG|MANUFACTURED|PKG|EXPIRY|EXP|BEST\s+BEFORE|USE\s+BY|DATE|LOT|BATCH|NO|:)+/gi, '')
    .trim()

  // Match 1: YYYY-MM-DD or YYYY/MM/DD
  const ymdMatch = clean.match(/^(\d{4})[./-](\d{1,2})[./-](\d{1,2})$/)
  if (ymdMatch) {
    const [, year, month, day] = ymdMatch
    const formatted = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
    if (isValidDateParts(Number(year), Number(month), Number(day))) {
      return { isoDate: formatted, confidence: 'HIGH', original: trimmed, label }
    }
  }

  // Match 2: DD/MM/YYYY or DD-MM-YYYY or DD.MM.YYYY
  const dmyMatch = clean.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{4})$/)
  if (dmyMatch) {
    const [, day, month, year] = dmyMatch
    const formatted = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
    if (isValidDateParts(Number(year), Number(month), Number(day))) {
      return { isoDate: formatted, confidence: 'HIGH', original: trimmed, label }
    }
  }

  // Match 3: DD/MM/YY or DD-MM-YY (2-digit year)
  const dmyShortMatch = clean.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{2})$/)
  if (dmyShortMatch) {
    const [, day, month, shortYear] = dmyShortMatch
    const fullYear = 2000 + Number(shortYear)
    const formatted = `${fullYear}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
    if (isValidDateParts(fullYear, Number(month), Number(day))) {
      return { isoDate: formatted, confidence: 'MEDIUM', original: trimmed, label }
    }
  }

  // Match 4: MM/YYYY or MM-YYYY (Month & Year only -> normalize to last day of month for expiry or 1st for mfd)
  const myMatch = clean.match(/^(\d{1,2})[./-](\d{4})$/)
  if (myMatch) {
    const [, monthStr, yearStr] = myMatch
    const month = Number(monthStr)
    const year = Number(yearStr)
    if (month >= 1 && month <= 12 && year >= 2000 && year <= 2050) {
      const day = label === 'EXPIRY' ? new Date(year, month, 0).getDate() : 1
      const formatted = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
      return { isoDate: formatted, confidence: 'MEDIUM', original: trimmed, label }
    }
  }

  // Fallback: Check if Date.parse can parse standard string
  const parsedTimestamp = Date.parse(clean)
  if (!isNaN(parsedTimestamp)) {
    const d = new Date(parsedTimestamp)
    const formatted = d.toISOString().split('T')[0]
    return { isoDate: formatted, confidence: 'MEDIUM', original: trimmed, label }
  }

  return { isoDate: null, confidence: 'UNCERTAIN', original: trimmed, label }
}

function isValidDateParts(year: number, month: number, day: number): boolean {
  if (year < 1990 || year > 2050) return false
  if (month < 1 || month > 12) return false
  if (day < 1 || day > 31) return false
  const testDate = new Date(year, month - 1, day)
  return (
    testDate.getFullYear() === year &&
    testDate.getMonth() === month - 1 &&
    testDate.getDate() === day
  )
}
