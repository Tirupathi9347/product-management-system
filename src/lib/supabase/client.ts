import { createBrowserClient } from '@supabase/ssr'
import { Database } from '@/types/database'
import { getSupabaseConfig } from './config'

let browserClient: ReturnType<typeof createBrowserClient<Database>> | null = null

export function getSupabaseBrowserClient() {
  if (browserClient) return browserClient

  const { url, anonKey } = getSupabaseConfig()

  browserClient = createBrowserClient<Database>(url, anonKey)
  return browserClient
}
