import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "실시간 오픈 장부 · GiveCup",
  description:
    "전 세계 기부 내역이 실시간으로 기록되는 GiveCup 투명성 오픈 장부입니다.",
}

export default function LedgerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
