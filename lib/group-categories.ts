export const GROUP_CATEGORIES = [
  { value: "university", label: "대학·학교", icon: "🏛️" },
  { value: "fandom", label: "팬덤·아이돌", icon: "👑" },
  { value: "company", label: "기업·회사", icon: "🏢" },
  { value: "sports", label: "스포츠·클럽", icon: "⚽" },
  { value: "ngo", label: "단체·NGO", icon: "🤝" },
  { value: "community", label: "커뮤니티", icon: "👥" },
  { value: "other", label: "기타", icon: "✨" },
] as const

export type GroupCategoryValue = (typeof GROUP_CATEGORIES)[number]["value"]

const CATEGORY_VALUES = new Set<string>(
  GROUP_CATEGORIES.map((item) => item.value)
)

export function isValidGroupCategory(
  category: string
): category is GroupCategoryValue {
  return CATEGORY_VALUES.has(category)
}

export function getGroupCategoryLabel(category: string): string {
  const match = GROUP_CATEGORIES.find((item) => item.value === category)
  return match?.label ?? category
}
