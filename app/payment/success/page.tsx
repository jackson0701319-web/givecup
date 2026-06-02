"use client"

import { Suspense, useEffect, useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Loader2 } from "lucide-react"
import { DonationSuccessPanel } from "@/components/donation-success-panel"
import { donationResultToReceipt } from "@/lib/donation-receipt"
import type { DonationReceiptData } from "@/lib/donation-receipt"
import { readApiJson } from "@/lib/api-response"

function PaymentSuccessContent() {
  const searchParams = useSearchParams()
  const [receipt, setReceipt] = useState<DonationReceiptData | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const paymentKey = searchParams.get("paymentKey")
    const orderId = searchParams.get("orderId")
    const amount = Number(searchParams.get("amount"))

    if (!paymentKey || !orderId || !Number.isFinite(amount)) {
      setError("결제 정보가 올바르지 않습니다. 다시 시도해 주세요.")
      return
    }

    let active = true

    const confirm = async () => {
      try {
        const response = await fetch("/api/payments/confirm", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ paymentKey, orderId, amount }),
        })

        const result = await readApiJson<{
          error?: string
          receipt_id?: string
          donor_name?: string
          target_type?: "country" | "group" | "dual"
          group_name?: string
          group_category?: string
          country_name?: string
          country_code?: string
          country_flag?: string
          target_name?: string
          target_icon?: string
          donation_amount_usd?: number
          target_label?: string
        }>(response)

        if (!response.ok || !result.receipt_id) {
          throw new Error(result.error ?? "결제 승인에 실패했습니다.")
        }

        if (!active) return

        const targetType = result.target_type ?? "country"

        setReceipt(
          donationResultToReceipt(result, {
            amount: Math.round(Number(result.donation_amount_usd ?? 0)),
            targetType,
            targetLabel: result.target_label ?? result.target_name ?? "GiveCup",
            targetIcon: result.country_flag ?? result.target_icon ?? "🏳️",
            targetSubtitle: result.group_category,
            countryName: result.country_name,
            countryCode: result.country_code,
            countryFlag: result.country_flag,
          })
        )
      } catch (err) {
        if (active) {
          setError(
            err instanceof Error ? err.message : "결제 승인 중 오류가 발생했습니다."
          )
        }
      }
    }

    confirm()

    return () => {
      active = false
    }
  }, [searchParams])

  if (error) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <p className="text-destructive font-medium">{error}</p>
        <Link
          href="/"
          className="mt-6 inline-block text-sm font-semibold text-primary hover:underline"
        >
          메인으로 돌아가기
        </Link>
      </div>
    )
  }

  if (!receipt) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm font-medium">결제 확인 중…</p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-10">
      <DonationSuccessPanel receipt={receipt} closeHref="/" closeLabel="랭킹 보러 가기" />
    </div>
  )
}

export default function PaymentSuccessPage() {
  return (
    <main className="min-h-screen bg-background">
      <Suspense
        fallback={
          <div className="flex min-h-[50vh] items-center justify-center text-muted-foreground">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        }
      >
        <PaymentSuccessContent />
      </Suspense>
    </main>
  )
}
