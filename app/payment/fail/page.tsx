"use client"

import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Suspense } from "react"
import { Button } from "@/components/ui/button"

function PaymentFailContent() {
  const searchParams = useSearchParams()
  const code = searchParams.get("code")
  const message = searchParams.get("message")

  return (
    <div className="mx-auto max-w-lg px-4 py-16 text-center">
      <h1 className="text-2xl font-bold text-foreground">결제가 완료되지 않았습니다</h1>
      <p className="mt-3 text-muted-foreground leading-relaxed">
        {message ?? "결제를 취소했거나 오류가 발생했습니다. 다시 시도해 주세요."}
      </p>
      {code && (
        <p className="mt-2 font-mono text-xs text-muted-foreground">코드: {code}</p>
      )}
      <Button asChild className="mt-8" size="lg">
        <Link href="/">메인으로 돌아가기</Link>
      </Button>
    </div>
  )
}

export default function PaymentFailPage() {
  return (
    <main className="min-h-screen bg-background">
      <Suspense>
        <PaymentFailContent />
      </Suspense>
    </main>
  )
}
