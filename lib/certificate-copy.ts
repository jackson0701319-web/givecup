export interface CertificateReceipt {
  donorName: string
  amount: number
  targetType: "country" | "group" | "dual"
  targetLabel: string
  targetIcon: string
  targetSubtitle?: string
  countryName?: string
  countryCode?: string
}

export function buildCertificateSupportLine(
  receipt: CertificateReceipt
): string {
  if (receipt.targetType === "dual" && receipt.countryName) {
    const code = receipt.countryCode ? ` (${receipt.countryCode})` : ""
    return `${receipt.targetLabel}${code} 화력 지원 완료`
  }

  if (receipt.targetType === "group") {
    const extra = receipt.targetSubtitle
      ? ` (${receipt.targetSubtitle})`
      : ""
    return `${receipt.targetLabel}${extra} 화력 지원 완료`
  }

  return `${receipt.targetIcon} ${receipt.targetLabel} 화력 지원 완료`
}
