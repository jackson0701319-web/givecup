import { NextResponse } from "next/server"
import { readOptionalString } from "@/lib/api-body"
import { createServiceSupabase } from "@/lib/supabase/admin"
import {
  buildOrderId,
  isTossPaymentsConfigured,
  usdTotalToKrw,
} from "@/lib/toss-payments"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const DEFAULT_DONOR_NAME = "익명의 기부자"

interface CreateOrderBody {
  countryCode?: unknown
  country_code?: unknown
  groupId?: unknown
  group_id?: unknown
  amount?: unknown
  donorName?: unknown
  donor_name?: unknown
  tipAmount?: unknown
  tip_amount?: unknown
  targetLabel?: unknown
  target_label?: unknown
}

export async function POST(request: Request) {
  if (!isTossPaymentsConfigured()) {
    return jsonError(
      "토스페이먼츠 키가 설정되지 않았습니다. NEXT_PUBLIC_TOSS_CLIENT_KEY, TOSS_SECRET_KEY를 추가해 주세요.",
      503
    )
  }

  const supabase = createServiceSupabase()
  if (!supabase) {
    return jsonError("서버 Supabase 설정이 누락되었습니다.", 500)
  }

  let body: CreateOrderBody
  try {
    body = (await request.json()) as CreateOrderBody
  } catch {
    return jsonError("요청 본문이 올바르지 않습니다.", 400)
  }

  const donationAmount = Number(body.amount)
  const tipAmount = Math.max(
    0,
    Number(body.tipAmount ?? body.tip_amount ?? 0) || 0
  )
  const donorName =
    readOptionalString(body.donorName ?? body.donor_name) ?? DEFAULT_DONOR_NAME
  const targetLabel =
    readOptionalString(body.targetLabel ?? body.target_label) ?? "GiveCup 기부"

  const countryCode = readOptionalString(
    body.countryCode ?? body.country_code
  )?.toUpperCase()
  const groupId = readOptionalString(body.groupId ?? body.group_id)

  if ((!groupId && !countryCode) || !Number.isFinite(donationAmount) || donationAmount <= 0) {
    return jsonError("요청 값이 올바르지 않습니다.", 400)
  }

  const orderId = buildOrderId()
  const amountKrw = usdTotalToKrw(Math.round(donationAmount), tipAmount)
  const orderName =
    tipAmount > 0
      ? `GiveCup 기부 + 플랫폼 후원 (${targetLabel})`
      : `GiveCup 기부 (${targetLabel})`

  const { error: insertError } = await supabase.from("payment_orders").insert({
    order_id: orderId,
    status: "pending",
    amount_krw: amountKrw,
    donation_amount_usd: Math.round(donationAmount),
    tip_amount_usd: tipAmount,
    donor_name: donorName,
    country_code: countryCode ?? null,
    group_id: groupId ?? null,
    order_name: orderName,
    target_label: targetLabel,
  })

  if (insertError) {
    const message = insertError.message.includes("payment_orders")
      ? "payment_orders 테이블이 없습니다. Supabase에서 supabase/payment_orders.sql 을 실행해 주세요."
      : insertError.message
    return jsonError(message, 500)
  }

  return NextResponse.json({
    ok: true,
    orderId,
    amountKrw,
    orderName,
    customerKey: orderId,
  })
}

function jsonError(error: string, status: number) {
  return NextResponse.json({ error }, { status })
}
