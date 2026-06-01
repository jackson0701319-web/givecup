"use client"

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react"
import { cn } from "@/lib/utils"
import { ArrowUp, ArrowDown, Heart, Minus, Plus, Search, X } from "lucide-react"
import { AddGroupModal } from "@/components/add-group-modal"
import { useSupabase } from "@/components/supabase-provider"
import { rowsToDisplay } from "@/lib/countries"
import { groupRowsToDisplay } from "@/lib/groups"
import { rankEntryMatchesQuery, type RankDisplay, type RankSnapshot } from "@/lib/rankings"
import type { CountryRow, GroupRow } from "@/lib/supabase/database.types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { DonationTarget } from "@/lib/donation-target"
import type { CountryDisplay } from "@/lib/countries"

const FLIP_DURATION_MS = 480
const FLIP_EASING = "cubic-bezier(0.22, 1, 0.36, 1)"

type RankingMode = "countries" | "groups"

function formatAmount(amount: number): string {
  return `$${Math.round(amount).toLocaleString()}`
}

function formatNumber(num: number): string {
  return num.toLocaleString()
}

function entryToDonationTarget(entry: RankDisplay, mode: RankingMode): DonationTarget {
  if (mode === "countries") {
    const country = entry as CountryDisplay
    const countryCode = (
      country.countryCode ??
      entry.rowKey ??
      ""
    )
      .trim()
      .toUpperCase()

    return {
      type: "country",
      id: String(entry.id),
      name: entry.name,
      icon: entry.icon,
      countryCode,
    }
  }

  const groupId = String(entry.id || entry.rowKey).trim()

  return {
    type: "group",
    id: groupId,
    name: entry.name,
    icon: entry.icon,
    groupId,
    category: entry.subtitle,
  }
}

interface RankingBoardProps {
  onDonateClick: (target: DonationTarget) => void
  refreshSignal?: number
}

