import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import type { Database } from "@/lib/supabase/database.types"

export async function POST() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not available in production" }, { status: 403 })
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json(
      { error: "Supabase service role key is missing in .env" },
      { status: 500 }
    )
  }

  const supabase = createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  })

  const { error: updateError } = await supabase
    .from("countries")
    .update({ total_amount: 0, donor_count: 0 })
    .not("country_code", "is", null)

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  const { data, error: verifyError } = await supabase
    .from("countries")
    .select("total_amount, donor_count")

  if (verifyError) {
    return NextResponse.json({ error: verifyError.message }, { status: 500 })
  }

  const rows = data ?? []
  const sumAmount = rows.reduce((acc, row) => acc + row.total_amount, 0)
  const sumDonors = rows.reduce((acc, row) => acc + row.donor_count, 0)

  return NextResponse.json({
    ok: true,
    countries: rows.length,
    sumAmount,
    sumDonors,
  })
}
