import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import type { Database } from "@/lib/supabase/database.types"
import { isValidGroupCategory } from "@/lib/group-categories"
import { readOptionalString } from "@/lib/api-body"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

interface CreateGroupBody {
  groupName?: unknown
  group_name?: unknown
  category?: unknown
}

/** 브라우저에서 /api/groups 를 열면 메인으로 보냄 (API는 POST 전용) */
export async function GET(request: Request) {
  return NextResponse.redirect(new URL("/", request.url))
}

export async function POST(request: Request) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json(
        {
          error:
            "서버 Supabase 설정이 누락되었습니다. SUPABASE_SERVICE_ROLE_KEY를 .env에 추가해주세요.",
        },
        { status: 500 }
      )
    }

    let body: CreateGroupBody
    try {
      body = (await request.json()) as CreateGroupBody
    } catch {
      return NextResponse.json(
        { error: "요청 본문이 올바르지 않습니다." },
        { status: 400 }
      )
    }

    const groupName = readOptionalString(body.groupName ?? body.group_name)
    const category = readOptionalString(body.category)?.toLowerCase()

    if (!groupName || groupName.length < 2 || groupName.length > 40) {
      return NextResponse.json(
        { error: "집단 이름은 2~40자로 입력해주세요." },
        { status: 400 }
      )
    }

    if (!category || !isValidGroupCategory(category)) {
      return NextResponse.json(
        { error: "집단 카테고리를 선택해주세요." },
        { status: 400 }
      )
    }

    const supabase = createClient<Database>(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    })

    const { data: existing, error: lookupError } = await supabase
      .from("groups")
      .select("id")
      .ilike("group_name", groupName)
      .maybeSingle()

    if (lookupError) {
      return NextResponse.json({ error: lookupError.message }, { status: 500 })
    }

    if (existing) {
      return NextResponse.json(
        { error: "이미 같은 이름의 집단이 있습니다." },
        { status: 409 }
      )
    }

    const { data: groupRow, error: insertError } = await supabase
      .from("groups")
      .insert({
        group_name: groupName,
        category,
        total_amount: 0,
        donor_count: 0,
      })
      .select("id, group_name, category, total_amount, donor_count")
      .single()

    if (insertError || !groupRow) {
      const message = insertError?.message ?? "집단 등록에 실패했습니다."
      const tableMissing =
        message.includes("public.groups") || message.includes("schema cache")

      return NextResponse.json(
        {
          error: tableMissing
            ? "groups 테이블을 찾을 수 없습니다. Supabase에서 groups 테이블을 확인해주세요."
            : message,
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      ok: true,
      group: groupRow,
    })
  } catch (error) {
    console.error("[POST /api/groups]", error)
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "집단 등록 중 알 수 없는 서버 오류가 발생했습니다.",
      },
      { status: 500 }
    )
  }
}
