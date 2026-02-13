import { prisma } from "./prisma"
import {
  fetchLikedVideoIds,
  fetchPlaylistVideoIds,
  fetchVideoDetails,
  fetchTopComment,
} from "./youtube"
import { classifyVideos, extractRestaurantInfo } from "./gemini"

const FREE_VIDEO_LIMIT = parseInt(process.env.FREE_VIDEO_LIMIT ?? "50")

export async function runScanPipeline(
  jobId: string,
  userId: string,
  accessToken: string,
  sourceType: "liked" | "playlist",
  playlistId?: string
) {
  try {
    // Step 1: 영상 수집
    console.log(`[스캔 ${jobId}] Step 1: 영상 ID 수집 시작 (source: ${sourceType})`)
    await prisma.scanJob.update({
      where: { id: jobId },
      data: { status: "collecting" },
    })

    const maxVideos = FREE_VIDEO_LIMIT
    let videoIds: string[]

    if (sourceType === "liked") {
      videoIds = await fetchLikedVideoIds(accessToken, maxVideos)
    } else {
      videoIds = await fetchPlaylistVideoIds(
        accessToken,
        playlistId!,
        maxVideos
      )
    }

    console.log(`[스캔 ${jobId}] Step 1 완료: ${videoIds.length}개 영상 ID 수집`)

    if (videoIds.length === 0) {
      await prisma.scanJob.update({
        where: { id: jobId },
        data: { status: "completed", totalVideos: 0, restaurantCount: 0 },
      })
      return
    }

    // Step 2: 영상 상세정보 수집
    console.log(`[스캔 ${jobId}] Step 2: 영상 상세정보 수집 중...`)
    const videos = await fetchVideoDetails(accessToken, videoIds)

    await prisma.scanJob.update({
      where: { id: jobId },
      data: { totalVideos: videos.length },
    })
    console.log(`[스캔 ${jobId}] Step 2 완료: ${videos.length}개 영상 정보 수집`)

    // Step 3: AI 1단계 - 맛집 영상 필터링
    console.log(`[스캔 ${jobId}] Step 3: Gemini 맛집 분류 시작`)
    await prisma.scanJob.update({
      where: { id: jobId },
      data: { status: "filtering" },
    })

    const classificationResults = await classifyVideos(
      videos.map((v) => ({
        id: v.id,
        title: v.title,
        description: v.description,
      }))
    )

    const restaurantVideoIds = new Set(
      classificationResults.filter((r) => r.isRestaurant).map((r) => r.videoId)
    )

    const restaurantVideos = videos.filter((v) => restaurantVideoIds.has(v.id))
    console.log(`[스캔 ${jobId}] Step 3 완료: ${videos.length}개 중 ${restaurantVideos.length}개 맛집 영상 감지`)

    await prisma.scanJob.update({
      where: { id: jobId },
      data: { filteredCount: restaurantVideos.length },
    })

    if (restaurantVideos.length === 0) {
      console.log(`[스캔 ${jobId}] 맛집 영상 0개 → 스캔 완료`)
      await prisma.scanJob.update({
        where: { id: jobId },
        data: { status: "completed", restaurantCount: 0 },
      })
      return
    }

    // Step 4: 맛집 영상의 상단 댓글 수집
    console.log(`[스캔 ${jobId}] Step 4: ${restaurantVideos.length}개 영상 댓글 수집 시작`)
    await prisma.scanJob.update({
      where: { id: jobId },
      data: { status: "extracting" },
    })

    const videosWithComments = []
    for (const v of restaurantVideos) {
      const topComment = await fetchTopComment(accessToken, v.id)
      videosWithComments.push({ ...v, topComment })
    }
    console.log(`[스캔 ${jobId}] Step 4 완료: 댓글 수집 완료`)

    // Step 5: AI 2단계 - 음식점 정보 추출
    console.log(`[스캔 ${jobId}] Step 5: Gemini 맛집 정보 추출 시작`)
    const extractionResults = await extractRestaurantInfo(
      videosWithComments.map((v) => ({
        id: v.id,
        title: v.title,
        description: v.description,
        topComment: v.topComment,
      }))
    )

    // Step 6: DB 저장
    const restaurantRecords = extractionResults.flatMap((er) => {
      const video = restaurantVideos.find((v) => v.id === er.videoId)
      if (!video) return []

      return er.restaurants.map((r) => ({
        userId,
        jobId,
        videoId: er.videoId,
        videoTitle: video.title,
        thumbnailUrl: video.thumbnailUrl,
        channelName: video.channelTitle,
        restaurantName: r.name || "미확인 맛집",
        region: r.region || "미확인",
        foodType: r.foodType || "미확인",
        publishedAt: new Date(video.publishedAt),
      }))
    })

    console.log(`[스캔 ${jobId}] Step 6: ${restaurantRecords.length}개 맛집 DB 저장`)

    if (restaurantRecords.length > 0) {
      await prisma.restaurant.createMany({
        data: restaurantRecords,
        skipDuplicates: true,
      })
    }

    // Step 7: 완료
    await prisma.scanJob.update({
      where: { id: jobId },
      data: {
        status: "completed",
        restaurantCount: restaurantRecords.length,
      },
    })
    console.log(`[스캔 ${jobId}] 파이프라인 완료! 총 ${restaurantRecords.length}개 맛집 저장됨`)
  } catch (error) {
    console.error(`[스캔 ${jobId}] 파이프라인 에러:`, error)
    await prisma.scanJob.update({
      where: { id: jobId },
      data: {
        status: "failed",
        errorMessage:
          error instanceof Error ? error.message : "알 수 없는 오류",
      },
    })
  }
}
