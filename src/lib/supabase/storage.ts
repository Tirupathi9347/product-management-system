import { getSupabaseBrowserClient } from './client'
import { getSupabaseConfig } from './config'

export const PRODUCT_STORAGE_BUCKET = 'product-images'

export interface UploadImageResult {
  path: string
  publicUrl: string
  error: Error | null
}

/**
 * Uploads or replaces a product image in the user's storage folder.
 * In development mode (when Supabase credentials are placeholder),
 * uses a data URL with client storage to ensure reliable local preview and persistence.
 */
export async function uploadProductImage(
  userId: string,
  file: File,
  existingPath?: string
): Promise<UploadImageResult> {
  const { isConfigured } = getSupabaseConfig()

  // Development Fallback Adapter
  if (!isConfigured) {
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onloadend = () => {
        const dataUrl = reader.result as string
        const mockPath = `dev_${userId}_${Date.now()}_${file.name}`
        resolve({
          path: mockPath,
          publicUrl: dataUrl,
          error: null,
        })
      }
      reader.onerror = () => {
        resolve({
          path: '',
          publicUrl: '',
          error: new Error('Failed to read image file locally in development mode'),
        })
      }
      reader.readAsDataURL(file)
    })
  }

  // Live Supabase Storage Client
  const supabase = getSupabaseBrowserClient()

  try {
    if (existingPath) {
      await supabase.storage.from(PRODUCT_STORAGE_BUCKET).remove([existingPath])
    }

    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`
    const filePath = `${userId}/${fileName}`

    const { data, error } = await supabase.storage
      .from(PRODUCT_STORAGE_BUCKET)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true,
      })

    if (error) {
      return { path: '', publicUrl: '', error: new Error(error.message) }
    }

    const { data: publicUrlData } = supabase.storage
      .from(PRODUCT_STORAGE_BUCKET)
      .getPublicUrl(data.path)

    return {
      path: data.path,
      publicUrl: publicUrlData.publicUrl,
      error: null,
    }
  } catch (err) {
    return {
      path: '',
      publicUrl: '',
      error: err instanceof Error ? err : new Error('Unknown error during image upload'),
    }
  }
}

/**
 * Deletes a product image from storage
 */
export async function deleteProductImage(filePath: string): Promise<{ error: Error | null }> {
  const { isConfigured } = getSupabaseConfig()
  if (!isConfigured) {
    return { error: null }
  }

  const supabase = getSupabaseBrowserClient()
  try {
    const { error } = await supabase.storage.from(PRODUCT_STORAGE_BUCKET).remove([filePath])
    if (error) return { error: new Error(error.message) }
    return { error: null }
  } catch (err) {
    return { error: err instanceof Error ? err : new Error('Failed to delete image') }
  }
}

/**
 * Gets the public URL for an image path
 */
export function getProductImageUrl(filePath: string): string {
  if (!filePath) return ''
  if (filePath.startsWith('http://') || filePath.startsWith('https://') || filePath.startsWith('data:image')) {
    return filePath
  }

  const { isConfigured } = getSupabaseConfig()
  if (!isConfigured) return filePath

  const supabase = getSupabaseBrowserClient()
  const { data } = supabase.storage.from(PRODUCT_STORAGE_BUCKET).getPublicUrl(filePath)
  return data.publicUrl
}
