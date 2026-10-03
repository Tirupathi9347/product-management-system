import { ActivityLog } from '@/types'
import { getSupabaseConfig } from '@/lib/supabase/config'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import { devStore } from '@/lib/dev/devStore'

export class ActivityService {
  /**
   * Retrieves recent activity logs across the ecosystem or for a specific product.
   */
  public static async getActivities(limit = 10, productId?: string): Promise<ActivityLog[]> {
    const { isConfigured } = getSupabaseConfig()

    if (!isConfigured) {
      return devStore.getActivities(limit, productId)
    }

    const supabase = getSupabaseBrowserClient()
    let query = supabase
      .from('activity_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (productId) {
      query = query.eq('product_id', productId)
    }

    const { data, error } = await query
    if (error) {
      console.warn('Error fetching activity logs from Supabase, falling back:', error.message)
      return devStore.getActivities(limit, productId)
    }

    return data || []
  }

  /**
   * Logs an action event.
   */
  public static async logActivity(
    data: Omit<ActivityLog, 'id' | 'created_at'>
  ): Promise<ActivityLog> {
    const { isConfigured } = getSupabaseConfig()

    if (!isConfigured) {
      return devStore.createActivity(data)
    }

    const supabase = getSupabaseBrowserClient()
    const { data: record, error } = await supabase
      .from('activity_logs')
      .insert({
        ...data,
        created_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      console.warn('Failed to log activity to Supabase:', error.message)
      return devStore.createActivity(data)
    }

    return record as ActivityLog
  }
}
