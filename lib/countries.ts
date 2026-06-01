import type { CountryRow } from "@/lib/supabase/database.types"
import {
  buildRankDisplay,
  normalizeSearchQuery,
  type RankChange,
  type RankDisplay,
  type RankSnapshot,
} from "@/lib/rankings"

export type { RankChange, RankSnapshot, RankDisplay }

export interface CountryDisplay extends RankDisplay {
  countryCode: string
  flag: string
}

export function rowsToDisplay(
  rows: CountryRow[],
  previousSnapshots?: Map<string, RankSnapshot>
): CountryDisplay[] {
  return buildRankDisplay(
    rows,
    (row): Omit<CountryDisplay, "rank" | "change" | "rankDelta"> => ({
      id: row.id,
      name: row.name,
      icon: row.flag_emoji,
      rowKey: row.country_code,
      amount: row.total_amount,
      donors: row.donor_count,
      searchText: normalizeSearchQuery(`${row.name} ${row.country_code}`),
      countryCode: row.country_code,
      flag: row.flag_emoji,
    }),
    previousSnapshots
  ) as CountryDisplay[]
}

export function aggregateStats(rows: CountryRow[]) {
  const totalAmount = rows.reduce((sum, r) => sum + r.total_amount, 0)
  const totalDonors = rows.reduce((sum, r) => sum + r.donor_count, 0)
  return {
    countryCount: rows.length,
    totalDonors,
    totalAmount,
  }
}
