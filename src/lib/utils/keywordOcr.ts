/**
 * Keyword-guided OCR & Packaging Date Extraction Engine
 * -----------------------------------------------------
 * Scans packaging text for explicit date indicator keywords:
 * - Manufacturing: MFG, MFD, PKG, PACKED, MANUFACTURED, DOM, PROD
 * - Expiry: EXP, EXPIRY, BEST BEFORE, USE BY, BB, VALID TILL, SHELF LIFE
 * - Batch: BATCH, LOT, B.NO, LOT NO
 *
 * Employs multi-pass regex matching and ISO-8601 normalization.
 */

import { KeywordOcrMatch } from '@/types'
import { normalizePrintedDate } from './dateNormalizer'

export interface KeywordOcrParseResult {
  detectedKeywords: string[]
  manufacturingDate: string | null
  expiryDate: string | null
  batchNumber: string | null
  matches: KeywordOcrMatch[]
  rawText: string
}

export const DEFAULT_MFG_KEYWORDS = [
  'MFG DATE',
  'MFG',
  'MFD',
  'MANUFACTURED',
  'DATE OF MFG',
  'DATE OF PKG',
  'PKD ON',
  'PKD',
  'PACKED',
  'DOM',
  'PROD DATE',
  'PROD',
  'B.DATE',
]

export const DEFAULT_EXP_KEYWORDS = [
  'EXP DATE',
  'EXPIRY DATE',
  'EXPIRY',
  'EXP',
  'BEST BEFORE',
  'BEST BY',
  'USE BY',
  'USE BEFORE',
  'BB',
  'EXPIRATION',
  'VALID TILL',
  'VALID UPTO',
  'CONSUME BEFORE',
  'SHELF LIFE',
  'EXPIRES',
]

export const DEFAULT_BATCH_KEYWORDS = [
  'BATCH NO',
  'BATCH',
  'LOT NO',
  'LOT',
  'B.NO',
  'LOT #',
  'BN',
]

// Common month abbreviation map
const MONTH_MAP: Record<string, string> = {
  JAN: '01',
  FEB: '02',
  MAR: '03',
  APR: '04',
  MAY: '05',
  JUN: '06',
  JUL: '07',
  AUG: '08',
  SEP: '09',
  OCT: '10',
  NOV: '11',
  DEC: '12',
}

/**
 * Searches a raw OCR text block using keywords to pinpoint and extract dates & batch info.
 */
