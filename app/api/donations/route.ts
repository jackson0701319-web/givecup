import { NextResponse } from "next/server"
import {
  formatDonationInsertError,
  processDonation,
} from "@/lib/donation-service"
import { createServiceSupabase } from "@/lib/supabase/admin"
import { readOptionalString } from "@/lib/api-body"
import {
  allowMockDonationsWithoutPayment,
  isTossPaymentsConfigured,
} from "@/lib/toss-payments"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const DEFAULT_DONOR_NAME = "익명의 기부자"

interface DonateBody {
  countryCode?: unknown
  country_code?: unknown
  groupId?: unknown
  group_id?: unknown
  amount?: unknown
  donorName?: unknown
  donor_name?: unknown
}

export async function POST(request: Request) {
  try {
    if (isTossPaymentsConfigured() && !allowMockDonationsWithoutPayment()) {
      return jsonError(
        "실제 결제가 필요합니다. 토스페이먼츠 결제를 완료해 주세요.",
        400
      )
    }

    const supabase = createServiceSupabase()
    if (!supabase) {
      return jsonError(
        "서버 Supabase 설정이 누락되었습니다. SUPABASE_SERVICE_ROLE_KEY를 .env에 추가해주세요.",
        500
      )
    }

    let body: DonateBody
    try {
      body = (await request.json()) as DonateBody
    } catch {
      return jsonError("요청 본문이 올바르지 않습니다.", 400)
    }

    const groupId = readOptionalString(body.groupId ?? body.group_id)
    const countryCode = readOptionalString(
      body.countryCode ?? body.country_code
    )?.toUpperCase()
    const amount = Number(body.amount)
    const donorName =
      readOptionalString(body.donorName ?? body.donor_name) ?? DEFAULT_DONOR_NAME

    if ((!groupId && !countryCode) || !Number.isFinite(amount) || amount <= 0) {
      return jsonError("요청 값이 올바르지 않습니다.", 400)
    }

    const result = await processDonation(supabase, {
      groupId,
      countryCode,
      donationAmount: Math.round(amount),
      donorName,
    })

    if (!result.ok) {
      return jsonError(result.error, result.status)
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error("[POST /api/donations] unhandled", error)
    return jsonError(
      error instanceof Error
        ? error.message
        : "기부 처리 중 알 수 없는 서버 오류가 발생했습니다.",
      500
    )
  }
}

function jsonError(error: string, status: number) {
  return NextResponse.json({ error }, { status })
}

// Re-export for scripts that import formatDonationInsertError from route
export { formatDonationInsertError }
