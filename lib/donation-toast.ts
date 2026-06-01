import type { DonationRow } from "@/lib/supabase/database.types"
import { getGroupCategoryIcon } from "@/lib/groups"

export interface CountryToastLookup {
  name: string
  flag_emoji: string
}

export interface GroupToastLookup {
  group_name: string
  category: string
}

export function formatDonationToastAmount(amount: number): string {
  if (Number.isInteger(amount)) {
    return `$${amount.toLocaleString()}`
  }
  return `$${amount.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

export function buildDonationToastMessage(
  row: Pick<DonationRow, "amount" | "group_id" | "country_code">,
  countries: Map<string, CountryToastLookup>,
  groups: Map<string, GroupToastLookup>
): string | null {
  const amountLabel = formatDonationToastAmount(row.amount)

  if (row.group_id) {
    const group = groups.get(row.group_id)
    const groupName = group?.group_name ?? "집단"

    if (row.country_code) {
      const code = row.country_code.toUpperCase()
      const country = countries.get(code)
      const flag = country?.flag_emoji ?? "🌍"
      return `방금 ${groupName} ${flag}에서 ${amountLabel} 기부!`
    }

    const icon = getGroupCategoryIcon(group?.category ?? "")
    return `방금 ${groupName} ${icon}에서 ${amountLabel} 기부!`
  }

  if (row.country_code) {
    const code = row.country_code.toUpperCase()
    const country = countries.get(code)
    return `방금 ${country?.name ?? code} ${country?.flag_emoji ?? "🌍"}에서 ${amountLabel} 기부!`
  }

  return null
}
