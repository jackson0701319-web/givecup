"use client"

import Link from "next/link"
import { Receipt, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DonationCertificateShare } from "@/components/donation-certificate-share"
import type { DonationReceiptData } from "@/lib/donation-receipt"

interface DonationSuccessPanelProps {
  receipt: DonationReceiptData
  onClose?: () => void
  closeHref?: string
  closeLabel?: string
}

export function DonationSuccessPanel({
  receipt,
  onClose,
  closeHref = "/",
  closeLabel = "메인으로",
}: DonationSuccessPanelProps) {
  const formattedIssuedAt = new Date(receipt.issuedAt).toLocaleString("ko-KR", {
    dateStyle: "medium",
    timeStyle: "short",
  })

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/20">
          <Sparkles className="h-7 w-7 text-emerald-600 dark:text-emerald-400" />
        </div>
        <h2 className="text-xl font-bold text-foreground">
          유효슈팅 성공! VAR 통과 · 영수증 발급
        </h2>
      </div>

      <div className="relative overflow-hidden rounded-2xl border-2 border-dashed border-primary/30 bg-gradient-to-b from-card to-muted/40 p-4 shadow-inner sm:p-6">
        <div className="relative flex items-center justify-between border-b border-border/40 pb-4">
          <div className="flex items-center gap-2">
            <Receipt className="h-5 w-5 text-primary" />
            <span className="text-sm font-semibold tracking-wide text-primary uppercase">
              GiveCup · Match Receipt
            </span>
          </div>
          <span className="rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-xs font-medium text-emerald-700 dark:text-emerald-400">
            발급 완료
          </span>
        </div>

        <div className="relative mt-5 space-y-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              영수증 ID
            </p>
            <p className="mt-1 break-all font-mono text-sm font-semibold text-foreground">
              {receipt.receiptId}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                기부자
              </p>
              <p className="mt-1 font-semibold text-foreground">{receipt.donorName}</p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                {receipt.targetType === "country" ? "기부 국가" : "기부 집단"}
              </p>
              <p className="mt-1 font-semibold text-foreground">
                {receipt.targetIcon} {receipt.targetLabel}
              </p>
            </div>
          </div>

          <div className="flex items-end justify-between rounded-xl border border-border/40 bg-background/60 px-4 py-3">
            <div>
              <p className="text-xs text-muted-foreground">기부 금액</p>
              <p className="text-2xl font-bold text-primary">
                ${receipt.amount.toLocaleString()}
              </p>
            </div>
            <p className="max-w-[140px] text-right text-xs text-muted-foreground">
              {formattedIssuedAt}
            </p>
          </div>
        </div>
      </div>

      <DonationCertificateShare
        donorName={receipt.donorName}
        amount={receipt.amount}
        targetType={receipt.targetType}
        targetLabel={receipt.targetLabel}
        targetIcon={receipt.targetIcon}
        targetSubtitle={receipt.targetSubtitle}
        countryName={receipt.countryName}
        countryCode={receipt.countryCode}
      />

      {onClose ? (
        <Button size="lg" onClick={onClose} className="w-full py-7 text-lg font-bold">
          {closeLabel}
        </Button>
      ) : (
        <Button size="lg" asChild className="w-full py-7 text-lg font-bold">
          <Link href={closeHref}>{closeLabel}</Link>
        </Button>
      )}
    </div>
  )
}
