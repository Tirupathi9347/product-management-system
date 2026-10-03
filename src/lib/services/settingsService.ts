import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import { UserSettings, Database } from '@/types/database'
import { getSupabaseConfig } from '@/lib/supabase/config'
import { devStore } from '@/lib/dev/devStore'

export async function getUserSettings(userId: string): Promise<UserSettings | null> {
  const { isConfigured } = getSupabaseConfig()
  if (!isConfigured) {
    const dev = devStore.getDevSettings()
    return {
      id: 'dev-settings-id',
      user_id: userId,
      theme: (dev.theme as 'system' | 'light' | 'dark') ?? 'system',
      low_stock_threshold: (dev.low_stock_threshold as number) ?? 2,
      expiry_warning_days: (dev.expiry_warning_days as number) ?? 14,
      notification_preferences: {
        email: Boolean(dev.notify_expiry ?? true),
        push: Boolean(dev.notify_low_stock ?? true),
        expiry_alerts: Boolean(dev.notify_expiry ?? true),
        low_stock_alerts: Boolean(dev.notify_low_stock ?? true),
      },
      created_at: '2026-01-01T00:00:00Z',
      updated_at: new Date().toISOString(),
    }
  }

  try {
    const supabase = getSupabaseBrowserClient()
    const { data, error } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error) {
      console.warn('Error fetching settings from cloud, falling back to local defaults:', error.message)
      return null
    }

    return data
  } catch {
    return null
  }
}

export async function updateUserSettings(
  userId: string,
  settings: Partial<Omit<UserSettings, 'id' | 'user_id' | 'created_at' | 'updated_at'>>
): Promise<UserSettings | null> {
  const { isConfigured } = getSupabaseConfig()
  if (!isConfigured) {
    const updated = devStore.updateDevSettings(settings as Record<string, unknown>)
    return {
      id: 'dev-settings-id',
      user_id: userId,
      theme: (updated.theme as 'system' | 'light' | 'dark') ?? 'system',
      low_stock_threshold: (updated.low_stock_threshold as number) ?? 2,
      expiry_warning_days: (updated.expiry_warning_days as number) ?? 14,
      notification_preferences: {
        email: true,
        push: true,
        expiry_alerts: true,
        low_stock_alerts: true,
      },
      created_at: '2026-01-01T00:00:00Z',
      updated_at: new Date().toISOString(),
    }
  }

  try {
    const supabase = getSupabaseBrowserClient()
    const updatePayload: Database['public']['Tables']['user_settings']['Update'] = {
      ...settings,
      updated_at: new Date().toISOString(),
    }
    const { data, error } = await supabase
      .from('user_settings')
      .update(updatePayload)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) {
      throw new Error(error.message)
    }

    return data
  } catch (err) {
    console.warn('Could not update live cloud settings, updating dev adapter:', err)
    devStore.updateDevSettings(settings as Record<string, unknown>)
    return null
  }
}
