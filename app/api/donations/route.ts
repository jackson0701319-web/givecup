import { NextResponse } from "next/server"
import { createClient, type SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/lib/supabase/database.types"
import { readOptionalString } from "@/lib/api-body"

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

type AppSupabase = SupabaseClient<Database>

interface GroupSnapshot {
  id: string
  total_amount: number
  donor_count: number
}

interface CountrySnapshot {
  id: string
  total_amount: number
  donor_count: number
}

export async function POST(request: Request) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !serviceRoleKey) {
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

    let supabase: AppSupabase
    try {
      supabase = createClient<Database>(supabaseUrl, serviceRoleKey, {
        auth: { persistSession: false },
      })
    } catch (error) {
      console.error("[POST /api/donations] createClient failed", error)
      return jsonError(
        "Supabase 클라이언트를 초기화하지 못했습니다. .env 키를 확인해주세요.",
        500
      )
    }

    return await processDonation(supabase, {
      groupId,
      countryCode,
      donationAmount: Math.round(amount),
      donorName,
    })
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

async function processDonation(
  supabase: AppSupabase,
  input: {
    groupId?: string
    countryCode?: string
    donationAmount: number
    donorName: string
  }
) {
  const { groupId, countryCode, donationAmount, donorName } = input

  let groupRow: {
    id: string
    group_name: string
    category: string
    total_amount: number
    donor_count: number
  } | null = null
  let countryRow: {
    id: string
    name: string
    flag_emoji: string
    total_amount: number
    donor_count: number
  } | null = null

  let groupSnapshot: GroupSnapshot | null = null
  let countrySnapshot: CountrySnapshot | null = null

  if (groupId) {
    const { data, error: fetchError } = await supabase
      .from("groups")
      .select("id, group_name, category, total_amount, donor_count")
      .eq("id", groupId)
      .single()

    if (fetchError || !data) {
      return jsonError(
        fetchError?.message ?? "집단 데이터를 찾을 수 없습니다.",
        404
      )
    }

    groupRow = data
    groupSnapshot = {
      id: data.id,
      total_amount: data.total_amount,
      donor_count: data.donor_count,
    }

    const { error: updateError } = await supabase
      .from("groups")
      .update({
        total_amount: data.total_amount + donationAmount,
        donor_count: data.donor_count + 1,
      })
      .eq("id", data.id)

    if (updateError) {
      return jsonError(updateError.message, 500)
    }
  }

  if (countryCode) {
    const { data, error: fetchError } = await supabase
      .from("countries")
      .select("id, name, flag_emoji, total_amount, donor_count")
      .eq("country_code", countryCode)
      .single()

    if (fetchError || !data) {
      if (groupSnapshot) {
        await supabase
          .from("groups")
          .update({
            total_amount: groupSnapshot.total_amount,
            donor_count: groupSnapshot.donor_count,
          })
          .eq("id", groupSnapshot.id)
      }
      return jsonError(
        fetchError?.message ?? "국가 데이터를 찾을 수 없습니다.",
        404
      )
    }

    countryRow = data
    countrySnapshot = {
      id: data.id,
      total_amount: data.total_amount,
      donor_count: data.donor_count,
    }

    const { error: updateError } = await supabase
      .from("countries")
      .update({
        total_amount: data.total_amount + donationAmount,
        donor_count: data.donor_count + 1,
      })
      .eq("id", data.id)

    if (updateError) {
      if (groupSnapshot) {
        await supabase
          .from("groups")
          .update({
            total_amount: groupSnapshot.total_amount,
            donor_count: groupSnapshot.donor_count,
          })
          .eq("id", groupSnapshot.id)
      }
      return jsonError(updateError.message, 500)
    }
  }

  const insertPayload: Database["public"]["Tables"]["donations"]["Insert"] = {
    amount: donationAmount,
    donor_name: donorName,
  }

  if (groupRow) {
    insertPayload.group_id = groupRow.id
  }
  if (countryCode) {
    insertPayload.country_code = countryCode
  }

  const { data: donationRow, error: insertError } = await supabase
    .from("donations")
    .insert(insertPayload)
    .select("receipt_id, donor_name")
    .single()

  if (insertError || !donationRow) {
    if (countrySnapshot) {
      await supabase
        .from("countries")
        .update({
          total_amount: countrySnapshot.total_amount,
          donor_count: countrySnapshot.donor_count,
        })
        .eq("id", countrySnapshot.id)
    }
    if (groupSnapshot) {
      await supabase
        .from("groups")
        .update({
          total_amount: groupSnapshot.total_amount,
          donor_count: groupSnapshot.donor_count,
        })
        .eq("id", groupSnapshot.id)
    }

    return jsonError(formatDonationInsertError(insertError?.message), 500)
  }

  const isDual = Boolean(groupRow && countryRow)
  const targetType = isDual ? "dual" : groupRow ? "group" : "country"

  return NextResponse.json({
    ok: true,
    target_type: targetType,
    group_name: groupRow?.group_name,
    group_category: groupRow?.category,
    country_name: countryRow?.name,
    country_code: countryRow ? countryCode : undefined,
    country_flag: countryRow?.flag_emoji,
    target_name: groupRow?.group_name ?? countryRow?.name,
    target_icon: countryRow?.flag_emoji ?? undefined,
    receipt_id: donationRow.receipt_id,
    donor_name: donationRow.donor_name,
  })
}

function jsonError(error: string, status: number) {
  return NextResponse.json({ error }, { status })
}

function formatDonationInsertError(message?: string): string {
  const insertMessage = message ?? "기부 기록 저장에 실패했습니다."
  const lower = insertMessage.toLowerCase()

  if (
    insertMessage.includes("public.donations") ||
    insertMessage.includes("schema cache")
  ) {
    return "donations 테이블이 없습니다. Supabase SQL Editor에서 supabase/donations.sql 을 실행해주세요."
  }

  if (lower.includes("group_id")) {
    return "donations 테이블에 group_id 컬럼이 필요합니다. supabase/donations-groups-migration.sql 을 실행해주세요."
  }

  if (lower.includes("country_code") && lower.includes("null")) {
    return "donations.country_code 가 NOT NULL 입니다. supabase/donations-groups-migration.sql 을 실행해주세요."
  }

  if (lower.includes("invalid api key") || lower.includes("jwt")) {
    return "Supabase API 키가 올바르지 않습니다. .env 의 SUPABASE_SERVICE_ROLE_KEY 를 확인해주세요."
  }

  return insertMessage
}
