export function isTossPaymentsEnabledOnClient(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY?.trim())
}

export function getPublicUsdKrwRate(): number {
  const raw = Number(process.env.NEXT_PUBLIC_USD_KRW_RATE ?? 1400)
  return Number.isFinite(raw) && raw > 0 ? raw : 1400
}

export function estimateKrwFromUsd(donationUsd: number, tipUsd: number): number {
  const totalUsd = donationUsd + tipUsd
  return Math.max(100, Math.round(totalUsd * getPublicUsdKrwRate()))
}
