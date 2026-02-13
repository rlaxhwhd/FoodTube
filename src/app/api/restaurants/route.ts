import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const jobId = searchParams.get("jobId")

  const where: { userId: string; jobId?: string } = {
    userId: session.user.id,
  }
  if (jobId) where.jobId = jobId

  const restaurants = await prisma.restaurant.findMany({
    where,
    orderBy: { publishedAt: "desc" },
  })

  return NextResponse.json({ restaurants })
}
