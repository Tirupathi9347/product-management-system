export const getSupabaseConfig = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
  
  const isConfigured = 
    Boolean(url) && 
    Boolean(anonKey) && 
    !url.includes('placeholder.supabase.co') &&
    !anonKey.includes('placeholder')

  return {
    url: url || 'https://placeholder.supabase.co',
    anonKey: anonKey || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.placeholder',
    isConfigured
  }
}
