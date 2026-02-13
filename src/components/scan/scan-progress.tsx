"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { ScanJobStatus } from "@/types"

const STEPS = [
  { key: "collecting", label: "영상 수집 중..." },
  { key: "filtering", label: "AI가 맛집 영상을 찾고 있어요..." },
  { key: "extracting", label: "음식점 정보를 추출하고 있어요..." },
  { key: "completed", label: "완료!" },
] as const

interface ScanProgressProps {
  status: ScanJobStatus
}

export function ScanProgress({ status }: ScanProgressProps) {
  if (status.status === "failed") {
    return (
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="text-destructive">오류가 발생했습니다</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p role="alert" className="text-sm text-muted-foreground">
            {status.errorMessage ?? "알 수 없는 오류가 발생했습니다. 다시 시도해주세요."}
          </p>
          <Button asChild>
            <Link href="/dashboard">다시 시도하기</Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  const currentStepIdx = STEPS.findIndex((s) => s.key === status.status)

  return (
    <Card>
      <CardHeader>
        <CardTitle>맛집을 찾고 있어요</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4" aria-live="polite">
          {STEPS.map((step, idx) => {
            const isActive = step.key === status.status
            const isDone = idx < currentStepIdx || status.status === "completed"

            return (
              <div key={step.key} className="flex items-center gap-3">
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-medium transition-colors duration-300 ${
                    isDone
                      ? "bg-primary text-primary-foreground"
                      : isActive
                        ? "bg-primary/20 text-primary animate-pulse"
                        : "bg-muted text-muted-foreground"
                  }`}
                  aria-hidden="true"
                >
                  {isDone ? "✓" : idx + 1}
                </div>
                <span
                  className={
                    isActive
                      ? "font-medium"
                      : isDone
                        ? "text-muted-foreground"
                        : "text-muted-foreground/50"
                  }
                >
                  {step.label}
                </span>
              </div>
            )
          })}
        </div>

        <div
          className="grid grid-cols-3 gap-4 rounded-lg bg-muted p-4 text-center"
          aria-label="스캔 진행 통계"
        >
          <div>
            <p className="text-2xl font-bold tabular-nums">{status.totalVideos}</p>
            <p className="text-xs text-muted-foreground">수집 영상</p>
          </div>
          <div>
            <p className="text-2xl font-bold tabular-nums">{status.filteredCount}</p>
            <p className="text-xs text-muted-foreground">맛집 영상</p>
          </div>
          <div>
            <p className="text-2xl font-bold tabular-nums">{status.restaurantCount}</p>
            <p className="text-xs text-muted-foreground">추출 맛집</p>
          </div>
        </div>

        {status.status === "completed" && (
          <div className="flex gap-2">
            <Button asChild className="flex-1">
              <Link href={`/restaurants?jobId=${status.id}`}>
                맛집 리스트 보기
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/dashboard">새 스캔</Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
