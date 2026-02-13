"use client"

import { Suspense, useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { RestaurantCard } from "@/components/restaurant/restaurant-card"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import type { RestaurantCard as RestaurantCardType } from "@/types"

function RestaurantsSkeleton() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <Skeleton className="mb-2 h-8 w-48" />
      <Skeleton className="mb-6 h-4 w-32" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="overflow-hidden rounded-lg border">
            <Skeleton className="aspect-video w-full" />
            <div className="space-y-2 p-4">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-3 w-1/3" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function RestaurantsPage() {
  return (
    <Suspense fallback={<RestaurantsSkeleton />}>
      <RestaurantsContent />
    </Suspense>
  )
}

function RestaurantsContent() {
  const searchParams = useSearchParams()
  const jobId = searchParams.get("jobId")

  const [restaurants, setRestaurants] = useState<RestaurantCardType[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const params = new URLSearchParams()
    if (jobId) params.set("jobId", jobId)
    const url = `/api/restaurants${params.toString() ? `?${params}` : ""}`

    fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error("맛집 목록을 불러올 수 없습니다.")
        return res.json()
      })
      .then((data) => setRestaurants(data.restaurants ?? []))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [jobId])

  if (loading) {
    return <RestaurantsSkeleton />
  }

  if (error) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-12">
        <div className="flex flex-col items-center py-20 text-center">
          <p role="alert" className="text-sm text-destructive">{error}</p>
          <Button className="mt-4" variant="outline" onClick={() => window.location.reload()}>
            다시 시도하기
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">내 맛집 리스트</h1>
          <p className="text-sm tabular-nums text-muted-foreground">
            총 {new Intl.NumberFormat("ko-KR").format(restaurants.length)}개 맛집을 찾았어요
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/dashboard">새 스캔</Link>
        </Button>
      </div>

      {restaurants.length === 0 ? (
        <div className="flex flex-col items-center py-20 text-center">
          <div aria-hidden="true" className="mb-4 text-5xl">
            🍽
          </div>
          <p className="text-lg font-medium text-muted-foreground">
            아직 맛집이 없어요
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            스캔을 시작해서 맛집을 찾아보세요!
          </p>
          <Button className="mt-6" asChild>
            <Link href="/dashboard">스캔 시작하기</Link>
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {restaurants.map((r) => (
            <RestaurantCard
              key={r.id}
              restaurant={r}
              onDelete={(id) => setRestaurants((prev) => prev.filter((r) => r.id !== id))}
            />
          ))}
        </div>
      )}
    </div>
  )
}