export function parseKeywordOcrText(
  rawText: string,
  customKeywords?: { mfg?: string[]; exp?: string[]; batch?: string[] }
): KeywordOcrParseResult {
  if (!rawText || !rawText.trim()) {
    return {
      detectedKeywords: [],
      manufacturingDate: null,
      expiryDate: null,
      batchNumber: null,
      matches: [],
      rawText: '',
    }
  }

  const mfgKeywords = customKeywords?.mfg?.length ? customKeywords.mfg : DEFAULT_MFG_KEYWORDS
  const expKeywords = customKeywords?.exp?.length ? customKeywords.exp : DEFAULT_EXP_KEYWORDS
  const batchKeywords = customKeywords?.batch?.length ? customKeywords.batch : DEFAULT_BATCH_KEYWORDS

  const lines = rawText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean)
  const detectedKeywordsSet = new Set<string>()
  const matches: KeywordOcrMatch[] = []

  let foundMfgDate: string | null = null
  let foundExpDate: string | null = null
  let foundBatch: string | null = null

  // Date regex patterns
  // Pattern 1: DD/MM/YYYY, DD-MM-YYYY, DD.MM.YYYY, YYYY-MM-DD
  const NUMERIC_DATE_REGEX = /(?:^|[^\d])((?:20\d{2}[./-]\d{1,2}[./-]\d{1,2})|(?:\d{1,2}[./-]\d{1,2}[./-](?:20)?\d{2}))(?=[^\d]|$)/i

  // Pattern 2: Month name dates: 15 OCT 2025, OCT 2025, 15-OCT-2025, 24/SEP/26
  const MONTH_NAME_REGEX = /(?:^|[^\w])(?:(\d{1,2})[\s./-]*)?(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)[A-Z]*[\s./-]*((?:20)?\d{2})(?=[^\w]|$)/i

  // Pattern 3: MM/YYYY or MM-YYYY
  const MONTH_YEAR_REGEX = /(?:^|[^\d])((?:0[1-9]|1[0-2])[./-](?:20)?\d{2})(?=[^\d]|$)/i

  const extractDateFromSegment = (segment: string): string | null => {
    // Try Month Name pattern first
    const monthMatch = segment.toUpperCase().match(MONTH_NAME_REGEX)
    if (monthMatch) {
      const [, dayStr, monStr, yearStr] = monthMatch
      const month = MONTH_MAP[monStr]
      let year = yearStr.length === 2 ? `20${yearStr}` : yearStr
      const day = dayStr ? dayStr.padStart(2, '0') : '01'
      if (month && year) {
        return `${year}-${month}-${day}`
      }
    }

    // Try standard numeric date
    const numMatch = segment.match(NUMERIC_DATE_REGEX)
    if (numMatch) {
      const normalized = normalizePrintedDate(numMatch[1])
      if (normalized.isoDate) return normalized.isoDate
    }

    // Try MM/YYYY
    const myMatch = segment.match(MONTH_YEAR_REGEX)
    if (myMatch) {
      const normalized = normalizePrintedDate(myMatch[1])
      if (normalized.isoDate) return normalized.isoDate
    }

    return null
  }

  // Iterate line by line and with 1-line lookahead
  for (let i = 0; i < lines.length; i++) {
    const currentLine = lines[i]
    const nextLine = i + 1 < lines.length ? lines[i + 1] : ''
    const combinedWindow = `${currentLine} ${nextLine}`
    const upperCombined = combinedWindow.toUpperCase()

    // 1. Check EXPIRY keywords
    if (!foundExpDate) {
      for (const kw of expKeywords) {
        const kwUpper = kw.toUpperCase()
        if (upperCombined.includes(kwUpper)) {
          detectedKeywordsSet.add(kw)
          // Find text following the keyword
          const idx = upperCombined.indexOf(kwUpper)
          const sub = combinedWindow.substring(idx + kwUpper.length, idx + kwUpper.length + 35)
          const extracted = extractDateFromSegment(sub)
          if (extracted) {
            foundExpDate = extracted
            matches.push({
              keyword: kw,
              extracted_value: extracted,
              field: 'expiry_date',
              confidence: 0.95,
            })
            break
          }
        }
      }
    }

    // 2. Check MANUFACTURING keywords
    if (!foundMfgDate) {
      for (const kw of mfgKeywords) {
        const kwUpper = kw.toUpperCase()
        if (upperCombined.includes(kwUpper)) {
          detectedKeywordsSet.add(kw)
          const idx = upperCombined.indexOf(kwUpper)
          const sub = combinedWindow.substring(idx + kwUpper.length, idx + kwUpper.length + 35)
          const extracted = extractDateFromSegment(sub)
          if (extracted) {
            foundMfgDate = extracted
            matches.push({
              keyword: kw,
              extracted_value: extracted,
              field: 'manufacturing_date',
              confidence: 0.95,
            })
            break
          }
        }
      }
    }

    // 3. Check BATCH keywords
    if (!foundBatch) {
      for (const kw of batchKeywords) {
        const kwUpper = kw.toUpperCase()
        if (upperCombined.includes(kwUpper)) {
          detectedKeywordsSet.add(kw)
          const idx = upperCombined.indexOf(kwUpper)
          const sub = combinedWindow.substring(idx + kwUpper.length, idx + kwUpper.length + 25)
          const batchMatch = sub.match(/[:\s#-]*([A-Z0-9\/-]{3,15})/i)
          if (batchMatch && batchMatch[1] && !batchMatch[1].toLowerCase().includes('date')) {
            foundBatch = batchMatch[1].replace(/^[:\s#-]+/, '').trim()
            matches.push({
              keyword: kw,
              extracted_value: foundBatch,
              field: 'batch_number',
              confidence: 0.88,
            })
            break
          }
        }
      }
    }
  }

  // 4. Handle "BEST BEFORE X MONTHS FROM MFG/PACKAGING" relative shelf life
  if (!foundExpDate && foundMfgDate) {
    const shelfLifeMatch = rawText.toUpperCase().match(/(?:BEST\s+BEFORE|USE\s+WITHIN)\s+(\d{1,2})\s*(?:MONTHS|MONTH|MTHS|M)/i)
    if (shelfLifeMatch) {
      const monthsToAdd = parseInt(shelfLifeMatch[1], 10)
      if (monthsToAdd > 0 && monthsToAdd <= 60) {
        const mfgDateObj = new Date(foundMfgDate)
        if (!isNaN(mfgDateObj.getTime())) {
          mfgDateObj.setMonth(mfgDateObj.getMonth() + monthsToAdd)
          foundExpDate = mfgDateObj.toISOString().split('T')[0]
          detectedKeywordsSet.add('BEST BEFORE (RELATIVE)')
          matches.push({
            keyword: `BEST BEFORE ${monthsToAdd} MONTHS`,
            extracted_value: foundExpDate,
            field: 'expiry_date',
            confidence: 0.85,
          })
        }
      }
    }
  }

  return {
    detectedKeywords: Array.from(detectedKeywordsSet),
    manufacturingDate: foundMfgDate,
    expiryDate: foundExpDate,
    batchNumber: foundBatch,
    matches,
    rawText,
  }
}

/**
 * Executes Client/Server OCR using Tesseract.js and extracts dates matching packaging keywords.
 */
export async function runClientKeywordOcr(
  imageSource: string | File | Blob,
  customKeywords?: { mfg?: string[]; exp?: string[]; batch?: string[] },
  onProgress?: (progress: number, status: string) => void
): Promise<KeywordOcrParseResult> {
  try {
    const { createWorker } = await import('tesseract.js')
    onProgress?.(10, 'Initializing OCR worker...')

    const worker = await createWorker('eng')

    onProgress?.(30, 'Analyzing packaging typography with Tesseract OCR...')
    const result = await worker.recognize(imageSource)

    onProgress?.(80, 'Correlating keywords (MFG, EXP, USE BY) to detected dates...')
    const text = result.data.text || ''

    await worker.terminate()

    const parsed = parseKeywordOcrText(text, customKeywords)
    onProgress?.(100, `OCR complete (${parsed.detectedKeywords.length} keywords located)`)
    return parsed
  } catch (err) {
    console.warn('[Keyword OCR] Tesseract engine run failed or skipped:', err)
    return {
      detectedKeywords: [],
      manufacturingDate: null,
      expiryDate: null,
      batchNumber: null,
      matches: [],
      rawText: '',
    }
  }
}
