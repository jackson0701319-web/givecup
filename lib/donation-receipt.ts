export interface DonationReceiptData {
  receiptId: string
  donorName: string
  targetType: "country" | "group" | "dual"
  targetLabel: string
  targetIcon: string
  targetSubtitle?: string
  countryName?: string
  countryCode?: string
  countryFlag?: string
  amount: number
  issuedAt: string
}

export function donationResultToReceipt(
  result: {
    receipt_id: string
    donor_name: string
    target_type?: "country" | "group" | "dual"
    group_name?: string
    group_category?: string
    country_name?: string
    country_code?: string
    country_flag?: string
    target_name?: string
    target_icon?: string
    donation_amount_usd?: number
  },
  fallback: {
    amount: number
    targetType: "country" | "group" | "dual"
    targetLabel: string
    targetIcon: string
    targetSubtitle?: string
    countryName?: string
    countryCode?: string
    countryFlag?: string
  }
): DonationReceiptData {
  const targetType = result.target_type ?? fallback.targetType

  return {
    receiptId: result.receipt_id,
    donorName: result.donor_name,
    targetType,
    targetLabel: result.group_name ?? result.target_name ?? fallback.targetLabel,
    targetIcon: result.country_flag ?? result.target_icon ?? fallback.targetIcon,
    targetSubtitle: result.group_category ?? fallback.targetSubtitle,
    countryName: result.country_name ?? fallback.countryName,
    countryCode: result.country_code ?? fallback.countryCode,
    countryFlag: result.country_flag ?? fallback.countryFlag,
    amount: result.donation_amount_usd ?? fallback.amount,
    issuedAt: new Date().toISOString(),
  }
}
