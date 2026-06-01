"use client"

import { useCallback, useEffect, useState } from "react"
import { Globe, Users, TrendingUp } from "lucide-react"
import { getSupabase } from "@/lib/supabase/client"
import { aggregateStats } from "@/lib/countries"
import type { CountryRow } from "@/lib/supabase/database.types"

export function LiveStats() {
  const [countryCount, setCountryCount] = useState(0)
  const [totalDonors, setTotalDonors] = useState(0)
  const [totalAmount, setTotalAmount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadStats = useCallback(async () => {
    const supabase = getSupabase()
    if (!supabase) {
      setError(
        "Supabase 연결 정보가 없습니다. 로컬: .env.local + dev 재시작. 배포: Vercel env 3개 + Redeploy."
      )
      setLoading(false)
      return
    }

    const { data, error: fetchError } = await supabase
      .from("countries")
      .select("*")

    if (fetchError) {
      setError(fetchError.message)
      setLoading(false)
      return
    }

    const stats = aggregateStats((data ?? []) as CountryRow[])
    setCountryCount(stats.countryCount)
    setTotalDonors(stats.totalDonors)
    setTotalAmount(stats.totalAmount)
    setError(null)
    setLoading(false)
  }, [])

  useEffect(() => {
    loadStats()

    const supabase = getSupabase()
    if (!supabase) return

    const channel = supabase
      .channel("countries-stats-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "countries" },
        () => {
          loadStats()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [loadStats])

  if (loading) {
    return (
      <div className="text-center text-muted-foreground py-8">
        통계 불러오는 중…
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center text-destructive text-sm py-8">{error}</div>
    )
  }

  const stats = [
    {
      icon: <Globe className="w-6 h-6" />,
      label: "참여 국가",
      value: countryCount,
      suffix: "개국",
      color: "text-primary",
      bgColor: "bg-primary/10",
      prefix: "",
    },
    {
      icon: <Users className="w-6 h-6" />,
      label: "총 기부자",
      value: totalDonors,
      suffix: "명",
      color: "text-accent",
      bgColor: "bg-accent/10",
      prefix: "",
    },
    {
      icon: <TrendingUp className="w-6 h-6" />,
      label: "총 기부금",
      value: totalAmount,
      suffix: "",
      color: "text-cta",
      bgColor: "bg-cta/10",
      prefix: "$",
    },
  ]

  return (
    <div className="flex flex-wrap justify-center gap-6 lg:gap-8">
      {stats.map((stat, index) => (
        <div
          key={index}
          className="flex flex-col items-center gap-4 bg-card rounded-2xl px-10 py-8 shadow-md border border-border/50 min-w-[200px]"
        >
          <div className={`p-4 rounded-full ${stat.bgColor} ${stat.color}`}>
            {stat.icon}
          </div>
          <div className="text-center">
            <div className={`font-mono font-bold text-2xl lg:text-3xl ${stat.color}`}>
              {stat.prefix}
              {stat.value.toLocaleString()}
              {stat.suffix}
            </div>
            <div className="text-muted-foreground text-sm font-medium mt-2">
              {stat.label}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
