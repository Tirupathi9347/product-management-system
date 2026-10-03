import { ProductWithMeta, ProductFilterOptions } from '@/types'
import { Database } from '@/types/database'
import { getSupabaseConfig } from '@/lib/supabase/config'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import { devStore } from '@/lib/dev/devStore'

export class ProductService {
  /**
   * Retrieves products matching filter, search, and sort criteria.
   */
  public static async getProducts(filter?: ProductFilterOptions): Promise<ProductWithMeta[]> {
    const { isConfigured } = getSupabaseConfig()

    if (!isConfigured) {
      return devStore.getProducts(filter)
    }

    const supabase = getSupabaseBrowserClient()
    let query = supabase.from('products').select('*, category:categories(*)')

    if (filter?.search) {
      query = query.ilike('name', `%${filter.search}%`)
    }
    if (filter?.categoryId) {
      query = query.eq('category_id', filter.categoryId)
    }
    if (filter?.brand) {
      query = query.eq('brand', filter.brand)
    }

    // Default sorting
    query = query.order('created_at', { ascending: false })

    const { data, error } = await query
    if (error) {
      console.error('Error fetching products from Supabase:', error.message)
      return devStore.getProducts(filter)
    }

    return (data as unknown as ProductWithMeta[]) || []
  }

  /**
   * Retrieves a single product by its unique ID.
   */
  public static async getProduct(id: string): Promise<ProductWithMeta | null> {
    const { isConfigured } = getSupabaseConfig()

    if (!isConfigured) {
      return devStore.getProductById(id)
    }

    const supabase = getSupabaseBrowserClient()
    const { data, error } = await supabase
      .from('products')
      .select('*, category:categories(*)')
      .eq('id', id)
      .single()

    if (error) {
      console.warn(`Product ${id} not found in Supabase:`, error.message)
      return devStore.getProductById(id)
    }

    return data as unknown as ProductWithMeta
  }

  private static isValidUUID(str?: string | null): boolean {
    return Boolean(str && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(str))
  }

  /**
   * Creates a new product record.
   */
  public static async createProduct(
    product: Omit<ProductWithMeta, 'id' | 'created_at' | 'updated_at'>
  ): Promise<ProductWithMeta> {
    const { isConfigured } = getSupabaseConfig()

    // If Supabase is not configured or user_id is not a valid UUID, persist directly to local devStore
    if (!isConfigured || !this.isValidUUID(product.user_id)) {
      return devStore.createProduct(product)
    }

    try {
      const dbPayload = { ...product }
      delete (dbPayload as Record<string, unknown>).category
      delete (dbPayload as Record<string, unknown>).is_archived

      // Sanitize category_id: must be a valid UUID or null
      if (dbPayload.category_id && !this.isValidUUID(dbPayload.category_id)) {
        dbPayload.category_id = null
      }

      const insertPayload = {
        ...dbPayload,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as unknown as Database['public']['Tables']['products']['Insert']

      const supabase = getSupabaseBrowserClient()
      const { data, error } = await supabase
        .from('products')
        .insert(insertPayload)
        .select('*, category:categories(*)')
        .single()

      if (error) {
        console.warn('Supabase product insertion error, persisting locally in devStore:', error.message)
        return devStore.createProduct(product)
      }

      // Best-effort activity log (non-blocking)
      try {
        await supabase.from('activity_logs').insert({
          user_id: product.user_id,
          product_id: data.id,
          action: 'create',
          description: `Added product "${data.name}" to inventory (${data.quantity} ${data.unit})`,
        })
      } catch (logErr) {
        console.warn('Activity log insert skipped:', logErr)
      }

      // Also mirror into local devStore so offline/client state remains consistent
      try {
        devStore.createProduct({
          ...product,
          id: data.id,
        } as ProductWithMeta)
      } catch {}

      return data as unknown as ProductWithMeta
    } catch (err) {
      console.warn('Unexpected error in Supabase createProduct, falling back to local devStore:', err)
      return devStore.createProduct(product)
    }
  }

  /**
   * Updates an existing product.
   */
  public static async updateProduct(
    id: string,
    updates: Partial<ProductWithMeta>
  ): Promise<ProductWithMeta> {
    const { isConfigured } = getSupabaseConfig()

    if (!isConfigured) {
      return devStore.updateProduct(id, updates)
    }

    try {
      const dbPayload = { ...updates }
      delete (dbPayload as Record<string, unknown>).category
      delete (dbPayload as Record<string, unknown>).is_archived

      if (dbPayload.category_id && !this.isValidUUID(dbPayload.category_id)) {
        dbPayload.category_id = null
      }

      const updatePayload = {
        ...dbPayload,
        updated_at: new Date().toISOString(),
      } as unknown as Database['public']['Tables']['products']['Update']

      const supabase = getSupabaseBrowserClient()
      const { data, error } = await supabase
        .from('products')
        .update(updatePayload)
        .eq('id', id)
        .select('*, category:categories(*)')
        .single()

      if (error) {
        console.warn('Supabase update error, falling back to devStore:', error.message)
        return devStore.updateProduct(id, updates)
      }

      try {
        await supabase.from('activity_logs').insert({
          user_id: data.user_id,
          product_id: id,
          action: 'update',
          description: `Updated product "${data.name}" specifications`,
        })
      } catch {}

      return data as unknown as ProductWithMeta
    } catch (err) {
      console.warn('Unexpected error in Supabase updateProduct, falling back to devStore:', err)
      return devStore.updateProduct(id, updates)
    }
  }

  /**
   * Archives a product (soft hide).
   */
  public static async archiveProduct(id: string): Promise<ProductWithMeta> {
    return this.updateProduct(id, { is_archived: true })
  }

  /**
   * Restores an archived product.
   */
  public static async restoreProduct(id: string): Promise<ProductWithMeta> {
    return this.updateProduct(id, { is_archived: false })
  }

  /**
   * Permanently deletes a product.
   */
  public static async deleteProduct(id: string): Promise<boolean> {
    const { isConfigured } = getSupabaseConfig()

    if (!isConfigured) {
      return devStore.deleteProduct(id)
    }

    try {
      const supabase = getSupabaseBrowserClient()
      const { error } = await supabase.from('products').delete().eq('id', id)

      if (error) {
        console.warn('Supabase delete error, falling back to devStore:', error.message)
        return devStore.deleteProduct(id)
      }
      return true
    } catch (err) {
      console.warn('Unexpected error in Supabase deleteProduct, falling back to devStore:', err)
      return devStore.deleteProduct(id)
    }
  }
}
