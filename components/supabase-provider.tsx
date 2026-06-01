"use client"

import {
  createContext,
  useContext,
  useMemo,
  type ReactNode,
} from "react"
import { createClient, type SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/lib/supabase/database.types"

const SupabaseContext = createContext<SupabaseClient<Database> | null>(null)

interface SupabaseProviderProps {
  url: string
  anonKey: string
  children: ReactNode
}

export function SupabaseProvider({
  url,
  anonKey,
  children,
}: SupabaseProviderProps) {
  const client = useMemo(() => {
    const trimmedUrl = url.trim()
    const trimmedKey = anonKey.trim()
    if (!trimmedUrl || !trimmedKey) return null
    return createClient<Database>(trimmedUrl, trimmedKey)
  }, [url, anonKey])

  return (
    <SupabaseContext.Provider value={client}>{children}</SupabaseContext.Provider>
  )
}

export function useSupabase(): SupabaseClient<Database> | null {
  return useContext(SupabaseContext)
}
