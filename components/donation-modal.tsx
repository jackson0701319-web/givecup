"use client"

import { useState, useEffect, useCallback } from "react"
import * as Dialog from "@radix-ui/react-dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Heart,
  X,
  Shield,
  Receipt,
  Sparkles,
  Globe,
} from "lucide-react"
import type { DonationTarget } from "@/lib/donation-target"
import {
  buildDonationApiBody,
  normalizeDonationTarget,
} from "@/lib/donation-target"
import { readApiJson } from "@/lib/api-response"
import { useSupabase } from "@/components/supabase-provider"
import type { CountryRow } from "@/lib/supabase/database.types"

const NO_BONUS_COUNTRY = "__none__"

const DONATION_AMOUNTS = [5, 10, 25, 50]
const DEFAULT_DONOR_NAME = "익명의 기부자"
const PLATFORM_TIP_OPTIONS = [
  { value: 0, label: "안 함" },
  { value: 1, label: "$1" },
  { value: 3, label: "$3" },
  { value: 5, label: "$5" },
] as const

const TIP_PRESET_CUSTOM = "custom" as const
type TipPreset = (typeof PLATFORM_TIP_OPTIONS)[number]["value"] | typeof TIP_PRESET_CUSTOM

/** @deprecated Use DonationTarget from @/lib/donation-target */
export type DonationTargetCountry = DonationTarget & {
  type: "country"
  countryCode: string
  flag: string
}

interface CountryOption {
  code: string
  name: string
  flag: string
}

interface DonationReceipt {
  receiptId: string
  donorName: string
  targetType: "country" | "group" | "dual"
  targetLabel: string
  targetIcon: string
  targetSubtitle?: string
  countryName?: string
  countryFlag?: string
  amount: number
  issuedAt: string
}

interface DonationModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  target: DonationTarget | null
  onDonationSuccess?: () => void
}

type ModalStep = "form" | "success"

