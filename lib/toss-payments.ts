const DEFAULT_USD_KRW_RATE = 1400

export function isTossPaymentsConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY?.trim() &&
      process.env.TOSS_SECRET_KEY?.trim()
  )
}

export function allowMockDonationsWithoutPayment(): boolean {
  return process.env.ALLOW_MOCK_DONATIONS === "true"
}

export function getTossClientKey(): string | null {
  const key = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY?.trim()
  return key || null
}

export function getUsdKrwRate(): number {
  const raw = Number(process.env.USD_KRW_RATE ?? DEFAULT_USD_KRW_RATE)
  return Number.isFinite(raw) && raw > 0 ? raw : DEFAULT_USD_KRW_RATE
}

/** Display USD → charged KRW (donation + optional platform tip). */
export function usdTotalToKrw(donationUsd: number, tipUsd: number): number {
  const totalUsd = donationUsd + tipUsd
  return Math.max(100, Math.round(totalUsd * getUsdKrwRate()))
}

export function buildOrderId(): string {
  const stamp = Date.now().toString(36)
  const rand = Math.random().toString(36).slice(2, 10)
  return `givecup_${stamp}_${rand}`.slice(0, 64)
}

export interface TossConfirmResult {
  paymentKey: string
  orderId: string
  totalAmount: number
  method?: string
  approvedAt?: string
}

export async function confirmTossPayment(input: {
  paymentKey: string
  orderId: string
  amount: number
}): Promise<TossConfirmResult> {
  const secretKey = process.env.TOSS_SECRET_KEY?.trim()
  if (!secretKey) {
    throw new Error("TOSS_SECRET_KEY가 설정되지 않았습니다.")
  }

  const encoded = Buffer.from(`${secretKey}:`).toString("base64")

  const response = await fetch(
    "https://api.tosspayments.com/v1/payments/confirm",
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${encoded}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        paymentKey: input.paymentKey,
        orderId: input.orderId,
        amount: input.amount,
      }),
    }
  )

  const data = (await response.json()) as {
    message?: string
    code?: string
    paymentKey?: string
    orderId?: string
    totalAmount?: number
    method?: string
    approvedAt?: string
  }

  if (!response.ok) {
    throw new Error(data.message ?? `토스 결제 승인 실패 (${response.status})`)
  }

  if (!data.paymentKey || !data.orderId || data.totalAmount == null) {
    throw new Error("토스 결제 승인 응답이 올바르지 않습니다.")
  }

  return {
    paymentKey: data.paymentKey,
    orderId: data.orderId,
    totalAmount: data.totalAmount,
    method: data.method,
    approvedAt: data.approvedAt,
  }
}
