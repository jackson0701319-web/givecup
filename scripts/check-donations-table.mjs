import { readFileSync } from "node:fs"
import { createClient } from "@supabase/supabase-js"

function loadEnv() {
  const text = readFileSync(new URL("../.env", import.meta.url), "utf8")
  const env = {}
  for (const line of text.split(/\r?\n/)) {
    if (!line || line.startsWith("#")) continue
    const i = line.indexOf("=")
    if (i === -1) continue
    env[line.slice(0, i)] = line.slice(i + 1)
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

const donations = await supabase.from("donations").select("id").limit(1)
const countries = await supabase.from("countries").select("country_code").limit(1)

console.log("URL:", url)
console.log("countries:", countries.error ? `ERROR ${countries.error.message}` : "OK")
console.log(
  "donations:",
  donations.error ? `ERROR ${donations.error.message}` : "OK"
)

process.exit(donations.error ? 1 : 0)
