export type DonationTargetType = "country" | "group"

export interface DonationTarget {
  type: DonationTargetType
  id: string
  name: string
  icon: string
  countryCode?: string
  groupId?: string
  category?: string
  /** @deprecated Use `icon` — kept for older callers */
  flag?: string
}

function nonEmptyId(value: unknown): string | null {
  if (value == null) return null
  const text = String(value).trim()
  return text.length > 0 ? text : null
}

/** Older ranking handlers passed countryCode without `type`. */
export function normalizeDonationTarget(
  input: DonationTarget | null | undefined
): DonationTarget | null {
  if (!input) return null

  if (input.type === "country" || input.type === "group") {
    return input
  }

  const countryCode = nonEmptyId(input.countryCode)?.toUpperCase() ?? null
  if (countryCode) {
    return {
      type: "country",
      id: String(input.id),
      name: input.name,
      icon: input.icon ?? input.flag ?? "🏳️",
      countryCode,
    }
  }

  const groupId = nonEmptyId(input.groupId)
  if (groupId) {
    return {
      type: "group",
      id: String(input.id),
      name: input.name,
      icon: input.icon ?? "👥",
      groupId,
      category: input.category,
    }
  }

  return null
}

export function isCountryTarget(
  target: DonationTarget
): target is DonationTarget & { type: "country"; countryCode: string } {
  return (
    target.type === "country" && nonEmptyId(target.countryCode) !== null
  )
}

export function isGroupTarget(
  target: DonationTarget
): target is DonationTarget & { type: "group"; groupId: string } {
  const groupId = nonEmptyId(target.groupId) ?? nonEmptyId(target.id)
  return target.type === "group" && groupId !== null
}

export interface DonationApiBody {
  amount: number
  donorName: string
  countryCode?: string
  groupId?: string
}

export function buildDonationApiBody(
  rawTarget: DonationTarget | null | undefined,
  amount: number,
  donorName: string,
  options?: { bonusCountryCode?: string | null }
): DonationApiBody | null {
  const target = normalizeDonationTarget(rawTarget)
  if (!target || !Number.isFinite(amount) || amount <= 0) return null

  if (target.type === "group") {
    const groupId = nonEmptyId(target.groupId) ?? nonEmptyId(target.id)
    if (!groupId) return null

    const bonus = nonEmptyId(options?.bonusCountryCode)?.toUpperCase()
    return {
      groupId,
      amount,
      donorName,
      ...(bonus ? { countryCode: bonus } : {}),
    }
  }

  if (target.type === "country") {
    const countryCode = nonEmptyId(target.countryCode)?.toUpperCase()
    if (!countryCode) return null

    return {
      countryCode,
      amount,
      donorName,
    }
  }

  return null
}
