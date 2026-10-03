import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import { Category } from '@/types/database'
import { getSupabaseConfig } from '@/lib/supabase/config'
import { devStore } from '@/lib/dev/devStore'

export async function getCategories(): Promise<Category[]> {
  const { isConfigured } = getSupabaseConfig()
  if (!isConfigured) {
    return devStore.getCategories()
  }

  try {
    const supabase = getSupabaseBrowserClient()
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('name', { ascending: true })

    if (error || !data || data.length === 0) {
      return devStore.getCategories().filter(
        c => !c.name.toLowerCase().includes('medicine') && !c.name.toLowerCase().includes('medical')
      )
    }

    return data.filter(
      c => !c.name.toLowerCase().includes('medicine') && !c.name.toLowerCase().includes('medical')
    )
  } catch {
    return devStore.getCategories().filter(
      c => !c.name.toLowerCase().includes('medicine') && !c.name.toLowerCase().includes('medical')
    )
  }
}

export const CategoryService = {
  getCategories,
}