export function RankingBoard({ onDonateClick, refreshSignal }: RankingBoardProps) {
  const supabase = useSupabase()
  const [mode, setMode] = useState<RankingMode>("countries")
  const [countryEntries, setCountryEntries] = useState<RankDisplay[]>([])
  const [groupEntries, setGroupEntries] = useState<RankDisplay[]>([])
  const [loadingCountries, setLoadingCountries] = useState(true)
  const [loadingGroups, setLoadingGroups] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [animatingIds, setAnimatingIds] = useState<Set<string>>(new Set())
  const [searchQuery, setSearchQuery] = useState("")
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [isAddGroupOpen, setIsAddGroupOpen] = useState(false)
  const [visibleChanges, setVisibleChanges] = useState<
    Map<string, { change: RankDisplay["change"]; rankDelta: number }>
  >(new Map())

  const countrySnapshotsRef = useRef<Map<string, RankSnapshot>>(new Map())
  const groupSnapshotsRef = useRef<Map<string, RankSnapshot>>(new Map())
  const rowRefs = useRef<Map<string, HTMLDivElement>>(new Map())
  const positionsBeforeUpdateRef = useRef<Map<string, DOMRect>>(new Map())
  const isFirstRenderRef = useRef(true)

  const entries = mode === "countries" ? countryEntries : groupEntries
  const loading = mode === "countries" ? loadingCountries : loadingGroups

  const captureRowPositions = useCallback(() => {
    const positions = new Map<string, DOMRect>()
    rowRefs.current.forEach((element, rowKey) => {
      positions.set(rowKey, element.getBoundingClientRect())
    })
    positionsBeforeUpdateRef.current = positions
  }, [])

  const applyDisplayUpdate = useCallback(
    (
      display: RankDisplay[],
      setEntries: (value: RankDisplay[]) => void,
      snapshotsRef: { current: Map<string, RankSnapshot> }
    ) => {
      const changedEntries = display.filter((entry) => entry.change !== "same")

      if (changedEntries.length > 0) {
        const nextVisibleChanges = new Map(
          changedEntries.map(
            (entry) =>
              [entry.id, { change: entry.change, rankDelta: entry.rankDelta }] as const
          )
        )
        setVisibleChanges(nextVisibleChanges)
        setAnimatingIds(new Set(changedEntries.map((entry) => entry.id)))
        window.setTimeout(() => {
          setVisibleChanges(new Map())
          setAnimatingIds(new Set())
        }, 3000)
      }

      display.forEach((entry) =>
        snapshotsRef.current.set(entry.id, {
          rank: entry.rank,
          amount: entry.amount,
          donors: entry.donors,
        })
      )

      if (!isFirstRenderRef.current) {
        captureRowPositions()
      }

      setEntries(display)
      isFirstRenderRef.current = false
    },
    [captureRowPositions]
  )

  const loadCountries = useCallback(async () => {
    if (!supabase) {
      setError(
        "Supabase 연결 정보가 없습니다. 로컬: .env.local 확인 후 dev 재시작. 배포: Vercel Environment Variables 3개 저장 후 최신 배포 Redeploy."
      )
      setLoadingCountries(false)
      return
    }

    const { data, error: fetchError } = await supabase
      .from("countries")
      .select("*")
      .order("total_amount", { ascending: false })

    if (fetchError) {
      setError(fetchError.message)
      setLoadingCountries(false)
      return
    }

    const display = rowsToDisplay(
      (data ?? []) as CountryRow[],
      countrySnapshotsRef.current
    )

    applyDisplayUpdate(display, setCountryEntries, countrySnapshotsRef)
    setError(null)
    setLoadingCountries(false)
  }, [applyDisplayUpdate, supabase])

  const loadGroups = useCallback(async () => {
    if (!supabase) {
      setError(
        "Supabase 연결 정보가 없습니다. 로컬: .env.local 확인 후 dev 재시작. 배포: Vercel Environment Variables 3개 저장 후 최신 배포 Redeploy."
      )
      setLoadingGroups(false)
      return
    }

    const { data, error: fetchError } = await supabase
      .from("groups")
      .select("*")
      .order("total_amount", { ascending: false })

    if (fetchError) {
      setError(fetchError.message)
      setLoadingGroups(false)
      return
    }

    const display = groupRowsToDisplay(
      (data ?? []) as GroupRow[],
      groupSnapshotsRef.current
    )

    applyDisplayUpdate(display, setGroupEntries, groupSnapshotsRef)
    setError(null)
    setLoadingGroups(false)
  }, [applyDisplayUpdate, supabase])

  useLayoutEffect(() => {
    const previousPositions = positionsBeforeUpdateRef.current
    if (previousPositions.size === 0) return

    rowRefs.current.forEach((element, rowKey) => {
      const first = previousPositions.get(rowKey)
      if (!first) return

      const last = element.getBoundingClientRect()
      const deltaX = first.left - last.left
      const deltaY = first.top - last.top

      if (Math.abs(deltaX) < 1 && Math.abs(deltaY) < 1) return

      element.style.transform = `translate3d(${deltaX}px, ${deltaY}px, 0)`
      element.style.transition = "transform 0s"
      element.style.zIndex = "20"
      element.style.willChange = "transform"

      requestAnimationFrame(() => {
        element.style.transition = `transform ${FLIP_DURATION_MS}ms ${FLIP_EASING}`
        element.style.transform = "translate3d(0, 0, 0)"
      })

      const cleanup = () => {
        element.style.transition = ""
        element.style.transform = ""
        element.style.zIndex = ""
        element.style.willChange = ""
      }

      element.addEventListener("transitionend", cleanup, { once: true })
      window.setTimeout(cleanup, FLIP_DURATION_MS + 80)
    })

    positionsBeforeUpdateRef.current = new Map()
  }, [countryEntries, groupEntries])

  useEffect(() => {
    isFirstRenderRef.current = true
    loadCountries()
    loadGroups()

    if (!supabase) return

    const countriesChannel = supabase
      .channel("countries-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "countries" },
        () => {
          loadCountries()
        }
      )
      .subscribe()

    const groupsChannel = supabase
      .channel("groups-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "groups" },
        () => {
          loadGroups()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(countriesChannel)
      supabase.removeChannel(groupsChannel)
    }
  }, [loadCountries, loadGroups, refreshSignal, supabase])

  const setRowRef = useCallback((rowKey: string, element: HTMLDivElement | null) => {
    if (element) {
      rowRefs.current.set(rowKey, element)
    } else {
      rowRefs.current.delete(rowKey)
    }
  }, [])

  const filteredEntries = useMemo(
    () => entries.filter((entry) => rankEntryMatchesQuery(entry, searchQuery)),
    [entries, searchQuery]
  )

  const suggestionEntries = useMemo(() => {
    if (!searchQuery.trim()) return []
    return filteredEntries.slice(0, 8)
  }, [filteredEntries, searchQuery])

  const handleDonate = useCallback(
    (entry: RankDisplay) => {
      onDonateClick(entryToDonationTarget(entry, mode))
      setShowSuggestions(false)
    },
    [mode, onDonateClick]
  )

  const handleModeChange = (nextMode: RankingMode) => {
    if (nextMode === mode) return
    setMode(nextMode)
    setSearchQuery("")
    setShowSuggestions(false)
    setIsAddGroupOpen(false)
    positionsBeforeUpdateRef.current = new Map()
  }

  const addGroupModal = (
    <AddGroupModal
      open={isAddGroupOpen}
      onOpenChange={setIsAddGroupOpen}
      onCreated={() => {
        loadGroups()
      }}
      onDonateClick={onDonateClick}
    />
  )

  const getRankStyle = (rank: number) => {
    switch (rank) {
      case 1:
        return "bg-gradient-to-r from-amber-50/80 to-yellow-50/60 border-l-4 border-l-amber-400"
      case 2:
        return "bg-gradient-to-r from-slate-50/80 to-gray-50/60 border-l-4 border-l-slate-400"
      case 3:
        return "bg-gradient-to-r from-orange-50/80 to-amber-50/60 border-l-4 border-l-orange-400"
      default:
        return "bg-card hover:bg-secondary/50"
    }
  }

  const getRankBadge = (rank: number) => {
    switch (rank) {
      case 1:
        return (
          <div className="w-11 h-11 rounded-full bg-gradient-to-br from-amber-400 to-yellow-500 flex items-center justify-center text-white font-bold text-lg shadow-sm">
            1
          </div>
        )
      case 2:
        return (
          <div className="w-11 h-11 rounded-full bg-gradient-to-br from-slate-400 to-gray-500 flex items-center justify-center text-white font-bold text-lg shadow-sm">
            2
          </div>
        )
      case 3:
        return (
          <div className="w-11 h-11 rounded-full bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center text-white font-bold text-lg shadow-sm">
            3
          </div>
        )
      default:
        return (
          <div className="w-11 h-11 rounded-full bg-secondary flex items-center justify-center text-muted-foreground font-semibold text-lg">
            {rank}
          </div>
        )
    }
  }

  const entityLabel = mode === "countries" ? "국가" : "집단"
  const emptyEntityCopy =
    mode === "countries"
      ? "아직 국가 데이터가 없습니다."
      : "아직 등록된 집단이 없습니다. 아래 버튼으로 첫 집단을 만들어보세요."

  if (loading && entries.length === 0) {
    return (
      <div className="w-full max-w-5xl mx-auto text-center py-16 text-muted-foreground">
        Supabase에서 {entityLabel} 순위를 불러오는 중…
      </div>
    )
  }

  if (error) {
    return (
      <div className="w-full max-w-5xl mx-auto rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-center text-sm text-destructive">
        {error}
      </div>
    )
  }

  if (entries.length === 0) {
    return (
      <div className="w-full max-w-5xl mx-auto space-y-4">
        <RankingBoardHeader
          mode={mode}
          onModeChange={handleModeChange}
          onAddGroup={() => setIsAddGroupOpen(true)}
        />
        <div className="rounded-2xl border border-dashed border-border/60 bg-card/50 px-6 py-16 text-center">
          <p className="text-muted-foreground">{emptyEntityCopy}</p>
          {mode === "groups" && (
            <Button
              className="mt-6 font-semibold"
              onClick={() => setIsAddGroupOpen(true)}
            >
              <Plus className="mr-2 h-4 w-4" />
              집단 추가하기
            </Button>
          )}
        </div>
        {addGroupModal}
      </div>
    )
  }

  return (
    <div className="w-full max-w-5xl mx-auto space-y-4">
      <RankingBoardHeader
        mode={mode}
        onModeChange={handleModeChange}
        onAddGroup={() => setIsAddGroupOpen(true)}
      />

      <div className="relative rounded-2xl border border-border/60 bg-card p-4 shadow-sm md:p-5">
        <label
          htmlFor="ranking-search"
          className="mb-2 block text-sm font-medium text-foreground"
        >
          {mode === "countries" ? "국가 검색" : "집단 검색"}
        </label>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="ranking-search"
            type="search"
            value={searchQuery}
            onChange={(event) => {
              setSearchQuery(event.target.value)
              setShowSuggestions(true)
            }}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => {
              window.setTimeout(() => setShowSuggestions(false), 150)
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter" && suggestionEntries[0]) {
                handleDonate(suggestionEntries[0])
              }
            }}
            placeholder={
              mode === "countries"
                ? "국가명 또는 코드 검색 (예: 대한민국, KR)"
                : "집단 이름 검색 (예: 서울대, 아미)"
            }
            className="h-11 pl-10 pr-10 text-base"
            autoComplete="off"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery("")
                setShowSuggestions(false)
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted-foreground hover:bg-secondary hover:text-foreground"
              aria-label="검색어 지우기"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          {searchQuery.trim()
            ? `${filteredEntries.length}개 ${entityLabel} 검색됨 · Enter로 첫 결과 기부`
            : mode === "countries"
              ? "216개국 중 원하는 국가를 찾아 바로 기부할 수 있습니다"
              : "등록된 집단 중 원하는 팀·팬덤·단체를 찾아 바로 기부할 수 있습니다"}
        </p>

        {showSuggestions && searchQuery.trim() && suggestionEntries.length > 0 && (
          <ul className="absolute left-4 right-4 z-30 mt-2 overflow-hidden rounded-xl border border-border/60 bg-card shadow-lg md:left-5 md:right-5">
            {suggestionEntries.map((entry) => (
              <li key={entry.rowKey}>
                <button
                  type="button"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => handleDonate(entry)}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-secondary/70"
                >
                  <span className="text-2xl">{entry.icon}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-foreground">{entry.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {entry.subtitle ? `${entry.subtitle} · ` : ""}
                      {entry.rank}위 · {formatAmount(entry.amount)}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-full bg-cta px-3 py-1 text-xs font-semibold text-cta-foreground">
                    화력 지원 ⚽
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}

        {showSuggestions && searchQuery.trim() && filteredEntries.length === 0 && (
          <div className="absolute left-4 right-4 z-30 mt-2 rounded-xl border border-border/60 bg-card px-4 py-6 text-center text-sm text-muted-foreground shadow-lg md:left-5 md:right-5">
            &apos;{searchQuery}&apos;에 해당하는 {entityLabel}이 없습니다.
          </div>
        )}
      </div>

      <div className="bg-card rounded-2xl shadow-lg border border-border/60">
        <div className="bg-primary px-8 py-5 rounded-t-2xl">
          <div className="grid grid-cols-12 gap-6 text-sm font-medium uppercase tracking-wide text-primary-foreground/90">
            <div className="col-span-1 text-center">순위</div>
            <div className="col-span-5">{entityLabel}</div>
            <div className="col-span-3 text-right">총 기부금</div>
            <div className="col-span-2 text-right">기부자 수</div>
            <div className="col-span-1 text-center">변동</div>
          </div>
        </div>

        <div className="relative rounded-b-2xl">
          {filteredEntries.length === 0 ? (
            <div className="px-8 py-16 text-center text-muted-foreground">
              검색 결과가 없습니다. 다른 {entityLabel} 이름으로 다시 검색해 주세요.
            </div>
          ) : (
            filteredEntries.map((entry) => {
              const visible = visibleChanges.get(entry.id)
              const change = visible?.change ?? entry.change
              const rankDelta = visible?.rankDelta ?? entry.rankDelta
              const rankShift = Math.abs(rankDelta)

              return (
                <div
                  key={entry.rowKey}
                  ref={(element) => setRowRef(entry.rowKey, element)}
                  className={cn(
                    "grid grid-cols-12 gap-6 items-center px-8 py-5 border-b border-border/40 last:border-b-0",
                    getRankStyle(entry.rank),
                    animatingIds.has(entry.id) && "bg-accent/10"
                  )}
                >
                  <div className="col-span-1 flex justify-center">
                    {getRankBadge(entry.rank)}
                  </div>

                  <div className="col-span-5 flex items-center gap-4">
                    <span className="text-4xl">{entry.icon}</span>
                    <div className="flex w-full items-center justify-between gap-3 min-w-0">
                      <div className="min-w-0">
                        <span
                          className={cn(
                            "font-semibold text-lg tracking-tight block truncate",
                            entry.rank <= 3
                              ? "text-foreground"
                              : "text-foreground/85"
                          )}
                        >
                          {entry.name}
                        </span>
                        {entry.subtitle && (
                          <span className="text-xs text-muted-foreground">
                            {entry.subtitle}
                          </span>
                        )}
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleDonate(entry)}
                        className="bg-cta hover:bg-cta/90 text-cta-foreground h-8 px-3 text-xs font-semibold whitespace-nowrap shrink-0"
                      >
                        <Heart className="w-3.5 h-3.5 mr-1" />
                        화력 지원 ⚽
                      </Button>
                    </div>
                  </div>

                  <div className="col-span-3 text-right">
                    <span
                      className={cn(
                        "font-mono font-bold text-xl tracking-tight",
                        entry.rank === 1 ? "text-amber-600" : "text-primary"
                      )}
                    >
                      {formatAmount(entry.amount)}
                    </span>
                  </div>

                  <div className="col-span-2 text-right">
                    <span className="font-mono text-muted-foreground text-base">
                      {formatNumber(entry.donors)}명
                    </span>
                  </div>

                  <div className="col-span-1 flex justify-center">
                    {change === "up" && (
                      <div
                        className={cn(
                          "flex min-w-10 flex-col items-center justify-center gap-0.5 rounded-full px-1.5 py-1.5 bg-emerald-50 text-emerald-600",
                          animatingIds.has(entry.id) &&
                            "ring-2 ring-emerald-300 scale-110"
                        )}
                      >
                        <ArrowUp className="w-4 h-4" />
                        {rankShift > 0 ? (
                          <span className="text-[10px] font-bold leading-none">
                            +{rankShift}
                          </span>
                        ) : (
                          <span className="text-[10px] font-medium leading-none opacity-70">
                            ·
                          </span>
                        )}
                      </div>
                    )}
                    {change === "down" && (
                      <div className="flex min-w-10 flex-col items-center justify-center gap-0.5 rounded-full px-1.5 py-1.5 bg-rose-50 text-rose-500">
                        <ArrowDown className="w-4 h-4" />
                        {rankShift > 0 && (
                          <span className="text-[10px] font-bold leading-none">
                            -{rankShift}
                          </span>
                        )}
                      </div>
                    )}
                    {change === "same" && (
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-secondary text-muted-foreground">
                        <Minus className="w-4 h-4" />
                      </div>
                    )}
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
      {addGroupModal}
    </div>
  )
}

function RankingBoardHeader({
  mode,
  onModeChange,
  onAddGroup,
}: {
  mode: RankingMode
  onModeChange: (mode: RankingMode) => void
  onAddGroup: () => void
}) {
  return (
    <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
      <ModeTabs mode={mode} onChange={onModeChange} />
      {mode === "groups" && (
        <Button
          type="button"
          variant="outline"
          className="h-11 shrink-0 rounded-xl border-primary/30 bg-primary/5 font-semibold text-primary hover:bg-primary/10"
          onClick={onAddGroup}
        >
          <Plus className="mr-2 h-4 w-4" />
          집단 추가
        </Button>
      )}
    </div>
  )
}

function ModeTabs({
  mode,
  onChange,
}: {
  mode: RankingMode
  onChange: (mode: RankingMode) => void
}) {
  return (
    <div className="flex justify-center">
      <div className="inline-flex rounded-2xl border border-border/60 bg-muted/40 p-1.5 shadow-inner">
        <button
          type="button"
          onClick={() => onChange("countries")}
          className={cn(
            "rounded-xl px-5 py-2.5 text-sm font-semibold transition-all duration-200",
            mode === "countries"
              ? "bg-card text-foreground shadow-md ring-1 ring-border/60"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          🌐 국가별 대항전
        </button>
        <button
          type="button"
          onClick={() => onChange("groups")}
          className={cn(
            "rounded-xl px-5 py-2.5 text-sm font-semibold transition-all duration-200",
            mode === "groups"
              ? "bg-card text-foreground shadow-md ring-1 ring-border/60"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          👥 집단별 대항전
        </button>
      </div>
    </div>
  )
}
