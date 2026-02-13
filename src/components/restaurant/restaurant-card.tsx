"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { RestaurantCard as RestaurantCardType } from "@/types"

interface RestaurantCardProps {
  restaurant: RestaurantCardType
  onDelete?: (id: string) => void
}

export function RestaurantCard({ restaurant, onDelete }: RestaurantCardProps) {
  const [deleting, setDeleting] = useState(false)
  const youtubeUrl = `https://www.youtube.com/watch?v=${restaurant.videoId}`

  async function handleDelete() {
    if (!confirm(`"${restaurant.restaurantName}"을(를) 삭제하시겠습니까?`)) return

    setDeleting(true)
    try {
      const res = await fetch(`/api/restaurants/${restaurant.id}`, { method: "DELETE" })
      if (res.ok) {
        onDelete?.(restaurant.id)
      }
    } catch {
      // 무시
    } finally {
      setDeleting(false)
    }
  }

  return (
    <Card className="group relative overflow-hidden transition-shadow duration-200 hover:shadow-md">
      <Button
        variant="ghost"
        size="icon"
        className="absolute right-2 top-2 z-10 h-8 w-8 rounded-full bg-black/50 text-white opacity-0 transition-opacity duration-200 hover:bg-red-600 group-hover:opacity-100"
        onClick={handleDelete}
        disabled={deleting}
        aria-label={`${restaurant.restaurantName} 삭제`}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 6 6 18" />
          <path d="m6 6 12 12" />
        </svg>
      </Button>

      <a
        href={youtubeUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`${restaurant.restaurantName} - YouTube에서 보기`}
      >
        {restaurant.thumbnailUrl ? (
          <div className="relative aspect-video w-full overflow-hidden">
            <img
              src={restaurant.thumbnailUrl}
              alt=""
              width={480}
              height={270}
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-200 hover:scale-105"
            />
          </div>
        ) : (
          <div className="flex aspect-video w-full items-center justify-center bg-muted">
            <span className="text-sm text-muted-foreground">썸네일 없음</span>
          </div>
        )}
      </a>
      <CardContent className="p-4">
        <h3 className="truncate text-lg font-semibold leading-tight" title={restaurant.restaurantName}>
          {restaurant.restaurantName}
        </h3>

        <div className="mt-2 flex min-w-0 flex-wrap gap-1.5">
          {restaurant.region && restaurant.region !== "미확인" && (
            <Badge variant="secondary">{restaurant.region}</Badge>
          )}
          {restaurant.foodType && restaurant.foodType !== "미확인" && (
            <Badge variant="outline">{restaurant.foodType}</Badge>
          )}
        </div>

        <p className="mt-2 min-w-0 truncate text-sm text-muted-foreground" title={restaurant.videoTitle}>
          {restaurant.channelName}
        </p>

        {restaurant.publishedAt && (
          <p className="mt-1 text-xs text-muted-foreground">
            {new Intl.DateTimeFormat("ko-KR", {
              year: "numeric",
              month: "long",
              day: "numeric",
            }).format(new Date(restaurant.publishedAt))}
          </p>
        )}

        <a
          href={youtubeUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 inline-block text-xs text-primary hover:text-primary/80 hover:underline"
        >
          YouTube에서 보기 →
        </a>
      </CardContent>
    </Card>
  )
}
