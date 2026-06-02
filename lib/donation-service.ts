import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/lib/supabase/database.types"

export type AppSupabase = SupabaseClient<Database>

export interface DonationSuccessPayload {
  ok: true
  target_type: "country" | "group" | "dual"
  group_name?: string
  group_category?: string
  country_name?: string
  country_code?: string
  country_flag?: string
  target_name?: string
  target_icon?: string
  receipt_id: string
  donor_name: string
}

export type DonationServiceError = { ok: false; error: string; status: number }

export async function processDonation(
  supabase: AppSupabase,
  input: {
    groupId?: string
    countryCode?: string
    donationAmount: number
    donorName: string
  }
): Promise<DonationSuccessPayload | DonationServiceError> {
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

  let groupSnapshot: {
    id: string
    total_amount: number
    donor_count: number
  } | null = null
  let countrySnapshot: {
    id: string
    total_amount: number
    donor_count: number
  } | null = null

  if (groupId) {
    const { data, error: fetchError } = await supabase
      .from("groups")
      .select("id, group_name, category, total_amount, donor_count")
      .eq("id", groupId)
      .single()

    if (fetchError || !data) {
      return {
        ok: false,
        error: fetchError?.message ?? "집단 데이터를 찾을 수 없습니다.",
        status: 404,
      }
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
      return { ok: false, error: updateError.message, status: 500 }
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
      return {
        ok: false,
        error: fetchError?.message ?? "국가 데이터를 찾을 수 없습니다.",
        status: 404,
      }
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
      return { ok: false, error: updateError.message, status: 500 }
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

    return {
      ok: false,
      error: formatDonationInsertError(insertError?.message),
      status: 500,
    }
  }

  const isDual = Boolean(groupRow && countryRow)
  const targetType = isDual ? "dual" : groupRow ? "group" : "country"

  return {
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
  }
}

export function formatDonationInsertError(message?: string): string {
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
