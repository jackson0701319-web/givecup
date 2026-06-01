export interface SupabasePublicEnv {
  url: string
  anonKey: string
}

/** Server (layout) or build-time env */
export function readSupabasePublicEnvFromProcess(): SupabasePublicEnv | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()

  if (!url || !anonKey) return null
  return { url, anonKey }
}
