import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { normalizePrintedDate } from '@/lib/utils/dateNormalizer'

export const runtime = 'nodejs'

// Helper to safely coerce number or string price to clean number | null
const coerceNumberOrNull = (val: unknown): number | null => {
  if (val === null || val === undefined || val === '') return null
  if (typeof val === 'number') return isNaN(val) ? null : val
  if (typeof val === 'string') {
    // Strip currency symbols (₹, $, Rs, etc), commas, and spaces
    const cleaned = val.replace(/[^0-9.]/g, '')
    const num = parseFloat(cleaned)
    return isNaN(num) ? null : num
  }
  return null
}

// Helper to safely coerce string or number to string | null
const coerceStringOrNull = (val: unknown): string | null => {
  if (val === null || val === undefined || val === '') return null
  const str = String(val).trim()
  return str.length === 0 ? null : str
}

const ExtractionOutputSchema = z.object({
  product_name: z.preprocess(coerceStringOrNull, z.string().nullable().optional()),
  brand: z.preprocess(coerceStringOrNull, z.string().nullable().optional()),
  category: z.preprocess(coerceStringOrNull, z.string().nullable().optional()),
  barcode: z.preprocess(coerceStringOrNull, z.string().nullable().optional()),
  mrp: z.preprocess(coerceNumberOrNull, z.number().nullable().optional()),
  purchase_price: z.preprocess(coerceNumberOrNull, z.number().nullable().optional()),
  weight: z.preprocess(coerceStringOrNull, z.string().nullable().optional()),
  unit: z.preprocess(coerceStringOrNull, z.string().nullable().optional()),
  manufacturing_date: z.preprocess(coerceStringOrNull, z.string().nullable().optional()),
  expiry_date: z.preprocess(coerceStringOrNull, z.string().nullable().optional()),
  batch_number: z.preprocess(coerceStringOrNull, z.string().nullable().optional()),
  description: z.preprocess(coerceStringOrNull, z.string().nullable().optional()),
  detected_keywords: z.array(z.string()).optional(),
})

const NULL_RESULT = {
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
  detected_keywords: [],
}

// Active and fast Gemini vision model names in priority order
const GEMINI_MODELS = [
  'gemini-3.1-flash-lite-preview',
  'gemini-3.5-flash-lite',
  'gemini-3-flash-preview',
  'gemini-3.6-flash',
  'gemini-flash-latest',
  'gemini-3.8-flash',
  'gemini-3.5-flash',
]

const STRICT_OCR_PROMPT = `You are a specialized Packaging OCR & Vision Reader. Your primary task is to read printed packaging text, with a strict focus on KEYWORD-GUIDED DATE AND ATTRIBUTE EXTRACTION.

TARGET KEYWORDS TO SCAN FOR:
1. EXPIRY DATE KEYWORDS:
   Scan for labels such as "EXP", "EXPIRY", "EXP DATE", "BEST BEFORE", "BEST BY", "USE BY", "USE BEFORE", "BB", "EXPIRATION", "VALID TILL", "VALID UPTO".
   Extract the printed date immediately following or adjacent to these labels into "expiry_date".
   If the packaging states "Best before X months from packaging/mfg", compute or note the expiry date accordingly.

2. MANUFACTURING DATE KEYWORDS:
   Scan for labels such as "MFG", "MFD", "MFG DATE", "MANUFACTURED", "DATE OF MFG", "DATE OF PKG", "PKD", "PACKED", "DOM", "PROD DATE".
   Extract the printed date immediately following or adjacent to these labels into "manufacturing_date".

3. BATCH / LOT KEYWORDS:
   Scan for labels such as "BATCH", "LOT", "B.NO", "LOT NO", "BATCH NO", "BN".
   Extract the exact alphanumeric code into "batch_number".

4. RETAIL PRODUCT ATTRIBUTES:
   Extract visible product name, brand name, category, barcode number, MRP (price in ₹), net weight / volume, and unit.

CRITICAL RULES:
- ONLY extract values you can read as visible text in the image. Return null for fields not visibly present.
- Normalize dates to ISO format "YYYY-MM-DD" if possible (e.g. "20/06/2026" -> "2026-06-20", "OCT 2025" -> "2025-10-01").
- Do NOT hallucinate or guess dates that are not printed on the packaging.

Return ONLY a valid JSON object matching these exact keys:
Keys: product_name, brand, category, barcode, mrp, purchase_price, weight, unit, manufacturing_date, expiry_date, batch_number, description, detected_keywords`

async function callGemini(
  model: string,
  apiKey: string,
  imageBase64: string,
  mimeType: string
): Promise<z.infer<typeof ExtractionOutputSchema> | null> {
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            { text: STRICT_OCR_PROMPT },
            {
              inlineData: {
                mimeType: mimeType || 'image/jpeg',
                data: imageBase64,
              },
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.0,
        maxOutputTokens: 1024,
        responseMimeType: 'application/json',
      },
    }),
  })

  if (!res.ok) {
    const errText = await res.text().catch(() => res.status.toString())
    console.warn(`[extract] Model ${model} HTTP ${res.status}:`, errText.slice(0, 200))
    return null
  }

  const geminiData = await res.json()

  // Check for safety blocks or empty responses
  const candidate = geminiData?.candidates?.[0]
  if (!candidate) {
    console.warn(`[extract] Model ${model}: no candidates in response`)
    return null
  }

  if (candidate.finishReason === 'SAFETY') {
    console.warn(`[extract] Model ${model}: blocked by safety filter`)
    return null
  }

  const text = candidate?.content?.parts?.[0]?.text
  if (!text) {
    console.warn(`[extract] Model ${model}: empty text in response`)
    return null
  }

  // Strip markdown code fences if present
  const clean = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim()

  try {
    const parsed = JSON.parse(clean)
    const result = ExtractionOutputSchema.parse(parsed)
    return {
      product_name: result.product_name ?? null,
      brand: result.brand ?? null,
      category: result.category ?? null,
      barcode: result.barcode ?? null,
      mrp: result.mrp ?? null,
      purchase_price: result.purchase_price ?? null,
      weight: result.weight ?? null,
      unit: result.unit ?? null,
      manufacturing_date: result.manufacturing_date ?? null,
      expiry_date: result.expiry_date ?? null,
      batch_number: result.batch_number ?? null,
      description: result.description ?? null,
      detected_keywords: result.detected_keywords ?? [],
    }
  } catch (parseErr) {
    console.warn(`[extract] Model ${model}: JSON parse/validation failed:`, parseErr, '| raw:', clean.slice(0, 300))
    return null
  }
}

