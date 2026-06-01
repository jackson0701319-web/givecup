import type { DonationRow } from "@/lib/supabase/database.types"
import { getGroupCategoryIcon } from "@/lib/groups"

export interface CountryLookup {
  name: string
  flag_emoji: string
}

export interface GroupLookup {
  group_name: string
  category: string
}

export type LedgerTargetType = "country" | "group"

export interface LedgerEntry {
  id: string
  receiptId: string
  targetType: LedgerTargetType
  targetName: string
  flagEmoji: string
  targetSubtitle?: string
  donorName: string
  amount: number
  createdAt: string
  isNew?: boolean
}

export function maskReceiptId(receiptId: string): string {
  const trimmed = receiptId.trim()
  if (trimmed.length < 12) return trimmed

  const head = trimmed.slice(0, 8)
  const tail = trimmed.slice(-4)

  if (trimmed.includes("-")) {
    return `${head}-****-****-${tail}`
  }

  return `${head}••••••••${tail}`
}

export function formatLedgerAmount(amount: number): string {
  return `$${amount.toLocaleString()}`
}

export function formatLedgerTime(iso: string): string {
  return new Date(iso).toLocaleString("ko-KR", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  })
}

export function normalizeReceiptQuery(query: string): string {
  return query.trim().toLowerCase()
}

export function donationRowToLedgerEntry(
  row: DonationRow,
  countries: Map<string, CountryLookup>,
  groups: Map<string, GroupLookup>,
  isNew = false
): LedgerEntry {
  if (row.group_id) {
    const group = groups.get(row.group_id)

    return {
      id: row.id,
      receiptId: row.receipt_id,
      targetType: "group",
      targetName: group?.group_name ?? "집단",
      flagEmoji: getGroupCategoryIcon(group?.category ?? ""),
      targetSubtitle: group?.category,
      donorName: row.donor_name,
      amount: row.amount,
      createdAt: row.created_at,
      isNew,
    }
  }

  const countryCode = row.country_code?.trim().toUpperCase() ?? ""
  const country = countryCode ? countries.get(countryCode) : undefined

  return {
    id: row.id,
    receiptId: row.receipt_id,
    targetType: "country",
    targetName: country?.name ?? row.country_code ?? "—",
    flagEmoji: country?.flag_emoji ?? "🌍",
    donorName: row.donor_name,
    amount: row.amount,
    createdAt: row.created_at,
    isNew,
  }
}
