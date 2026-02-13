"use client"

import { useEffect, useState } from "react"
import type { ScanJobStatus } from "@/types"

export function useScanStatus(jobId: string) {
  const [status, setStatus] = useState<ScanJobStatus | null>(null)
  const [isPolling, setIsPolling] = useState(true)

  useEffect(() => {
    if (!isPolling) return

    let active = true

    const poll = async () => {
      try {
        const res = await fetch(`/api/scan/${jobId}`)
        if (!res.ok) return
        const data: ScanJobStatus = await res.json()
        if (active) {
          setStatus(data)
          if (data.status === "completed" || data.status === "failed") {
            setIsPolling(false)
          }
        }
      } catch {
        // 네트워크 오류 시 폴링 계속
      }
    }

    poll()
    const interval = setInterval(poll, 2500)

    return () => {
      active = false
      clearInterval(interval)
    }
  }, [jobId, isPolling])

  return { status, isPolling }
}
