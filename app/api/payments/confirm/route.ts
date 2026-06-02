import { NextResponse } from "next/server"
import { processDonation } from "@/lib/donation-service"
import { createServiceSupabase } from "@/lib/supabase/admin"
import { readOptionalString } from "@/lib/api-body"
import { confirmTossPayment, isTossPaymentsConfigured } from "@/lib/toss-payments"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

interface ConfirmBody {
  paymentKey?: unknown
  payment_key?: unknown
  orderId?: unknown
  order_id?: unknown
  amount?: unknown
}

export async function POST(request: Request) {
  if (!isTossPaymentsConfigured()) {
    return jsonError("토스페이먼츠가 설정되지 않았습니다.", 503)
  }

  const supabase = createServiceSupabase()
  if (!supabase) {
    return jsonError("서버 Supabase 설정이 누락되었습니다.", 500)
  }

  let body: ConfirmBody
  try {
    body = (await request.json()) as ConfirmBody
  } catch {
    return jsonError("요청 본문이 올바르지 않습니다.", 400)
  }

  const paymentKey = readOptionalString(body.paymentKey ?? body.payment_key)
  const orderId = readOptionalString(body.orderId ?? body.order_id)
  const amount = Number(body.amount)

  if (!paymentKey || !orderId || !Number.isFinite(amount) || amount <= 0) {
    return jsonError("결제 승인 정보가 올바르지 않습니다.", 400)
  }

  const { data: order, error: orderError } = await supabase
    .from("payment_orders")
    .select("*")
    .eq("order_id", orderId)
    .single()

  if (orderError || !order) {
    return jsonError("주문 정보를 찾을 수 없습니다.", 404)
  }

  if (order.status === "paid" && order.receipt_id) {
    return NextResponse.json({
      ok: true,
      alreadyPaid: true,
      receipt_id: order.receipt_id,
      donor_name: order.donor_name,
      donation_amount_usd: order.donation_amount_usd,
      target_label: order.target_label,
      country_code: order.country_code,
      group_id: order.group_id,
    })
  }

  if (order.amount_krw !== amount) {
    return jsonError("결제 금액이 주문 정보와 일치하지 않습니다.", 400)
  }

  try {
    await confirmTossPayment({ paymentKey, orderId, amount })
  } catch (error) {
    await supabase
      .from("payment_orders")
      .update({ status: "failed" })
      .eq("order_id", orderId)

    return jsonError(
      error instanceof Error ? error.message : "토스 결제 승인에 실패했습니다.",
      502
    )
  }

  const donationResult = await processDonation(supabase, {
    groupId: order.group_id ?? undefined,
    countryCode: order.country_code ?? undefined,
    donationAmount: Math.round(Number(order.donation_amount_usd)),
    donorName: order.donor_name,
  })

  if (!donationResult.ok) {
    await supabase
      .from("payment_orders")
      .update({ status: "failed", payment_key: paymentKey })
      .eq("order_id", orderId)

    return jsonError(
      `${donationResult.error} 결제는 승인되었으니 고객센터로 문의해 주세요. (주문: ${orderId})`,
      500
    )
  }

  await supabase
    .from("payment_orders")
    .update({
      status: "paid",
      payment_key: paymentKey,
      receipt_id: donationResult.receipt_id,
      paid_at: new Date().toISOString(),
    })
    .eq("order_id", orderId)

  return NextResponse.json({
    ...donationResult,
    donation_amount_usd: order.donation_amount_usd,
    tip_amount_usd: order.tip_amount_usd,
    amount_krw: order.amount_krw,
    target_label: order.target_label,
  })
}

function jsonError(error: string, status: number) {
  return NextResponse.json({ error }, { status })
}
