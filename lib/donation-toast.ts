import type { DonationRow } from "@/lib/supabase/database.types"
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

function resolveToastTargetLabel(
  row: Pick<DonationRow, "group_id" | "country_code">,
  countries: Map<string, CountryToastLookup>,
  groups: Map<string, GroupToastLookup>
): string | null {
  if (row.group_id) {
    const group = groups.get(row.group_id)
    const groupName = group?.group_name ?? "집단"

    if (row.country_code) {
      const code = row.country_code.toUpperCase()
      const country = countries.get(code)
      return `${groupName} · ${country?.name ?? code}`
    }

    return groupName
  }

  if (row.country_code) {
    const code = row.country_code.toUpperCase()
    const country = countries.get(code)
    return country?.name ?? code
  }

  return null
}

export function buildDonationToastMessage(
  row: Pick<DonationRow, "amount" | "group_id" | "country_code" | "donor_name">,
  countries: Map<string, CountryToastLookup>,
  groups: Map<string, GroupToastLookup>
): string | null {
  const targetLabel = resolveToastTargetLabel(row, countries, groups)
  if (!targetLabel) return null

  const donor =
    row.donor_name?.trim() || "익명의 기부자"
  const amountLabel = formatDonationToastAmount(row.amount)

  return `⚡ ${donor}님이 ${targetLabel}에 ${amountLabel}만큼 강력한 유효슈팅을 날렸습니다!`
}
