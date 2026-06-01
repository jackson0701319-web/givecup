import { readFileSync } from "node:fs"
import { resolve, dirname } from "node:path"
import { fileURLToPath } from "node:url"
import { createClient } from "@supabase/supabase-js"

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..")
const envPath = resolve(root, ".env")

function loadEnv() {
  const env = {}
  try {
    const raw = readFileSync(envPath, "utf8")
    for (const line of raw.split(/\r?\n/)) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith("#")) continue
      const eq = trimmed.indexOf("=")
      if (eq === -1) continue
      env[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1).trim()
    }
  } catch {
    // ignore
  }
  return env
}

const env = loadEnv()
const url = env.NEXT_PUBLIC_SUPABASE_URL
const key = env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env")
  process.exit(1)
}

const supabase = createClient(url, key, { auth: { persistSession: false } })

const { error } = await supabase
  .from("countries")
  .update({ total_amount: 0, donor_count: 0 })
  .not("country_code", "is", null)

if (error) {
  console.error("Reset failed:", error.message)
  process.exit(1)
}

const { data, error: countError } = await supabase
  .from("countries")
  .select("total_amount, donor_count")

if (countError) {
  console.error("Verify failed:", countError.message)
  process.exit(1)
}

const sumAmount = (data ?? []).reduce((acc, row) => acc + row.total_amount, 0)
const sumDonors = (data ?? []).reduce((acc, row) => acc + row.donor_count, 0)

console.log(`Reset complete: ${data?.length ?? 0} countries`)
console.log(`sum(total_amount)=${sumAmount}, sum(donor_count)=${sumDonors}`)
