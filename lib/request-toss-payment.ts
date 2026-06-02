import { loadTossPayments } from "@tosspayments/tosspayments-sdk"

export async function requestGiveCupTossPayment(input: {
  orderId: string
  orderName: string
  amountKrw: number
  customerName: string
  customerKey: string
}): Promise<void> {
  const clientKey = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY?.trim()
  if (!clientKey) {
    throw new Error("토스페이먼츠 클라이언트 키가 설정되지 않았습니다.")
  }

  const origin =
    typeof window !== "undefined" ? window.location.origin : ""

  const tossPayments = await loadTossPayments(clientKey)
  const payment = tossPayments.payment({ customerKey: input.customerKey })

  await payment.requestPayment({
    method: "CARD",
    amount: {
      currency: "KRW",
      value: input.amountKrw,
    },
    orderId: input.orderId,
    orderName: input.orderName,
    successUrl: `${origin}/payment/success`,
    failUrl: `${origin}/payment/fail`,
    customerName: input.customerName,
  })
}
