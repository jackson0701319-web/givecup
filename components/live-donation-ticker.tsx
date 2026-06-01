"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { Heart } from "lucide-react"
import { cn } from "@/lib/utils"
import { useSupabase } from "@/components/supabase-provider"
import type { CountryRow, DonationRow, GroupRow } from "@/lib/supabase/database.types"
import {
  buildDonationToastMessage,
  type CountryToastLookup,
  type GroupToastLookup,
} from "@/lib/donation-toast"

const TOAST_DURATION_MS = 3000
const TOAST_EXIT_MS = 2800

interface DonationToast {
  id: string
  message: string
  exiting: boolean
}

export function LiveDonationTicker() {
  const supabase = useSupabase()
  const [toasts, setToasts] = useState<DonationToast[]>([])
  const countriesByCodeRef = useRef<Map<string, CountryToastLookup>>(new Map())
  const groupsByIdRef = useRef<Map<string, GroupToastLookup>>(new Map())
  const toastTimersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(
    new Map()
  )

  const removeToast = useCallback((id: string) => {
    const timer = toastTimersRef.current.get(id)
    if (timer) {
      clearTimeout(timer)
      toastTimersRef.current.delete(id)
    }
    setToasts((current) => current.filter((toast) => toast.id !== id))
  }, [])

  const addToast = useCallback(
    (message: string) => {
      const id = crypto.randomUUID()

      setToasts((current) => [...current, { id, message, exiting: false }])

      const exitTimer = setTimeout(() => {
        setToasts((current) =>
          current.map((toast) =>
            toast.id === id ? { ...toast, exiting: true } : toast
          )
        )
      }, TOAST_EXIT_MS)

      const removeTimer = setTimeout(() => {
        removeToast(id)
      }, TOAST_DURATION_MS)

      toastTimersRef.current.set(id, removeTimer)
    },
    [removeToast]
  )

  useEffect(() => {
    if (!supabase) return

    let active = true

    const seedLookups = async () => {
      const [countriesResult, groupsResult] = await Promise.all([
        supabase.from("countries").select("country_code, name, flag_emoji"),
        supabase.from("groups").select("id, group_name, category"),
      ])

      if (!active) return

      const countryMap = new Map<string, CountryToastLookup>()
      countriesResult.data?.forEach(
        (row: Pick<CountryRow, "country_code" | "name" | "flag_emoji">) => {
          countryMap.set(row.country_code.toUpperCase(), {
            name: row.name,
            flag_emoji: row.flag_emoji,
          })
        }
      )
      countriesByCodeRef.current = countryMap

      const groupMap = new Map<string, GroupToastLookup>()
      groupsResult.data?.forEach(
        (row: Pick<GroupRow, "id" | "group_name" | "category">) => {
          groupMap.set(row.id, {
            group_name: row.group_name,
            category: row.category,
          })
        }
      )
      groupsByIdRef.current = groupMap
    }

    seedLookups()

    const channel = supabase
      .channel("live-donation-ticker")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "donations" },
        (payload) => {
          const row = payload.new as DonationRow
          const message = buildDonationToastMessage(
            row,
            countriesByCodeRef.current,
            groupsByIdRef.current
          )
          if (message) {
            addToast(message)
          }
        }
      )
      .subscribe()

    return () => {
      active = false
      toastTimersRef.current.forEach((timer) => clearTimeout(timer))
      toastTimersRef.current.clear()
      supabase.removeChannel(channel)
    }
  }, [addToast, supabase])

  if (toasts.length === 0) return null

  return (
    <div
      className="fixed top-24 right-4 z-[100] flex w-[min(100vw-2rem,22rem)] flex-col gap-2 pointer-events-none"
      aria-live="polite"
      aria-label="실시간 유효슈팅 중계"
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={cn(
            "pointer-events-auto flex items-start gap-3 rounded-xl border border-border/60 bg-card/95 px-4 py-3 shadow-lg backdrop-blur-md transition-all duration-300 ease-out",
            toast.exiting
              ? "translate-x-8 opacity-0"
              : "translate-x-0 opacity-100 animate-in slide-in-from-right-full fade-in"
          )}
        >
          <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-cta/10">
            <Heart className="h-4 w-4 text-cta" />
          </div>
          <p className="text-sm font-medium leading-snug text-foreground">
            {toast.message}
          </p>
        </div>
      ))}
    </div>
  )
}
