/**
 * 로컬 API 테스트: node scripts/test-donations-api.mjs
 * (npm run dev 가 켜져 있어야 함)
 */

const base = process.env.API_BASE ?? "http://localhost:3000"

const payload = {
  countryCode: "KR",
  amount: 10,
  donorName: "API 테스트",
}

const res = await fetch(`${base}/api/donations`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(payload),
})

const text = await res.text()
console.log("status:", res.status)
console.log("body:", text || "(empty)")

if (text) {
  try {
    console.log("json:", JSON.parse(text))
  } catch {
    console.log("(not json)")
  }
}
