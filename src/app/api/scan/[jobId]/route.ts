import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 })
  }

  const { jobId } = await params

  const job = await prisma.scanJob.findUnique({
    where: { id: jobId },
    select: {
      id: true,
      status: true,
      totalVideos: true,
      filteredCount: true,
      restaurantCount: true,
      errorMessage: true,
    },
  })

  if (!job) {
    return NextResponse.json(
      { error: "스캔 작업을 찾을 수 없습니다." },
      { status: 404 }
    )
  }

  return NextResponse.json(job)
}
