import { NextResponse } from "next/server"
import { after } from "next/server"
import { auth, getUserAccessToken } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { runScanPipeline } from "@/lib/scanner"

export const maxDuration = 60

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 })
  }

  const body = await request.json()
  const { sourceType, playlistId } = body as {
    sourceType: "liked" | "playlist"
    playlistId?: string
  }

  if (!sourceType || !["liked", "playlist"].includes(sourceType)) {
    return NextResponse.json(
      { error: "올바른 소스 타입을 선택해주세요." },
      { status: 400 }
    )
  }

  if (sourceType === "playlist" && !playlistId) {
    return NextResponse.json(
      { error: "재생목록 ID가 필요합니다." },
      { status: 400 }
    )
  }

  const accessToken = await getUserAccessToken(session.user.id)
  if (!accessToken) {
    return NextResponse.json(
      { error: "YouTube 접근 토큰이 없습니다. 다시 로그인해주세요." },
      { status: 401 }
    )
  }

  // 진행 중인 스캔이 있으면 중복 방지
  const activeJob = await prisma.scanJob.findFirst({
    where: {
      userId: session.user.id,
      status: { in: ["pending", "collecting", "filtering", "extracting"] },
    },
  })
  if (activeJob) {
    return NextResponse.json(
      { error: "이미 진행 중인 스캔이 있습니다.", jobId: activeJob.id },
      { status: 409 }
    )
  }

  // 스캔 작업 생성
  const job = await prisma.scanJob.create({
    data: {
      userId: session.user.id,
      sourceType,
      playlistId: playlistId ?? null,
    },
  })

  // 비동기로 스캔 파이프라인 실행 (응답 전송 후 계속 실행)
  after(async () => {
    await runScanPipeline(
      job.id,
      session.user.id,
      accessToken,
      sourceType,
      playlistId
    )
  })

  return NextResponse.json({ jobId: job.id })
}
