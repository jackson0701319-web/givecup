export async function readApiJson<T>(response: Response): Promise<T> {
  const text = await response.text()

  if (!text.trim()) {
    throw new Error(
      `서버 응답이 비어 있습니다 (HTTP ${response.status}). ` +
        `터미널에서 npm run dev 로 서버를 켠 뒤, 브라우저에서는 http://localhost:3000 메인 화면에서 다시 시도해주세요.`
    )
  }

  try {
    return JSON.parse(text) as T
  } catch {
    const preview = text.replace(/\s+/g, " ").slice(0, 80)
    throw new Error(
      `서버 응답을 JSON으로 읽을 수 없습니다 (HTTP ${response.status}): ${preview}`
    )
  }
}
