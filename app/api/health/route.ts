import { NextResponse } from "next/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/** 배포 환경 변수 연결 여부만 확인 (값은 노출하지 않음) */
export async function GET() {
  return NextResponse.json({
    ok: true,
    supabase: {
      hasUrl: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()),
      hasAnonKey: Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()),
      hasServiceRole: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()),
    },
    tossPayments: {
      hasClientKey: Boolean(process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY?.trim()),
      hasSecretKey: Boolean(process.env.TOSS_SECRET_KEY?.trim()),
    },
  })
}
