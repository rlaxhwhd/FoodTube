"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { PlaylistPicker } from "./playlist-picker"

export function SourceSelector() {
  const router = useRouter()
  const [showPlaylists, setShowPlaylists] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function startScan(sourceType: "liked" | "playlist", playlistId?: string) {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sourceType, playlistId }),
      })
      const data = await res.json()

      if (res.status === 409 && data.jobId) {
        router.push(`/scan/${data.jobId}`)
        return
      }

      if (!res.ok) {
        setError(data.error ?? "스캔을 시작할 수 없습니다.")
        setLoading(false)
        return
      }

      if (data.jobId) {
        router.push(`/scan/${data.jobId}`)
      }
    } catch {
      setError("네트워크 오류가 발생했습니다. 다시 시도해주세요.")
      setLoading(false)
    }
  }

  if (showPlaylists) {
    return (
      <div>
        <Button
          variant="ghost"
          className="mb-4"
          onClick={() => setShowPlaylists(false)}
        >
          ← 뒤로
        </Button>
        <PlaylistPicker
          onSelect={(playlistId) => startScan("playlist", playlistId)}
          loading={loading}
        />
        {error && (
          <p role="alert" className="mt-4 text-center text-sm text-destructive">
            {error}
          </p>
        )}
      </div>
    )
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Card
        role="button"
        tabIndex={0}
        aria-label="좋아요 누른 영상에서 맛집 찾기"
        className="cursor-pointer transition-shadow duration-200 hover:shadow-md focus-visible:ring-2 focus-visible:ring-ring"
        onClick={() => !loading && startScan("liked")}
        onKeyDown={(e) => {
          if ((e.key === "Enter" || e.key === " ") && !loading) {
            e.preventDefault()
            startScan("liked")
          }
        }}
      >
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span aria-hidden="true" className="text-2xl">♥</span>
            좋아요 누른 영상
          </CardTitle>
          <CardDescription>
            좋아요 목록에서 맛집 영상을 찾습니다
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button className="w-full" disabled={loading} tabIndex={-1}>
            {loading ? "시작 중..." : "시작하기"}
          </Button>
        </CardContent>
      </Card>

      <Card
        role="button"
        tabIndex={0}
        aria-label="재생목록에서 맛집 찾기"
        className="cursor-pointer transition-shadow duration-200 hover:shadow-md focus-visible:ring-2 focus-visible:ring-ring"
        onClick={() => !loading && setShowPlaylists(true)}
        onKeyDown={(e) => {
          if ((e.key === "Enter" || e.key === " ") && !loading) {
            e.preventDefault()
            setShowPlaylists(true)
          }
        }}
      >
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span aria-hidden="true" className="text-2xl">☰</span>
            재생목록
          </CardTitle>
          <CardDescription>
            특정 재생목록에서 맛집 영상을 찾습니다
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" className="w-full" disabled={loading} tabIndex={-1}>
            재생목록 선택
          </Button>
        </CardContent>
      </Card>

      {error && (
        <p role="alert" className="col-span-full text-center text-sm text-destructive">
          {error}
        </p>
      )}

      <p className="col-span-full text-center text-sm text-muted-foreground">
        무료 플랜은 최대 50개 영상까지 분석합니다.
      </p>
    </div>
  )
}
