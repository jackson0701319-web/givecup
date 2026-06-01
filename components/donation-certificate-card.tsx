"use client"

import { forwardRef } from "react"
import {
  buildCertificateSupportLine,
  type CertificateReceipt,
} from "@/lib/certificate-copy"

const CARD_WIDTH = 360
const CARD_HEIGHT = 640

export interface DonationCertificateCardProps extends CertificateReceipt {}

export const DonationCertificateCard = forwardRef<
  HTMLDivElement,
  DonationCertificateCardProps
>(function DonationCertificateCard(props, ref) {
  const supportLine = buildCertificateSupportLine(props)
  const amountLabel = `$${props.amount.toLocaleString()}`

  return (
    <div
      ref={ref}
      className="relative overflow-hidden text-white"
      style={{
        width: CARD_WIDTH,
        height: CARD_HEIGHT,
        fontFamily:
          'system-ui, -apple-system, "Segoe UI", Roboto, "Noto Sans KR", sans-serif',
      }}
    >
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(165deg, #0a1628 0%, #0d2847 35%, #1a0a2e 70%, #2d0a1a 100%)",
        }}
      />
      <div
        className="absolute -right-20 -top-20 h-56 w-56 rounded-full opacity-30"
        style={{
          background:
            "radial-gradient(circle, rgba(59,130,246,0.6) 0%, transparent 70%)",
        }}
      />
      <div
        className="absolute -bottom-16 -left-12 h-48 w-48 rounded-full opacity-25"
        style={{
          background:
            "radial-gradient(circle, rgba(239,68,68,0.5) 0%, transparent 70%)",
        }}
      />
      <div
        className="absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(45deg, #fff 0, #fff 1px, transparent 0, transparent 12px)",
        }}
      />

      <div className="relative flex h-full flex-col px-7 py-9">
        <div className="text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/70">
            🏆 GiveCup
          </p>
          <p className="mt-1 text-sm font-bold tracking-wide text-amber-300">
            2026 World Cup Edition
          </p>
        </div>

        <div className="my-8 flex flex-1 flex-col items-center justify-center text-center">
          <div className="mb-5 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-white/80">
            Official Supporter
          </div>
          <h2
            className="text-[22px] font-extrabold leading-tight tracking-tight"
            style={{ textShadow: "0 2px 24px rgba(0,0,0,0.4)" }}
          >
            2026 기부 월드컵
            <br />
            국가대표 인증서
          </h2>

          <div className="mt-8 w-full rounded-2xl border border-white/15 bg-white/10 px-5 py-5 backdrop-blur-sm">
            <p className="text-xs font-medium uppercase tracking-wider text-white/60">
              기부자
            </p>
            <p className="mt-1 text-xl font-bold">{props.donorName}</p>

            <div className="my-4 h-px bg-white/15" />

            <p className="text-xs font-medium uppercase tracking-wider text-white/60">
              유효슈팅 금액
            </p>
            <p className="mt-1 text-3xl font-black text-amber-300">
              {amountLabel}
            </p>

            <div className="my-4 h-px bg-white/15" />

            <p className="text-xs font-medium uppercase tracking-wider text-white/60">
              응원 대상
            </p>
            <p className="mt-2 text-base font-semibold leading-snug">
              {supportLine}
            </p>
          </div>
        </div>

        <div className="text-center">
          <p className="text-[11px] leading-relaxed text-white/75">
            지금 프로필 링크를 타고
            <br />
            당신의 집단을 1위로 만드세요!
          </p>
          <p className="mt-2 text-sm font-bold text-amber-200/90">
            givecup.vercel.app ⚽
          </p>
        </div>
      </div>
    </div>
  )
})

export const CERTIFICATE_CARD_WIDTH = CARD_WIDTH
export const CERTIFICATE_CARD_HEIGHT = CARD_HEIGHT
