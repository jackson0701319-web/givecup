"use client"

import { useCallback, useRef, useState } from "react"
import { toPng } from "html-to-image"
import { Camera, Loader2, Share2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DonationCertificateCard,
  CERTIFICATE_CARD_HEIGHT,
  CERTIFICATE_CARD_WIDTH,
  type DonationCertificateCardProps,
} from "@/components/donation-certificate-card"

const DOWNLOAD_FILENAME = "givecup-certificate.png"

interface DonationCertificateShareProps extends DonationCertificateCardProps {}

export function DonationCertificateShare(props: DonationCertificateShareProps) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [isExporting, setIsExporting] = useState(false)
  const [exportError, setExportError] = useState<string | null>(null)

  const handleDownload = useCallback(async () => {
    const node = cardRef.current
    if (!node || isExporting) return

    setIsExporting(true)
    setExportError(null)

    try {
      const dataUrl = await toPng(node, {
        width: CERTIFICATE_CARD_WIDTH,
        height: CERTIFICATE_CARD_HEIGHT,
        pixelRatio: 2,
        cacheBust: true,
        style: {
          transform: "scale(1)",
          transformOrigin: "top left",
        },
      })

      const link = document.createElement("a")
      link.download = DOWNLOAD_FILENAME
      link.href = dataUrl
      link.click()
    } catch {
      setExportError("이미지 생성에 실패했습니다. 잠시 후 다시 시도해 주세요.")
    } finally {
      setIsExporting(false)
    }
  }, [isExporting])

  return (
    <section className="space-y-4" aria-label="인스타그램 스토리 공유">
      <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
        <Share2 className="h-4 w-4 text-primary" />
        인스타 스토리에 공유하기
      </div>

      <div className="flex justify-center overflow-x-auto rounded-2xl border border-border/50 bg-muted/30 p-3 sm:p-4">
        <div
          className="origin-top overflow-hidden rounded-xl shadow-2xl ring-1 ring-white/10 scale-[0.82] sm:scale-100"
          style={{
            width: CERTIFICATE_CARD_WIDTH,
          }}
        >
          <DonationCertificateCard ref={cardRef} {...props} />
        </div>
      </div>

      <Button
        type="button"
        size="lg"
        variant="secondary"
        disabled={isExporting}
        onClick={handleDownload}
        className="w-full gap-2 py-6 text-base font-bold"
      >
        {isExporting ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            이미지 생성 중...
          </>
        ) : (
          <>
            <Camera className="h-5 w-5" />
            📸 인증서 이미지로 저장하기
          </>
        )}
      </Button>

      {exportError && (
        <p className="text-center text-sm text-destructive">{exportError}</p>
      )}

      <p className="text-center text-xs text-muted-foreground">
        스토리에 올린 뒤 프로필 링크에 givecup.vercel.app을 넣으면 친구들이 바로
        참전할 수 있어요.
      </p>
    </section>
  )
}
