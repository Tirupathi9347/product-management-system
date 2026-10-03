import { AIExtractionResult } from '@/types'
import { preprocessProductImage } from '@/lib/utils/imagePreprocessing'
import { runClientKeywordOcr, KeywordOcrParseResult } from '@/lib/utils/keywordOcr'

/**
 * Strict null result — returned when extraction fails or no API key is configured.
 * NEVER contains fabricated values.
 */
const NULL_EXTRACTION_RESULT: AIExtractionResult = {
  product_name: null,
  brand: null,
  category: null,
  barcode: null,
  mrp: null,
  purchase_price: null,
  weight: null,
  unit: null,
  manufacturing_date: null,
  expiry_date: null,
  batch_number: null,
  description: null,
  confidence: 0,
  review_state: 'MANUAL_REVIEW',
  uncertain_fields: [
    'product_name', 'brand', 'category', 'barcode', 'mrp',
    'purchase_price', 'weight', 'unit', 'manufacturing_date',
    'expiry_date', 'batch_number', 'description',
  ],
  detected_keywords: [],
  keyword_matches: [],
}

export interface ExtractionOptions {
  customKeywords?: {
    mfg?: string[]
    exp?: string[]
    batch?: string[]
  }
  enableClientOcrFallback?: boolean
}

export class ProductExtractionService {
  /**
   * Product Extraction Service Boundary
   * Coordinates image preprocessing, model inference (YOLO / Vision),
   * and Keyword OCR date extraction.
   */
  public static async extractFromImage(
    file: File | Blob,
    onProgress?: (stage: string, progress: number) => void,
    options?: ExtractionOptions
  ): Promise<AIExtractionResult> {
    onProgress?.('Optimizing image buffer & resolution...', 15)

    let preprocessed
    try {
      preprocessed = await preprocessProductImage(file)
    } catch {
      // Fallback to raw file if preprocessing fails
      const reader = new FileReader()
      const base64 = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve((reader.result as string).split(',')[1] || '')
        reader.onerror = reject
        reader.readAsDataURL(file as Blob)
      })
      preprocessed = {
        base64,
        mimeType: file.type || 'image/jpeg',
        width: 0,
        height: 0,
        originalSize: file.size,
        optimizedSize: file.size,
      }
    }

    onProgress?.('Running Model Inference & Packaging Object Detection...', 35)

    let apiResult: AIExtractionResult | null = null

    try {
      onProgress?.('Locating mfg_date & exp_date bounding boxes...', 55)

      const response = await fetch('/api/ai/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: preprocessed.base64,
          mimeType: preprocessed.mimeType,
          customKeywords: options?.customKeywords,
        }),
      })

      if (response.ok) {
        const json = await response.json()
        if (json.success && json.data) {
          apiResult = json.data as AIExtractionResult
        }
      }
    } catch (err) {
      console.warn('Extraction API fetch error:', err)
    }

    // Step 2: Corroborate or supplement with Keyword-guided OCR if dates are missing
    let ocrResult: KeywordOcrParseResult | null = null
    const needsDateOcr = !apiResult || !apiResult.expiry_date || !apiResult.manufacturing_date

    if (needsDateOcr && options?.enableClientOcrFallback !== false) {
      try {
        onProgress?.('Running Keyword OCR on packaging text (MFG, EXP, USE BY)...', 75)
        ocrResult = await runClientKeywordOcr(file, options?.customKeywords, (pct, status) => {
          onProgress?.(status, Math.min(95, 75 + Math.round(pct * 0.2)))
        })
      } catch (ocrErr) {
        console.warn('Client Keyword OCR error:', ocrErr)
      }
    }

    // Merge Model output with Keyword OCR output
    const merged: AIExtractionResult = apiResult
      ? { ...apiResult }
      : { ...NULL_EXTRACTION_RESULT }

    if (ocrResult) {
      if (!merged.manufacturing_date && ocrResult.manufacturingDate) {
        merged.manufacturing_date = ocrResult.manufacturingDate
      }
      if (!merged.expiry_date && ocrResult.expiryDate) {
        merged.expiry_date = ocrResult.expiryDate
      }
      if (!merged.batch_number && ocrResult.batchNumber) {
        merged.batch_number = ocrResult.batchNumber
      }

      // Merge detected keywords
      const existingKeywords = merged.detected_keywords || []
      const allKeywords = Array.from(new Set([...existingKeywords, ...ocrResult.detectedKeywords]))
      merged.detected_keywords = allKeywords

      // Merge matches
      const existingMatches = merged.keyword_matches || []
      merged.keyword_matches = [...existingMatches, ...ocrResult.matches]

      if (ocrResult.rawText && !merged.ocr_raw_text) {
        merged.ocr_raw_text = ocrResult.rawText
      }
    }

    // Recalculate review confidence
    if (merged.expiry_date && merged.product_name) {
      merged.review_state = 'HIGH_REVIEW_CONFIDENCE'
      merged.confidence = Math.max(merged.confidence || 0, 0.85)
    } else if (merged.expiry_date || merged.manufacturing_date) {
      merged.review_state = 'REVIEW_RECOMMENDED'
      merged.confidence = Math.max(merged.confidence || 0, 0.70)
    }

    onProgress?.('Model & Keyword OCR date extraction complete.', 100)
    return merged
  }
}
