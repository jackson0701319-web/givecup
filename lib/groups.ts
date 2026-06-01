import type { GroupRow } from "@/lib/supabase/database.types"
import {
  GROUP_CATEGORIES,
  getGroupCategoryLabel,
  type GroupCategoryValue,
} from "@/lib/group-categories"
import {
  buildRankDisplay,
  normalizeSearchQuery,
  type RankDisplay,
  type RankSnapshot,
} from "@/lib/rankings"

export {
  GROUP_CATEGORIES,
  getGroupCategoryLabel,
  type GroupCategoryValue,
}

export function getGroupCategoryIcon(category: string): string {
  const value = category.trim().toLowerCase()

  const fromList = GROUP_CATEGORIES.find((item) => item.value === value)
  if (fromList) return fromList.icon

  if (
    value.includes("university") ||
    value.includes("college") ||
    value.includes("대학") ||
    value.includes("학교")
  ) {
    return "🏛️"
  }

  if (
    value.includes("fandom") ||
    value.includes("fan") ||
    value.includes("팬덤") ||
    value.includes("아이돌")
  ) {
    return "👑"
  }

  if (
    value.includes("company") ||
    value.includes("corp") ||
    value.includes("기업") ||
    value.includes("회사")
  ) {
    return "🏢"
  }

  if (
    value.includes("sports") ||
    value.includes("team") ||
    value.includes("스포츠") ||
    value.includes("클럽")
  ) {
    return "⚽"
  }

  if (value.includes("ngo") || value.includes("charity") || value.includes("단체")) {
    return "🤝"
  }

  return "👥"
}

export function groupRowsToDisplay(
  rows: GroupRow[],
  previousSnapshots?: Map<string, RankSnapshot>
): RankDisplay[] {
  return buildRankDisplay(
    rows,
    (row) => ({
      id: row.id,
      name: row.group_name,
      icon: getGroupCategoryIcon(row.category),
      rowKey: row.id,
      amount: row.total_amount,
      donors: row.donor_count,
      searchText: normalizeSearchQuery(`${row.group_name} ${row.category}`),
      subtitle: row.category,
    }),
    previousSnapshots
  )
}

export function aggregateGroupStats(rows: GroupRow[]) {
  const totalAmount = rows.reduce((sum, row) => sum + row.total_amount, 0)
  const totalDonors = rows.reduce((sum, row) => sum + row.donor_count, 0)
  return {
    groupCount: rows.length,
    totalDonors,
    totalAmount,
  }
}
