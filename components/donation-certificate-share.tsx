"use client"

import { useCallback, useLayoutEffect, useRef, useState } from "react"
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
  const exportRef = useRef<HTMLDivElement>(null)
  const previewContainerRef = useRef<HTMLDivElement>(null)
  const [previewScale, setPreviewScale] = useState(1)
  const [isExporting, setIsExporting] = useState(false)
  const [exportError, setExportError] = useState<string | null>(null)

  useLayoutEffect(() => {
    const node = previewContainerRef.current
    if (!node) return

    const updateScale = () => {
      const width = node.getBoundingClientRect().width
      if (width <= 0) return
      setPreviewScale(Math.min(1, width / CERTIFICATE_CARD_WIDTH))
    }

    updateScale()
    const observer = new ResizeObserver(updateScale)
    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  const handleDownload = useCallback(async () => {
    const node = exportRef.current
    if (!node || isExporting) return

    setIsExporting(true)
    setExportError(null)

    try {
      const dataUrl = await toPng(node, {
        width: CERTIFICATE_CARD_WIDTH,
        height: CERTIFICATE_CARD_HEIGHT,
        pixelRatio: 2,
        cacheBust: true,
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

  const scaledWidth = CERTIFICATE_CARD_WIDTH * previewScale
  const scaledHeight = CERTIFICATE_CARD_HEIGHT * previewScale

  return (
    <section className="space-y-4" aria-label="인스타그램 스토리 공유">
      <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
        <Share2 className="h-4 w-4 text-primary" />
        인스타 스토리에 공유하기
      </div>

      {/* Full-size capture target (off-screen, never clipped by modal) */}
      <div
        aria-hidden
        className="pointer-events-none fixed left-0 top-0 -z-10 opacity-0"
        style={{
          width: CERTIFICATE_CARD_WIDTH,
          height: CERTIFICATE_CARD_HEIGHT,
        }}
      >
        <DonationCertificateCard ref={exportRef} {...props} />
      </div>

      <div className="w-full rounded-2xl border border-border/50 bg-muted/30 px-2 py-4 sm:px-4">
        <div ref={previewContainerRef} className="w-full max-w-[360px] mx-auto">
          <div
            className="relative mx-auto"
            style={{ width: scaledWidth, height: scaledHeight }}
          >
            <div
              className="absolute left-0 top-0 overflow-hidden rounded-xl shadow-2xl ring-1 ring-white/10"
              style={{
                width: CERTIFICATE_CARD_WIDTH,
                height: CERTIFICATE_CARD_HEIGHT,
                transform: `scale(${previewScale})`,
                transformOrigin: "top left",
              }}
            >
              <DonationCertificateCard {...props} />
            </div>
          </div>
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
