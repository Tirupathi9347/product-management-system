import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import { Profile, Database } from '@/types/database'
import { getSupabaseConfig } from '@/lib/supabase/config'

export async function getUserProfile(userId: string): Promise<Profile | null> {
  const { isConfigured } = getSupabaseConfig()
  if (!isConfigured) return null

  const supabase = getSupabaseBrowserClient()
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()

  if (error) {
    console.error('Error fetching profile:', error.message)
    return null
  }

  return data
}

export async function updateUserProfile(
  userId: string,
  updates: Partial<Pick<Profile, 'display_name' | 'avatar_url'>>
): Promise<Profile | null> {
  const { isConfigured } = getSupabaseConfig()
  if (!isConfigured) return null

  const supabase = getSupabaseBrowserClient()
    const updatePayload: Database['public']['Tables']['profiles']['Update'] = {
      ...updates,
      updated_at: new Date().toISOString(),
    }
    const { data, error } = await supabase
      .from('profiles')
      .update(updatePayload)
    .eq('id', userId)
    .select()
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return data
}
