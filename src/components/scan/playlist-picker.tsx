"use client"

import { useEffect, useState } from "react"
import { Card, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import type { YouTubePlaylist } from "@/types"

interface PlaylistPickerProps {
  onSelect: (playlistId: string) => void
  loading: boolean
}

export function PlaylistPicker({ onSelect, loading }: PlaylistPickerProps) {
  const [playlists, setPlaylists] = useState<YouTubePlaylist[]>([])
  const [fetching, setFetching] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch("/api/playlists")
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          setError(data.error)
        } else {
          setPlaylists(data.playlists ?? [])
        }
      })
      .catch(() => setError("재생목록을 불러오지 못했습니다. 다시 시도해주세요."))
      .finally(() => setFetching(false))
  }, [])

  if (fetching) {
    return (
      <div className="grid gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-20 w-full" />
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <p role="alert" className="text-center text-sm text-destructive">
        {error}
      </p>
    )
  }

  if (playlists.length === 0) {
    return (
      <div className="flex flex-col items-center py-8 text-center">
        <p className="text-sm text-muted-foreground">
          공개 재생목록이 없습니다.
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          YouTube에서 재생목록을 만들어보세요.
        </p>
      </div>
    )
  }

  return (
    <div className="grid gap-3">
      <h2 className="text-lg font-semibold">재생목록을 선택하세요</h2>
      {playlists.map((pl) => (
        <Card
          key={pl.id}
          role="button"
          tabIndex={0}
          aria-label={`${pl.title} - ${pl.itemCount}개 영상`}
          className="cursor-pointer transition-shadow duration-200 hover:shadow-md focus-visible:ring-2 focus-visible:ring-ring"
          onClick={() => !loading && onSelect(pl.id)}
          onKeyDown={(e) => {
            if ((e.key === "Enter" || e.key === " ") && !loading) {
              e.preventDefault()
              onSelect(pl.id)
            }
          }}
        >
          <CardHeader className="flex flex-row items-center gap-4 p-4">
            {pl.thumbnailUrl ? (
              <img
                src={pl.thumbnailUrl}
                alt=""
                width={120}
                height={68}
                loading="lazy"
                className="h-16 w-24 shrink-0 rounded object-cover"
              />
            ) : (
              <div className="flex h-16 w-24 shrink-0 items-center justify-center rounded bg-muted">
                <span className="text-xs text-muted-foreground">No img</span>
              </div>
            )}
            <div className="min-w-0 flex-1">
              <CardTitle className="truncate text-base">{pl.title}</CardTitle>
              <p className="text-sm tabular-nums text-muted-foreground">
                {pl.itemCount}개 영상
              </p>
            </div>
            <Button size="sm" variant="outline" disabled={loading} tabIndex={-1}>
              {loading ? "분석 중..." : "선택"}
            </Button>
          </CardHeader>
        </Card>
      ))}
    </div>
  )
}