async function callLocalPythonModel(
  imageBase64: string,
  mimeType: string
): Promise<z.infer<typeof ExtractionOutputSchema> | null> {
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 2000)

    const res = await fetch('http://127.0.0.1:8000/extract', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageBase64, mimeType }),
      signal: controller.signal,
    })
    clearTimeout(timeout)

    if (res.ok) {
      const json = await res.json()
      if (json.success && json.data) {
        console.log('[extract] Processed via local Python PyTorch model')
        return ExtractionOutputSchema.parse(json.data)
      }
    }
    return null
  } catch {
    // Local model not running; fallback to Gemini
    return null
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { imageBase64, mimeType = 'image/jpeg' } = body

    if (!imageBase64 || typeof imageBase64 !== 'string') {
      return NextResponse.json({ error: 'Missing image payload.' }, { status: 400 })
    }

    // Strip data URL prefix if present (safely handles any MIME type or attributes)
    const cleanBase64 = imageBase64.includes('base64,')
      ? imageBase64.split('base64,')[1]
      : imageBase64

    if (!cleanBase64 || cleanBase64.length < 100) {
      console.warn('[extract] Received empty or too-small base64 image')
      return NextResponse.json({
        success: true,
        data: {
          ...NULL_RESULT,
          confidence: 0,
          review_state: 'MANUAL_REVIEW',
          uncertain_fields: Object.keys(NULL_RESULT),
          source: 'empty-image',
        },
      })
    }

    // 1. Try local trained Python PyTorch model first
    let validatedData: z.infer<typeof ExtractionOutputSchema> | null = await callLocalPythonModel(cleanBase64, mimeType)
    let usedModel = validatedData ? 'local_pytorch_packaging_net' : ''

    // 2. If local Python server is not active, run Cloud Gemini Vision pipeline
    if (!validatedData) {
      const apiKey = process.env.GEMINI_API_KEY

      if (!apiKey || apiKey.trim().length < 10) {
        console.warn('[extract] GEMINI_API_KEY not configured or too short')
        return NextResponse.json({
          success: true,
          data: {
            ...NULL_RESULT,
            confidence: 0,
            review_state: 'MANUAL_REVIEW',
            uncertain_fields: Object.keys(NULL_RESULT),
            source: 'no-api-key',
            apiKeyConfigured: false,
          },
        })
      }

      for (const model of GEMINI_MODELS) {
        try {
          validatedData = await callGemini(model, apiKey, cleanBase64, mimeType)
          if (validatedData !== null) {
            usedModel = model
            console.log(`[extract] Success with model: ${model}`)
            break
          }
        } catch (err) {
          console.warn(`[extract] Model ${model} threw:`, err)
          continue
        }
      }
    }

    if (!validatedData) {
      console.warn('[extract] All models failed — returning null result')
      return NextResponse.json({
        success: true,
        data: {
          ...NULL_RESULT,
          confidence: 0,
          review_state: 'MANUAL_REVIEW',
          uncertain_fields: Object.keys(NULL_RESULT),
          source: 'all-models-failed',
          apiKeyConfigured: true,
        },
      })
    }

    // Normalize extracted dates (handle formats like 20/6/2017 → 2017-06-20)
    const normMfg = validatedData.manufacturing_date
      ? normalizePrintedDate(validatedData.manufacturing_date).isoDate
      : null
    const normExp = validatedData.expiry_date
      ? normalizePrintedDate(validatedData.expiry_date).isoDate
      : null

    const finalData = {
      ...validatedData,
      manufacturing_date: normMfg || validatedData.manufacturing_date || null,
      expiry_date: normExp || validatedData.expiry_date || null,
    }

    // Count non-null fields for confidence scoring
    const extracted = Object.values(finalData).filter((v) => v !== null && v !== '').length
    const total = Object.keys(NULL_RESULT).length
    const confidence = Math.round((extracted / total) * 100) / 100

    const reviewState =
      extracted === 0
        ? 'MANUAL_REVIEW'
        : extracted <= 2
        ? 'REVIEW_RECOMMENDED'
        : 'HIGH_REVIEW_CONFIDENCE'

    return NextResponse.json({
      success: true,
      data: {
        ...finalData,
        confidence: Math.min(0.95, confidence + 0.05),
        review_state: reviewState,
        uncertain_fields: Object.entries(finalData)
          .filter(([, v]) => v === null)
          .map(([k]) => k),
        source: usedModel,
      },
    })
  } catch (err) {
    console.error('[extract] Unhandled error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Extraction failed.', success: false },
      { status: 500 }
    )
  }
}
