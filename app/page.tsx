 "use client"

import { useState } from "react"
import { RankingBoard } from "@/components/ranking-board"
import { DonationModal } from "@/components/donation-modal"
import { LiveStats } from "@/components/live-stats"
import { LiveDonationTicker } from "@/components/live-donation-ticker"
import Link from "next/link"
import { Trophy, Shield, Heart, FileText, ExternalLink, BookOpen } from "lucide-react"
import type { DonationTarget } from "@/lib/donation-target"

export default function Home() {
  const [donationTarget, setDonationTarget] = useState<DonationTarget | null>(null)
  const [isDonationOpen, setIsDonationOpen] = useState(false)
  const [refreshSignal, setRefreshSignal] = useState(0)

  const handleDonateClick = (target: DonationTarget) => {
    setDonationTarget(target)
    setIsDonationOpen(true)
  }

  const handleDonationSuccess = () => {
    setRefreshSignal((prev) => prev + 1)
  }

  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 px-6 lg:px-8 py-4 flex items-center justify-between bg-card/90 backdrop-blur-md border-b border-border/50 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-sm">
            <Trophy className="w-6 h-6 text-primary-foreground" />
          </div>
          <div className="hidden sm:block">
            <span className="font-bold text-xl text-foreground tracking-tight">GiveCup</span>
            <span className="text-muted-foreground text-sm ml-2">기부컵</span>
          </div>
        </div>
        <div className="text-sm text-muted-foreground hidden md:block">
          국가를 검색하거나 순위표에서 <span className="font-semibold text-foreground">&apos;기부하기&apos;</span>를 눌러주세요
        </div>
      </header>

      <LiveDonationTicker />

      {/* Main content */}
      <div className="pt-32 pb-24 px-4 md:px-8 lg:px-12">
        {/* Hero */}
        <div className="text-center mb-16 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-accent/10 text-accent px-5 py-2.5 rounded-full text-sm font-medium mb-8">
            <span className="w-2.5 h-2.5 bg-accent rounded-full animate-pulse" />
            실시간 업데이트 중
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6 text-balance leading-tight">
            월드컵처럼 전 세계가 하나 되어 즐기는
            <br />
            <span className="text-primary">기부컵 GiveCup</span>
          </h1>
          <p className="text-lg lg:text-xl text-muted-foreground max-w-2xl mx-auto text-pretty leading-relaxed">
            국가별 순위로 나눔의 열기를 함께해요. 당신의 기부가 우리나라의 순위를 바꿉니다.
          </p>
          <div className="mt-6 inline-flex items-center gap-2 bg-accent/5 border border-accent/20 text-accent-foreground px-6 py-3 rounded-lg text-sm font-medium">
            <Shield className="w-4 h-4 text-accent" />
            <span>모든 기부금은 검증된 국제 구호 단체를 통해 전액 전달됩니다</span>
          </div>
          <div className="mt-8">
            <Link
              href="/ledger"
              className="inline-flex items-center gap-2 rounded-xl border-2 border-primary/30 bg-primary/5 px-6 py-3.5 text-sm font-semibold text-primary shadow-sm transition-all hover:border-primary/50 hover:bg-primary/10"
            >
              <BookOpen className="h-4 w-4" />
              실시간 오픈 장부 보기
              <span aria-hidden>➡️</span>
            </Link>
          </div>
        </div>

        {/* Trust badges */}
        <div className="flex flex-wrap justify-center gap-8 mb-14">
          <div className="flex items-center gap-2.5 text-muted-foreground">
            <div className="p-2 rounded-full bg-accent/10">
              <Shield className="w-4 h-4 text-accent" />
            </div>
            <span className="text-sm font-medium">투명한 기부금 운영</span>
          </div>
          <div className="flex items-center gap-2.5 text-muted-foreground">
            <div className="p-2 rounded-full bg-cta/10">
              <Heart className="w-4 h-4 text-cta" />
            </div>
            <span className="text-sm font-medium">기부금 100% 단체 전달 (자율 후원제)</span>
          </div>
          <div className="flex items-center gap-2.5 text-muted-foreground">
            <div className="p-2 rounded-full bg-primary/10">
              <Trophy className="w-4 h-4 text-primary" />
            </div>
            <span className="text-sm font-medium">216개국 참여</span>
          </div>
        </div>

        {/* Live Stats */}
        <div className="mb-20">
          <LiveStats />
        </div>

        {/* Section Title */}
        <div className="text-center mb-10">
          <h2 className="text-2xl lg:text-3xl font-bold text-foreground mb-3 tracking-tight">
            실시간 기부 순위
          </h2>
          <p className="text-muted-foreground text-base lg:text-lg">
            국가별·집단별 대항전 탭을 선택하고, 검색 후 바로 기부하거나 순위를 확인하세요
          </p>
        </div>

        {/* Ranking Board */}
        <RankingBoard
          onDonateClick={handleDonateClick}
          refreshSignal={refreshSignal}
        />
      </div>

      <DonationModal
        open={isDonationOpen}
        onOpenChange={(open) => {
          setIsDonationOpen(open)
          if (!open) {
            setDonationTarget(null)
          }
        }}
        target={donationTarget}
        onDonationSuccess={handleDonationSuccess}
      />

      {/* Footer */}
      <footer className="bg-card border-t border-border/50">
        <div className="px-6 lg:px-8 py-10 border-b border-border/30">
          <div className="max-w-5xl mx-auto">
            <div className="flex flex-wrap justify-center items-center gap-x-8 gap-y-3 text-sm text-muted-foreground">
              <span>UNICEF</span>
              <span>국경없는의사회</span>
              <span>월드비전</span>
              <span>세이브더칠드런</span>
              <span>굿네이버스</span>
            </div>
          </div>
        </div>

        {/* Main footer content */}
        <div className="px-6 lg:px-8 py-16">
          <div className="max-w-5xl mx-auto">
            <div className="grid md:grid-cols-3 gap-12">
              {/* Logo & Description */}
              <div className="md:col-span-1">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-sm">
                    <Trophy className="w-5 h-5 text-primary-foreground" />
                  </div>
                  <div>
                    <span className="font-bold text-lg text-foreground tracking-tight">GiveCup</span>
                    <p className="text-muted-foreground text-xs">기부컵</p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  월드컵처럼 전 세계가 하나 되어 즐기는 기부 축제. 216개국이 참여하는
                  국가별 기부 순위 캠페인입니다.
                </p>
              </div>

              {/* Quick Links */}
              <div>
                <h4 className="font-semibold text-foreground mb-4 text-sm">바로가기</h4>
                <ul className="space-y-3 text-sm">
                  <li>
                    <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">캠페인 소개</a>
                  </li>
                  <li>
                    <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">기부 방법</a>
                  </li>
                  <li>
                    <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">기부 단체</a>
                  </li>
                  <li>
                    <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">자주 묻는 질문</a>
                  </li>
                  <li>
                    <Link
                      href="/ledger"
                      className="text-accent hover:text-accent/80 font-medium transition-colors"
                    >
                      실시간 오픈 장부
                    </Link>
                  </li>
                </ul>
              </div>

              {/* Legal & Transparency */}
              <div>
                <h4 className="font-semibold text-foreground mb-4 text-sm">투명성 및 정책</h4>
                <ul className="space-y-3 text-sm">
                  <li>
                    <a href="#" className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      이용약관
                    </a>
                  </li>
                  <li>
                    <a href="#" className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2">
                      <Shield className="w-4 h-4" />
                      개인정보처리방침
                    </a>
                  </li>
                  <li>
                    <a href="#" className="inline-flex items-center gap-2 text-accent hover:text-accent/80 font-medium transition-colors">
                      <ExternalLink className="w-4 h-4" />
                      투명성 보고서 보기
                    </a>
                  </li>
                </ul>
              </div>
            </div>

            {/* Bottom bar */}
            <div className="mt-12 pt-8 border-t border-border/50 flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="text-sm text-muted-foreground">
                <p>&copy; 2024 GiveCup. All rights reserved.</p>
              </div>
              <div className="flex items-center gap-6 text-xs text-muted-foreground">
                <span>고유번호: 000-00-00000</span>
                <span>대표: 홍길동</span>
                <span>서울특별시 중구 세종대로 110</span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </main>
  )
}
