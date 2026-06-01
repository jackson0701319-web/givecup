/** API JSON 본문에서 문자열 필드 안전 추출 (number/object 방지) */
export function readOptionalString(value: unknown): string | undefined {
  if (value === null || value === undefined) return undefined

  if (typeof value === "string") {
    const trimmed = value.trim()
    return trimmed.length > 0 ? trimmed : undefined
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return String(value).trim() || undefined
  }

  return undefined
}

export function readRequiredString(
  value: unknown,
  fieldLabel: string
): string | undefined {
  const parsed = readOptionalString(value)
  if (!parsed) return undefined
  return parsed
}
