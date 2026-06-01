"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import {
  ArrowLeft,
  BookOpen,
  Radio,
  Search,
  Shield,
  Trophy,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useSupabase } from "@/components/supabase-provider"
import type { CountryRow, DonationRow, GroupRow } from "@/lib/supabase/database.types"
import {
  donationRowToLedgerEntry,
  formatLedgerAmount,
  formatLedgerTime,
  maskReceiptId,
  normalizeReceiptQuery,
  type CountryLookup,
  type GroupLookup,
  type LedgerEntry,
} from "@/lib/donations-ledger"

const INITIAL_LIMIT = 80
const NEW_ROW_HIGHLIGHT_MS = 2400

export default function LedgerPage() {
  const supabase = useSupabase()
  const [entries, setEntries] = useState<LedgerEntry[]>([])
  const [receiptSearch, setReceiptSearch] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [liveConnected, setLiveConnected] = useState(false)
  const countriesRef = useRef<Map<string, CountryLookup>>(new Map())
  const groupsRef = useRef<Map<string, GroupLookup>>(new Map())

  const loadCountries = useCallback(async () => {
    if (!supabase) return new Map<string, CountryLookup>()

    const { data, error: fetchError } = await supabase
      .from("countries")
      .select("country_code, name, flag_emoji")

    if (fetchError || !data) return new Map<string, CountryLookup>()

    const map = new Map<string, CountryLookup>()
    data.forEach((row: Pick<CountryRow, "country_code" | "name" | "flag_emoji">) => {
      map.set(row.country_code.toUpperCase(), {
        name: row.name,
        flag_emoji: row.flag_emoji,
      })
    })
    return map
  }, [supabase])

  const loadGroups = useCallback(async () => {
    if (!supabase) return new Map<string, GroupLookup>()

    const { data, error: fetchError } = await supabase
      .from("groups")
      .select("id, group_name, category")

    if (fetchError || !data) return new Map<string, GroupLookup>()

    const map = new Map<string, GroupLookup>()
    data.forEach((row: Pick<GroupRow, "id" | "group_name" | "category">) => {
      map.set(row.id, {
        group_name: row.group_name,
        category: row.category,
      })
    })
    return map
  }, [supabase])

  const loadDonations = useCallback(
    async (
      countryMap: Map<string, CountryLookup>,
      groupMap: Map<string, GroupLookup>
    ) => {
    if (!supabase) {
      setError("Supabase 연결 설정을 확인해주세요.")
      return
    }

    const { data, error: fetchError } = await supabase
      .from("donations")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(INITIAL_LIMIT)

    if (fetchError) {
      setError(fetchError.message)
      return
    }

    setEntries(
      (data ?? []).map((row) =>
        donationRowToLedgerEntry(row, countryMap, groupMap)
      )
    )
  },
  [supabase])

  useEffect(() => {
    let active = true

    const init = async () => {
      setLoading(true)
      setError(null)

      const [countryMap, groupMap] = await Promise.all([
        loadCountries(),
        loadGroups(),
      ])
      if (!active) return

      countriesRef.current = countryMap
      groupsRef.current = groupMap
      await loadDonations(countryMap, groupMap)

      if (active) setLoading(false)
    }

    init()

    return () => {
      active = false
    }
  }, [loadCountries, loadGroups, loadDonations])

  useEffect(() => {
    if (!supabase) return

    const channel = supabase
      .channel("open-ledger-donations")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "donations" },
        (payload) => {
          const row = payload.new as DonationRow

          setEntries((current) => {
            if (current.some((entry) => entry.id === row.id)) {
              return current
            }

            const entry = donationRowToLedgerEntry(
              row,
              countriesRef.current,
              groupsRef.current,
              true
            )

            return [entry, ...current]
          })

          window.setTimeout(() => {
            setEntries((current) =>
              current.map((entry) =>
                entry.id === row.id ? { ...entry, isNew: false } : entry
              )
            )
          }, NEW_ROW_HIGHLIGHT_MS)
        }
      )
      .subscribe((status) => {
        setLiveConnected(status === "SUBSCRIBED")
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase])

  const normalizedSearch = normalizeReceiptQuery(receiptSearch)

  const visibleEntries = useMemo(() => {
    if (!normalizedSearch) return entries

    return entries.filter(
      (entry) => entry.receiptId.toLowerCase() === normalizedSearch
    )
  }, [entries, normalizedSearch])

  const isSearching = normalizedSearch.length > 0

  return (
    <main className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b border-border/50 bg-card/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-4 md:px-8">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              메인
            </Link>
            <div className="hidden h-5 w-px bg-border sm:block" />
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary/80 shadow-sm">
                <BookOpen className="h-4 w-4 text-primary-foreground" />
              </div>
              <div>
                <p className="text-sm font-bold text-foreground">오픈 장부</p>
                <p className="text-xs text-muted-foreground">GiveCup Ledger</p>
              </div>
            </div>
          </div>

          <div
            className={cn(
              "inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium",
              liveConnected
                ? "bg-accent/10 text-accent"
                : "bg-muted text-muted-foreground"
            )}
          >
            <span
              className={cn(
                "h-2 w-2 rounded-full",
                liveConnected ? "animate-pulse bg-accent" : "bg-muted-foreground"
              )}
            />
            {liveConnected ? "실시간 연결됨" : "연결 중…"}
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-4 py-10 md:px-8">
        <div className="mb-10 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary">
            <Radio className="h-4 w-4" />
            전 세계 기부가 이곳에 실시간 기록됩니다
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
            GiveCup 실시간 오픈 장부
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-muted-foreground leading-relaxed">
            모든 기부는 영수증 ID와 함께 공개 장부에 남습니다. 기부 후 받은
            UUID로 본인 기부를 직접 검증할 수 있습니다.
          </p>
        </div>

        <div className="mb-8 rounded-2xl border border-border/60 bg-card p-4 shadow-sm md:p-5">
          <label
            htmlFor="receipt-search"
            className="mb-2 flex items-center gap-2 text-sm font-semibold text-foreground"
          >
            <Search className="h-4 w-4 text-primary" />
            영수증 ID 검색
          </label>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Input
              id="receipt-search"
              type="text"
              placeholder="예: 12345678-1234-1234-1234-123456789abc"
              value={receiptSearch}
              onChange={(e) => setReceiptSearch(e.target.value)}
              className="h-12 flex-1 font-mono text-sm"
            />
            {receiptSearch && (
              <Button
                type="button"
                variant="outline"
                className="h-12 shrink-0"
                onClick={() => setReceiptSearch("")}
              >
                초기화
              </Button>
            )}
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            기부 완료 화면에 표시된 영수증 UUID를 그대로 붙여넣으면 해당 건만
            필터링됩니다.
          </p>
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            {error.includes("donations")
              ? "donations 테이블을 찾을 수 없습니다. Supabase에서 supabase/donations.sql 을 실행하고, Table Editor에서 donations → Realtime을 켜주세요."
              : error}
          </div>
        )}

        <div className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm">
          <div className="hidden grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)_minmax(0,0.9fr)_minmax(0,0.7fr)_minmax(0,1fr)] gap-4 border-b border-border/50 bg-muted/40 px-5 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground md:grid">
            <span>기부 시간</span>
            <span>기부 대상</span>
            <span>기부자</span>
            <span className="text-right">금액</span>
            <span>영수증 ID</span>
          </div>

          {loading ? (
            <div className="px-5 py-16 text-center text-muted-foreground">
              장부를 불러오는 중…
            </div>
          ) : visibleEntries.length === 0 ? (
            <div className="px-5 py-16 text-center">
              <Trophy className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" />
              <p className="font-medium text-foreground">
                {isSearching
                  ? "일치하는 영수증을 찾을 수 없습니다"
                  : "아직 기록된 기부가 없습니다"}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {isSearching
                  ? "UUID를 다시 확인하거나, 메인에서 기부 후 영수증을 받아보세요."
                  : "첫 기부가 들어오면 이곳에 실시간으로 표시됩니다."}
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-border/40">
              {visibleEntries.map((entry) => (
                <li
                  key={entry.id}
                  className={cn(
                    "ledger-row-enter px-5 py-4 transition-colors duration-500",
                    entry.isNew && "bg-accent/10"
                  )}
                >
                  <div className="grid gap-3 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)_minmax(0,0.9fr)_minmax(0,0.7fr)_minmax(0,1fr)] md:items-center md:gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground md:hidden">
                        기부 시간
                      </p>
                      <time
                        dateTime={entry.createdAt}
                        className="text-sm font-medium text-foreground"
                      >
                        {formatLedgerTime(entry.createdAt)}
                      </time>
                    </div>

                    <div>
                      <p className="text-xs text-muted-foreground md:hidden">
                        기부 대상
                      </p>
                      <span className="inline-flex items-center gap-2 text-sm font-medium text-foreground">
                        <span className="text-lg leading-none">
                          {entry.flagEmoji}
                        </span>
                        <span>
                          {entry.targetName}
                          {entry.targetSubtitle && (
                            <span className="ml-1 text-xs font-normal text-muted-foreground">
                              ({entry.targetSubtitle})
                            </span>
                          )}
                        </span>
                      </span>
                    </div>

                    <div>
                      <p className="text-xs text-muted-foreground md:hidden">
                        기부자
                      </p>
                      <p className="text-sm font-medium text-foreground">
                        {entry.donorName}
                      </p>
                    </div>

                    <div className="md:text-right">
                      <p className="text-xs text-muted-foreground md:hidden">
                        금액
                      </p>
                      <p className="text-sm font-bold text-primary">
                        {formatLedgerAmount(entry.amount)}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-muted-foreground md:hidden">
                        영수증 ID
                      </p>
                      <p
                        className="font-mono text-xs text-muted-foreground"
                        title={
                          isSearching ? entry.receiptId : "영수증 ID (일부 마스킹)"
                        }
                      >
                        {isSearching
                          ? entry.receiptId
                          : maskReceiptId(entry.receiptId)}
                      </p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-2 text-sm text-muted-foreground">
          <Shield className="h-4 w-4 text-accent" />
          <span>공개 장부 · 영수증으로 개별 기부 검증 가능</span>
        </div>
      </div>
    </main>
  )
}
