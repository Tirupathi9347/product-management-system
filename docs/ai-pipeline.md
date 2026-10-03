# AI Vision & Packaging OCR Extraction Pipeline

## 1. Current Architecture (Multimodal Vision API)

The current implementation leverages multimodal neural vision (`gemini-1.5-flash`) orchestrated strictly through a secure server-side Next.js route:

```text
[ Product Photo / Packaging Image / Receipt ]
                      │
                      ▼
        preprocessProductImage()
 (Aspect-ratio preservation, downsample >1600px, JPEG 0.85 compression)
                      │
                      ▼
            POST /api/ai/extract
    (Server-side route: keeps GEMINI_API_KEY confidential)
                      │
                      ▼
           Gemini Multimodal Inference
  (Zero hallucination rules, retail consumer goods prompt)
                      │
                      ▼
            Strict Zod Schema Validation
      (Rejects malformed JSON or invalid types)
                      │
                      ▼
         normalizePrintedDate() Engine
 (Normalizes DD/MM/YYYY, DD-MM-YYYY, MM/YYYY, MFD/EXP prefixes to YYYY-MM-DD)
                      │
                      ▼
         AI Review & Verification Screen
  (User edits, confidence scoring indicators, review badges)
                      │
                      ▼
           ProductService.createProduct()
```

---

## 2. Review Confidence Indicators

The AI pipeline classifies extraction quality into three review categories:
- **`HIGH_REVIEW_CONFIDENCE`**: Key product fields (name, category, expiry schedule) identified with high optical clarity.
- **`REVIEW_RECOMMENDED`**: Minor ambiguity detected (e.g. Purchase price vs MRP or partial printed timestamp).
- **`MANUAL_REVIEW`**: Degraded packaging photo, low lighting, or incomplete text. The user is prompted to complete missing values.

---

## 3. Future Custom Pipeline (PaddleOCR + Custom Model)

The application architecture is explicitly prepared to replace or augment the Gemini provider with an on-premise custom AI inference pipeline without any frontend UI modifications:

```text
Product Image
      ↓
Image Preprocessing
      ↓
PaddleOCR (Text Detection + Bounding Boxes)
      ↓
Custom Retail Product Named Entity Recognition (NER) Model
      ↓
Date / Field Validation & Normalization
      ↓
User Verification Screen
      ↓
Product Service
      ↓
Database
```

### Integration Steps for Future Custom Model:
1. Deploy the custom inference service (e.g. FastAPI / Triton Inference Server exposing `/v1/extract`).
2. In `src/app/api/ai/extract/route.ts`, configure an adapter pointing to `CUSTOM_OCR_ENDPOINT`.
3. Map the model's bounding boxes and structured JSON output to the existing `AIExtractionResult` schema.
4. The client modal (`AIScannerModal.tsx`) and creation flow will consume the output without code changes.
