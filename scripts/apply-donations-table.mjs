/**
 * donations 테이블을 Supabase에 생성합니다.
 *
 * 1) Supabase 대시보드 → Project Settings → Database
 * 2) Connection string → URI 복사 (비밀번호 포함)
 * 3) .env 에 한 줄 추가: DATABASE_URL=postgresql://...
 * 4) npm install pg  (최초 1회)
 * 5) node scripts/apply-donations-table.mjs
 */

import { readFileSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { dirname, join } from "node:path"
import pg from "pg"

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, "..")

function loadEnvFile() {
  const path = join(root, ".env")
  let text
  try {
    text = readFileSync(path, "utf8")
  } catch {
    return {}
  }
  const env = {}
  for (const line of text.split(/\r?\n/)) {
    if (!line || line.startsWith("#")) continue
    const i = line.indexOf("=")
    if (i === -1) continue
    env[line.slice(0, i).trim()] = line.slice(i + 1).trim()
  }
  return env
}

const fileEnv = loadEnvFile()
const databaseUrl = process.env.DATABASE_URL ?? fileEnv.DATABASE_URL

if (!databaseUrl) {
  console.error(`
DATABASE_URL 이 없습니다.

Supabase → Project Settings → Database → Connection string → URI 를 복사한 뒤
.env 파일에 추가하세요:

DATABASE_URL=postgresql://postgres.[ref]:[YOUR-PASSWORD]@...

또는 SQL Editor에서 supabase/donations.sql 을 직접 실행해도 됩니다.
`)
  process.exit(1)
}

const sqlPath = join(root, "supabase", "donations.sql")
let sql = readFileSync(sqlPath, "utf8")
sql = sql
  .split("\n")
  .filter((line) => !line.trim().startsWith("--"))
  .join("\n")

const client = new pg.Client({
  connectionString: databaseUrl,
  ssl: { rejectUnauthorized: false },
})

try {
  await client.connect()
  console.log("Connected. Creating public.donations …")
  await client.query(sql)
  const check = await client.query(
    "select count(*)::int as n from information_schema.tables where table_schema = 'public' and table_name = 'donations'"
  )
  console.log("Done. donations table exists:", check.rows[0]?.n === 1)
} catch (err) {
  console.error("Failed:", err.message)
  process.exit(1)
} finally {
  await client.end()
}