export function DonationModal({
  open,
  onOpenChange,
  target,
  onDonationSuccess,
}: DonationModalProps) {
  const supabase = useSupabase()
  const [step, setStep] = useState<ModalStep>("form")
  const [selectedAmount, setSelectedAmount] = useState<number | null>(10)
  const [customAmount, setCustomAmount] = useState("")
  const [donorNickname, setDonorNickname] = useState("")
  const [tipPreset, setTipPreset] = useState<TipPreset>(0)
  const [customTip, setCustomTip] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [receipt, setReceipt] = useState<DonationReceipt | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [bonusCountryCode, setBonusCountryCode] = useState("KR")
  const [countryOptions, setCountryOptions] = useState<CountryOption[]>([])
  const [countriesLoading, setCountriesLoading] = useState(false)

  const donationAmount = selectedAmount ?? (parseFloat(customAmount) || 0)

  const tipAmount =
    tipPreset === TIP_PRESET_CUSTOM
      ? Math.max(0, parseFloat(customTip) || 0)
      : tipPreset

  const totalAmount = donationAmount + tipAmount

  const resolvedTarget = normalizeDonationTarget(target)
  const isGroup = resolvedTarget?.type === "group"
  const modalTitle = resolvedTarget
    ? `${resolvedTarget.name}에게 화력 지원하기 ⚽`
    : "화력 지원하기 ⚽"

  const resetForm = useCallback(() => {
    setStep("form")
    setSelectedAmount(10)
    setCustomAmount("")
    setDonorNickname("")
    setTipPreset(0)
    setCustomTip("")
    setReceipt(null)
    setSubmitError(null)
    setBonusCountryCode("KR")
  }, [])

  useEffect(() => {
    if (!open || target?.type !== "group") return

    const loadCountries = async () => {
      if (!supabase) return

      setCountriesLoading(true)
      const { data } = await supabase
        .from("countries")
        .select("country_code, name, flag_emoji")
        .order("name", { ascending: true })

      setCountryOptions(
        (data ?? []).map((row: Pick<CountryRow, "country_code" | "name" | "flag_emoji">) => ({
          code: row.country_code,
          name: row.name,
          flag: row.flag_emoji,
        }))
      )
      setCountriesLoading(false)
    }

    loadCountries()
  }, [open, target?.type, supabase])

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      if (step === "success") {
        onDonationSuccess?.()
      }
      resetForm()
    }
    onOpenChange(nextOpen)
  }

  useEffect(() => {
    if (!open) {
      resetForm()
    }
  }, [open, resetForm])

  const handleAmountSelect = (amount: number) => {
    setSelectedAmount(amount)
    setCustomAmount("")
  }

  const handleCustomAmountChange = (value: string) => {
    setCustomAmount(value)
    setSelectedAmount(null)
  }

  const handleTipPresetSelect = (value: (typeof PLATFORM_TIP_OPTIONS)[number]["value"]) => {
    setTipPreset(value)
    setCustomTip("")
  }

  const handleCustomTipChange = (value: string) => {
    setCustomTip(value)
    setTipPreset(TIP_PRESET_CUSTOM)
  }

  const handleDonate = async () => {
    const activeTarget = normalizeDonationTarget(target)
    if (donationAmount <= 0 || isSubmitting || !activeTarget) return

    setIsSubmitting(true)
    setSubmitError(null)

    const donorName = donorNickname.trim() || DEFAULT_DONOR_NAME

    const body = buildDonationApiBody(activeTarget, donationAmount, donorName, {
      bonusCountryCode:
        activeTarget.type === "group" && bonusCountryCode !== NO_BONUS_COUNTRY
          ? bonusCountryCode
          : null,
    })

    if (!body) {
      setSubmitError(
        activeTarget.type === "country"
          ? "국가 코드가 없어 기부할 수 없습니다. 순위표에서 다시 선택해 주세요."
          : "집단 정보가 없어 기부할 수 없습니다. 순위표에서 다시 선택해 주세요."
      )
      setIsSubmitting(false)
      return
    }

    try {
      const response = await fetch("/api/donations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      })

      const result = await readApiJson<{
        error?: string
        receipt_id?: string
        donor_name?: string
        target_type?: "country" | "group" | "dual"
        target_name?: string
        target_icon?: string
        target_category?: string
        group_name?: string
        group_category?: string
        country_name?: string
        country_flag?: string
      }>(response)

      if (!response.ok) {
        throw new Error(
          result.error ?? `기부 처리 중 오류가 발생했습니다. (${response.status})`
        )
      }

      if (!result.receipt_id) {
        throw new Error("영수증 정보를 받지 못했습니다.")
      }

      const receiptType = result.target_type ?? activeTarget.type

      setReceipt({
        receiptId: result.receipt_id,
        donorName: result.donor_name ?? donorName,
        targetType: receiptType,
        targetLabel: result.group_name ?? result.target_name ?? activeTarget.name,
        targetIcon:
          result.country_flag ?? result.target_icon ?? activeTarget.icon,
        targetSubtitle:
          result.group_category ??
          (isGroup ? activeTarget.category : undefined),
        countryName: result.country_name,
        countryFlag: result.country_flag ?? result.target_icon,
        amount: donationAmount,
        issuedAt: new Date().toISOString(),
      })
      setStep("success")
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "기부 처리 중 오류가 발생했습니다."
      setSubmitError(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCloseAfterSuccess = () => {
    onDonationSuccess?.()
    resetForm()
    onOpenChange(false)
  }

  const formattedIssuedAt = receipt
    ? new Date(receipt.issuedAt).toLocaleString("ko-KR", {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : ""

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed z-50 flex w-[calc(100%-2rem)] max-w-lg flex-col overflow-hidden rounded-2xl border border-border/50 bg-card p-0 shadow-2xl inset-x-4 top-4 bottom-4 max-h-[calc(100dvh-2rem)] sm:inset-auto sm:left-1/2 sm:top-1/2 sm:bottom-auto sm:h-auto sm:max-h-[min(90dvh,calc(100dvh-2rem))] sm:w-[min(calc(100%-2rem),32rem)] sm:-translate-x-1/2 sm:-translate-y-1/2 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 duration-200">
          {step === "form" ? (
            <>
              <div className="relative shrink-0 border-b border-border/30 bg-gradient-to-r from-primary/10 to-accent/10 px-6 py-5 pr-14">
                <Dialog.Title className="text-xl font-bold text-foreground text-center">
                  {modalTitle}
                </Dialog.Title>
                <Dialog.Description className="text-sm text-muted-foreground text-center mt-1">
                  유효슈팅 100% · 검증된 국제 구호 단체에 전액 전달됩니다.
                </Dialog.Description>
                {resolvedTarget && (
                  <div className="mt-3 flex flex-col items-center justify-center gap-1 text-sm font-medium text-foreground">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{resolvedTarget.icon}</span>
                      <span>
                        {resolvedTarget.name}
                        {resolvedTarget.category
                          ? ` (${resolvedTarget.category})`
                          : ""}
                      </span>
                    </div>
                  </div>
                )}
                <Dialog.Close asChild>
                  <button
                    type="button"
                    className="absolute top-4 right-4 z-20 rounded-full bg-card/80 p-2 shadow-sm backdrop-blur-sm transition-colors hover:bg-muted/80"
                  >
                    <X className="w-5 h-5 text-muted-foreground" />
                  </button>
                </Dialog.Close>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain p-6 space-y-6">
                <div>
                  <label
                    htmlFor="donor-nickname"
                    className="text-sm font-semibold text-foreground mb-2 block"
                  >
                    기부자 닉네임 (선택)
                  </label>
                  <Input
                    id="donor-nickname"
                    type="text"
                    placeholder={DEFAULT_DONOR_NAME}
                    value={donorNickname}
                    onChange={(e) => setDonorNickname(e.target.value)}
                    maxLength={40}
                    className="h-12 rounded-xl border-2 border-border/50 bg-muted/20"
                  />
                  <p className="mt-1.5 text-xs text-muted-foreground">
                    비워두면 &quot;{DEFAULT_DONOR_NAME}&quot;으로 표시됩니다.
                  </p>
                </div>

                {isGroup && (
                  <div className="rounded-xl border border-primary/25 bg-gradient-to-br from-primary/5 to-accent/5 p-4 space-y-3">
                    <label className="flex items-center gap-2 text-sm font-semibold text-foreground">
                      <Globe className="h-4 w-4 text-primary" />
                      함께 응원할 국가 선택 (선택사항)
                    </label>
                    <Select
                      value={bonusCountryCode}
                      onValueChange={setBonusCountryCode}
                      disabled={countriesLoading}
                    >
                      <SelectTrigger className="h-11 w-full bg-card">
                        <SelectValue
                          placeholder={
                            countriesLoading ? "국가 목록 불러오는 중…" : "국가 선택"
                          }
                        />
                      </SelectTrigger>
                      <SelectContent className="max-h-72">
                        <SelectItem value={NO_BONUS_COUNTRY}>
                          선택 안 함 (집단만 응원)
                        </SelectItem>
                        {countryOptions.map((country) => (
                          <SelectItem key={country.code} value={country.code}>
                            <span className="flex items-center gap-2">
                              <span>{country.flag}</span>
                              <span>
                                {country.name} ({country.code})
                              </span>
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      집단 순위와 함께 선택한 국가 순위에도 같은 금액이 반영됩니다.
                      기본값은 대한민국(KR)입니다.
                    </p>
                  </div>
                )}

                <div>
                  <label className="text-sm font-semibold text-foreground mb-3 block">
                    기부 금액 선택
                  </label>
                  <div className="grid grid-cols-4 gap-3">
                    {DONATION_AMOUNTS.map((amount) => (
                      <button
                        key={amount}
                        type="button"
                        onClick={() => handleAmountSelect(amount)}
                        className={`py-3 px-4 rounded-xl font-semibold text-base transition-all duration-200 border-2 ${
                          selectedAmount === amount
                            ? "bg-primary text-primary-foreground border-primary shadow-md"
                            : "bg-muted/30 text-foreground border-border/50 hover:border-primary/50 hover:bg-muted/50"
                        }`}
                      >
                        ${amount}
                      </button>
                    ))}
                  </div>
                  <div className="mt-3">
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">
                        $
                      </span>
                      <input
                        type="number"
                        placeholder="직접 입력"
                        value={customAmount}
                        onChange={(e) =>
                          handleCustomAmountChange(e.target.value)
                        }
                        className={`w-full pl-8 pr-4 py-3 rounded-xl border-2 bg-muted/20 text-foreground placeholder:text-muted-foreground/60 focus:outline-none transition-all ${
                          selectedAmount === null && customAmount
                            ? "border-primary bg-primary/5"
                            : "border-border/50 focus:border-primary/50"
                        }`}
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-muted/30 rounded-xl p-4 border border-border/30">
                  <div className="flex items-start gap-3 mb-4">
                    <div className="p-2 rounded-lg bg-accent/10 shrink-0">
                      <Heart className="w-4 h-4 text-accent" />
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      기부컵은 월드컵 시즌에도 기부금에서 수수료를 떼지 않습니다.
                      서버·실시간 랭킹 유지를 위해 운영진에게 이온음료 한 캔
                      정도만 후원해 주셔도 충분해요.
                    </p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">
                      기부컵 서버 운영진에게 이온음료 후원하기 (선택)
                    </label>
                    <div className="grid grid-cols-4 gap-3">
                      {PLATFORM_TIP_OPTIONS.map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => handleTipPresetSelect(option.value)}
                          className={`py-3 px-2 rounded-xl font-semibold text-sm transition-all duration-200 border-2 ${
                            tipPreset === option.value
                              ? "bg-primary text-primary-foreground border-primary shadow-md"
                              : "bg-card text-foreground border-border/50 hover:border-primary/50 hover:bg-muted/50"
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                    <div className="mt-3">
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">
                          $
                        </span>
                        <input
                          type="number"
                          min={0}
                          step={0.01}
                          placeholder="직접 입력"
                          value={customTip}
                          onChange={(e) => handleCustomTipChange(e.target.value)}
                          onFocus={() => setTipPreset(TIP_PRESET_CUSTOM)}
                          className={`w-full pl-8 pr-4 py-3 rounded-xl border-2 bg-card text-foreground placeholder:text-muted-foreground/60 focus:outline-none transition-all ${
                            tipPreset === TIP_PRESET_CUSTOM && customTip
                              ? "border-primary bg-primary/5"
                              : "border-border/50 focus:border-primary/50"
                          }`}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-muted/20 rounded-xl p-4 space-y-3 border border-border/30">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">구호 단체 기부금</span>
                    <span className="text-foreground font-medium">
                      ${donationAmount.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">플랫폼 후원 팁</span>
                    <span className="text-foreground font-medium">
                      ${tipAmount.toFixed(2)}
                    </span>
                  </div>
                  <div className="pt-3 border-t border-border/50 flex justify-between items-center">
                    <span className="text-foreground font-semibold">
                      총 결제 금액
                    </span>
                    <span className="text-xl font-bold text-primary">
                      ${totalAmount.toFixed(2)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <Shield className="w-4 h-4 text-accent" />
                  <span>SSL 암호화로 안전하게 처리됩니다</span>
                </div>

                {submitError && (
                  <p className="text-sm text-destructive text-center">
                    {submitError}
                  </p>
                )}

                <Button
                  size="lg"
                  onClick={handleDonate}
                  disabled={donationAmount <= 0 || isSubmitting || !resolvedTarget}
                  className="w-full bg-cta hover:bg-cta/90 text-cta-foreground font-bold text-lg py-7 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Heart className="w-5 h-5 mr-2" />
                  {isSubmitting
                    ? "킥오프 중..."
                    : "골 넣으러 가기 (기부하기)"}
                </Button>
              </div>
            </>
          ) : (
            <>
              <div className="shrink-0 border-b border-border/30 bg-gradient-to-br from-emerald-500/15 via-primary/10 to-accent/15 px-6 py-8 text-center">
                <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/20">
                  <Sparkles className="h-7 w-7 text-emerald-600 dark:text-emerald-400" />
                </div>
                <Dialog.Title className="text-xl font-bold text-foreground">
                  유효슈팅 성공! VAR 통과 · 영수증 발급
                </Dialog.Title>
                <Dialog.Description className="sr-only">
                  기부가 완료되었으며 영수증이 발급되었습니다.
                </Dialog.Description>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain p-6 space-y-6">
                {receipt && (
                  <div className="relative overflow-hidden rounded-2xl border-2 border-dashed border-primary/30 bg-gradient-to-b from-card to-muted/40 p-6 shadow-inner">
                    <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-primary/10" />
                    <div className="absolute -bottom-8 -left-4 h-20 w-20 rounded-full bg-accent/10" />

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
                          <p className="mt-1 font-semibold text-foreground">
                            {receipt.donorName}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                            {receipt.targetType === "country"
                              ? "기부 국가"
                              : "기부 집단"}
                          </p>
                          <p className="mt-1 font-semibold text-foreground">
                            {receipt.targetIcon} {receipt.targetLabel}
                          </p>
                          {receipt.targetSubtitle && (
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {receipt.targetSubtitle}
                            </p>
                          )}
                        </div>
                      </div>

                      {receipt.targetType === "dual" && receipt.countryName && (
                          <div className="rounded-xl border border-border/40 bg-background/60 px-4 py-3">
                            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                              함께 응원한 국가
                            </p>
                            <p className="mt-1 font-semibold text-foreground">
                              {receipt.countryFlag} {receipt.countryName}
                            </p>
                            {receipt.targetType === "dual" && (
                              <p className="mt-1 text-xs text-accent">
                                이중 기부 · 집단 + 국가 순위 동시 반영
                              </p>
                            )}
                          </div>
                        )}

                      <div className="flex items-end justify-between rounded-xl bg-background/60 px-4 py-3 border border-border/40">
                        <div>
                          <p className="text-xs text-muted-foreground">
                            기부 금액
                          </p>
                          <p className="text-2xl font-bold text-primary">
                            ${receipt.amount.toLocaleString()}
                          </p>
                        </div>
                        <p className="text-xs text-muted-foreground text-right max-w-[140px]">
                          {formattedIssuedAt}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <Button
                  size="lg"
                  onClick={handleCloseAfterSuccess}
                  className="w-full font-bold text-lg py-7 rounded-xl"
                >
                  닫기
                </Button>
              </div>
            </>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
