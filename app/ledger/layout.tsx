import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "월드컵 실시간 공정 장부 (심판실) · GiveCup",
  description:
    "2026 월드컵 시즌 한정! 모든 유효슈팅(기부)이 영수증 ID와 함께 심판실 장부에 실시간 기록됩니다.",
}

export default function LedgerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
