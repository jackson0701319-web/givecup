export type RankChange = "up" | "down" | "same"

export interface RankSnapshot {
  rank: number
  amount: number
  donors: number
}

export interface RankDisplay {
  id: string
  rank: number
  name: string
  icon: string
  rowKey: string
  amount: number
  donors: number
  change: RankChange
  rankDelta: number
  searchText: string
  subtitle?: string
}

export interface RankSourceRow {
  id: string
  total_amount: number
  donor_count: number
}

export function buildRankDisplay<T extends RankSourceRow>(
  rows: T[],
  mapRow: (row: T, rank: number) => Omit<RankDisplay, "rank" | "change" | "rankDelta">,
  previousSnapshots?: Map<string, RankSnapshot>
): RankDisplay[] {
  const sorted = [...rows].sort((a, b) => b.total_amount - a.total_amount)

  return sorted.map((row, index) => {
    const rank = index + 1
    const base = mapRow(row, rank)
    const prev = previousSnapshots?.get(row.id)
    let change: RankChange = "same"
    let rankDelta = 0

    if (prev !== undefined) {
      rankDelta = prev.rank - rank
      if (rankDelta > 0) change = "up"
      else if (rankDelta < 0) change = "down"
      else if (
        row.total_amount > prev.amount ||
        row.donor_count > prev.donors
      ) {
        change = "up"
      }
    }

    return {
      ...base,
      rank,
      change,
      rankDelta,
    }
  })
}

export function normalizeSearchQuery(query: string): string {
  return query.trim().toLowerCase().replace(/\s+/g, "")
}

export function rankEntryMatchesQuery(entry: RankDisplay, query: string): boolean {
  if (!query) return true
  const normalized = normalizeSearchQuery(query)
  return entry.searchText.includes(normalized)
}
