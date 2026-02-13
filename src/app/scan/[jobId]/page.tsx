"use client"

import { use } from "react"
import { useScanStatus } from "@/hooks/use-scan"
import { ScanProgress } from "@/components/scan/scan-progress"
import { Skeleton } from "@/components/ui/skeleton"

export default function ScanPage({
  params,
}: {
  params: Promise<{ jobId: string }>
}) {
  const { jobId } = use(params)
  const { status } = useScanStatus(jobId)

  return (
    <div className="mx-auto max-w-lg px-4 py-12">
      {status ? (
        <ScanProgress status={status} />
      ) : (
        <div className="space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-32 w-full" />
        </div>
      )}
    </div>
  )
}
