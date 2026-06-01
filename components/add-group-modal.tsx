"use client"

import { useCallback, useEffect, useState } from "react"
import * as Dialog from "@radix-ui/react-dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  GROUP_CATEGORIES,
  type GroupCategoryValue,
} from "@/lib/group-categories"
import { getGroupCategoryIcon } from "@/lib/groups"
import { readApiJson } from "@/lib/api-response"
import type { DonationTarget } from "@/lib/donation-target"
import { Plus, Sparkles, X } from "lucide-react"

export interface CreatedGroup {
  id: string
  group_name: string
  category: string
}

interface AddGroupModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated?: (group: CreatedGroup) => void
  onDonateClick?: (target: DonationTarget) => void
}

type Step = "form" | "success"

export function AddGroupModal({
  open,
  onOpenChange,
  onCreated,
  onDonateClick,
}: AddGroupModalProps) {
  const [step, setStep] = useState<Step>("form")
  const [groupName, setGroupName] = useState("")
  const [category, setCategory] = useState<GroupCategoryValue>("community")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [createdGroup, setCreatedGroup] = useState<CreatedGroup | null>(null)

  const resetForm = useCallback(() => {
    setStep("form")
    setGroupName("")
    setCategory("community")
    setError(null)
    setCreatedGroup(null)
    setIsSubmitting(false)
  }, [])

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      resetForm()
    }
    onOpenChange(nextOpen)
  }

  useEffect(() => {
    if (!open) {
      resetForm()
    }
  }, [open, resetForm])

  const handleSubmit = async () => {
    const trimmedName = groupName.trim()
    if (trimmedName.length < 2) {
      setError("집단 이름은 2자 이상 입력해주세요.")
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const response = await fetch("/api/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          groupName: trimmedName,
          category,
        }),
      })

      const result = await readApiJson<{
        error?: string
        group?: CreatedGroup
      }>(response)

      if (!response.ok) {
        throw new Error(result.error ?? `집단 등록에 실패했습니다. (${response.status})`)
      }

      if (!result.group) {
        throw new Error("등록된 집단 정보를 받지 못했습니다.")
      }

      setCreatedGroup(result.group)
      setStep("success")
      onCreated?.(result.group)
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "집단 등록에 실패했습니다."
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDonateNow = () => {
    if (!createdGroup) return

    onDonateClick?.({
      type: "group",
      id: createdGroup.id,
      name: createdGroup.group_name,
      icon: getGroupCategoryIcon(createdGroup.category),
      groupId: createdGroup.id,
      category: createdGroup.category,
    })

    resetForm()
    onOpenChange(false)
  }

  const previewIcon = getGroupCategoryIcon(category)

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm" />
        <Dialog.Content className="fixed z-[60] flex w-[calc(100%-2rem)] max-w-md flex-col overflow-hidden rounded-2xl border border-border/50 bg-card shadow-2xl inset-x-4 top-4 bottom-4 max-h-[calc(100dvh-2rem)] sm:inset-auto sm:left-1/2 sm:top-1/2 sm:bottom-auto sm:max-h-[min(90dvh,calc(100dvh-2rem))] sm:w-full sm:-translate-x-1/2 sm:-translate-y-1/2">
          {step === "form" ? (
            <>
              <div className="relative shrink-0 border-b border-border/30 bg-gradient-to-r from-violet-500/10 to-primary/10 px-6 py-5 pr-14">
                <Dialog.Title className="text-xl font-bold text-foreground">
                  새 집단 등록
                </Dialog.Title>
                <Dialog.Description className="mt-1 text-sm text-muted-foreground">
                  팬덤·대학·동아리 등 집단별 대항전에 참여할 팀을 추가하세요.
                </Dialog.Description>
                <Dialog.Close asChild>
                  <button
                    type="button"
                    className="absolute top-4 right-4 rounded-full bg-card/80 p-2 shadow-sm hover:bg-muted/80"
                  >
                    <X className="h-5 w-5 text-muted-foreground" />
                  </button>
                </Dialog.Close>
              </div>

              <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-6">
                <div className="flex items-center gap-3 rounded-xl border border-border/50 bg-muted/30 px-4 py-3">
                  <span className="text-3xl">{previewIcon}</span>
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-foreground">
                      {groupName.trim() || "집단 이름 미리보기"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {GROUP_CATEGORIES.find((c) => c.value === category)?.label}
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="group-name">집단 이름</Label>
                  <Input
                    id="group-name"
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    placeholder="예: 서울대 응원단, ○○ 팬클럽"
                    maxLength={40}
                    className="h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label>카테고리</Label>
                  <Select
                    value={category}
                    onValueChange={(value) =>
                      setCategory(value as GroupCategoryValue)
                    }
                  >
                    <SelectTrigger className="h-11 w-full">
                      <SelectValue placeholder="카테고리 선택" />
                    </SelectTrigger>
                    <SelectContent position="popper" className="z-[100]">
                      {GROUP_CATEGORIES.map((item) => (
                        <SelectItem key={item.value} value={item.value}>
                          <span className="flex items-center gap-2">
                            <span>{item.icon}</span>
                            <span>{item.label}</span>
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {error && (
                  <p className="text-center text-sm text-destructive">{error}</p>
                )}

                <Button
                  size="lg"
                  className="w-full font-semibold"
                  disabled={isSubmitting || groupName.trim().length < 2}
                  onClick={handleSubmit}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  {isSubmitting ? "등록 중…" : "집단 등록하기"}
                </Button>
              </div>
            </>
          ) : (
            <>
              <div className="shrink-0 border-b border-border/30 bg-gradient-to-br from-emerald-500/15 to-primary/10 px-6 py-8 text-center">
                <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/20">
                  <Sparkles className="h-7 w-7 text-emerald-600 dark:text-emerald-400" />
                </div>
                <Dialog.Title className="text-xl font-bold text-foreground">
                  집단이 등록되었습니다!
                </Dialog.Title>
                <Dialog.Description className="sr-only">
                  새 집단이 순위표에 추가되었습니다.
                </Dialog.Description>
                {createdGroup && (
                  <p className="mt-2 text-sm text-muted-foreground">
                    {getGroupCategoryIcon(createdGroup.category)}{" "}
                    <span className="font-medium text-foreground">
                      {createdGroup.group_name}
                    </span>
                  </p>
                )}
              </div>

              <div className="space-y-3 p-6">
                {onDonateClick && (
                  <Button
                    size="lg"
                    className="w-full bg-cta hover:bg-cta/90 text-cta-foreground font-semibold"
                    onClick={handleDonateNow}
                  >
                    바로 기부하기
                  </Button>
                )}
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full font-semibold"
                  onClick={() => handleOpenChange(false)}
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
