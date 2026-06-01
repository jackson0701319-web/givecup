import { createClient, type SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/lib/supabase/database.types"
import {
  readSupabasePublicEnvFromProcess,
  type SupabasePublicEnv,
} from "@/lib/supabase/public-env"

let client: SupabaseClient<Database> | null = null

const SUPABASE_ENV_SCRIPT_ID = "givecup-supabase-env"

function readSupabasePublicEnvFromDocument(): SupabasePublicEnv | null {
  if (typeof document === "undefined") return null

  const element = document.getElementById(SUPABASE_ENV_SCRIPT_ID)
  if (!element?.textContent) return null

  try {
    const parsed = JSON.parse(element.textContent) as Partial<SupabasePublicEnv>
    const url = parsed.url?.trim()
    const anonKey = parsed.anonKey?.trim()
    if (!url || !anonKey) return null
    return { url, anonKey }
  } catch {
    return null
  }
}

function resolveSupabasePublicEnv(): SupabasePublicEnv | null {
  return (
    readSupabasePublicEnvFromProcess() ?? readSupabasePublicEnvFromDocument()
  )
}

/** Prefer `useSupabase()` from `@/components/supabase-provider` in client components. */
export function getSupabase(): SupabaseClient<Database> | null {
  if (client) return client

  const env = resolveSupabasePublicEnv()
  if (!env) return null

  client = createClient<Database>(env.url, env.anonKey)
  return client
}
