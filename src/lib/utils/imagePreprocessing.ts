/**
 * Image Preprocessing Utility
 * Optimizes user-provided product photos for vision AI ingestion:
 * - Resizes images exceeding 1600px maximum dimension while preserving aspect ratio
 * - Compresses image to high-readability JPEG (~0.85 quality)
 * - Converts File/Blob to Base64 data URL
 */

export interface PreprocessedImageResult {
  base64: string
  mimeType: string
  width: number
  height: number
  originalSize: number
  optimizedSize: number
}

export async function preprocessProductImage(
  file: File | Blob,
  maxDimension = 1600,
  quality = 0.85
): Promise<PreprocessedImageResult> {
  // If running in environment without window/DOM, read as basic base64
  if (typeof window === 'undefined') {
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const mimeType = file.type || 'image/jpeg'
    const base64 = `data:${mimeType};base64,${buffer.toString('base64')}`
    return {
      base64,
      mimeType,
      width: 0,
      height: 0,
      originalSize: file.size,
      optimizedSize: file.size,
    }
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('Failed to read image file.'))
    reader.onload = () => {
      const img = new Image()
      img.onerror = () => reject(new Error('Failed to load image element.'))
      img.onload = () => {
        let width = img.width
        let height = img.height

        // Calculate aspect-ratio preserved dimensions
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width)
            width = maxDimension
          } else {
            width = Math.round((width * maxDimension) / height)
            height = maxDimension
          }
        }

        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height

        const ctx = canvas.getContext('2d')
        if (!ctx) {
          // Fallback if canvas context fails
          resolve({
            base64: reader.result as string,
            mimeType: file.type || 'image/jpeg',
            width: img.width,
            height: img.height,
            originalSize: file.size,
            optimizedSize: file.size,
          })
          return
        }

        // Draw image onto canvas with white background
        ctx.fillStyle = '#FFFFFF'
        ctx.fillRect(0, 0, width, height)
        ctx.drawImage(img, 0, 0, width, height)

        const mimeType = 'image/jpeg'
        const base64 = canvas.toDataURL(mimeType, quality)
        const optimizedSize = Math.round((base64.length * 3) / 4)

        resolve({
          base64,
          mimeType,
          width,
          height,
          originalSize: file.size,
          optimizedSize,
        })
      }
      img.src = reader.result as string
    }
    reader.readAsDataURL(file)
  })
}
