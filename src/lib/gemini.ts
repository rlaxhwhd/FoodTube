import OpenAI from "openai"
import type { ClassificationResult, ExtractionResult } from "@/types"

const groq = new OpenAI({
  apiKey: process.env.GROQ_API_KEY!,
  baseURL: "https://api.groq.com/openai/v1",
})

const MODEL = "llama-3.1-8b-instant" // Groq 무료, 빠름

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

/** 지수 백오프로 재시도 대기 시간 계산 */
function getRetryDelay(attempt: number): number {
  const base = 2000
  const delay = base * Math.pow(2, attempt)
  const jitter = Math.random() * 1000
  return Math.min(delay + jitter, 60000)
}

/** Groq API 호출 + 지수 백오프 재시도 (최대 3회) */
async function callWithRetry(
  systemPrompt: string,
  userPrompt: string,
  maxRetries = 3
): Promise<string> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await groq.chat.completions.create({
        model: MODEL,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.1,
      })
      return response.choices[0].message.content ?? "{}"
    } catch (err) {
      const errMsg = String(err)
      const is429 = errMsg.includes("429") || errMsg.includes("rate_limit")
      const is500 = errMsg.includes("500") || errMsg.includes("503")

      if (!is429 && !is500) throw err
      if (attempt === maxRetries) throw err

      const delay = getRetryDelay(attempt)
      console.log(`Groq ${is429 ? "429" : "5xx"} - ${Math.round(delay / 1000)}s 대기 후 재시도 (${attempt + 1}/${maxRetries})`)
      await sleep(delay)
    }
  }
  throw new Error("Unreachable")
}

/** 1단계: 맛집 영상 분류 */
export async function classifyVideos(
  videos: { id: string; title: string; description: string }[]
): Promise<ClassificationResult[]> {
  const BATCH_SIZE = 30
  const allResults: ClassificationResult[] = []

  const systemPrompt = `당신은 한국 맛집/음식점 영상 분류 전문가입니다.
YouTube 영상 목록을 받으면 각 영상이 실제 음식점/카페/맛집을 방문하거나 리뷰하는 영상인지 판단합니다.

분류 기준:
- 특정 음식점/카페/술집을 방문하거나 리뷰하는 영상 → true
- 배달 음식 리뷰이지만 특정 가게명이 나오는 영상 → true
- 맛집 추천 영상 (여러 가게 소개) → true
- 특정 가게의 먹방 영상 → true
- 집에서 요리하는 영상 → false
- 음식과 무관한 영상 → false
- 편의점/마트 제품 리뷰 → false
- 레시피 영상 → false
- 음식 관련이지만 특정 가게가 없는 영상 → false

반드시 JSON 형식으로만 응답: {"results": [{"videoId": "영상ID", "isRestaurant": true}]}`

  for (let i = 0; i < videos.length; i += BATCH_SIZE) {
    if (i > 0) await sleep(2000)

    const batch = videos.slice(i, i + BATCH_SIZE)
    const batchNum = Math.floor(i / BATCH_SIZE) + 1
    const totalBatches = Math.ceil(videos.length / BATCH_SIZE)

    const videoList = batch
      .map((v) => `[${v.id}] 제목: ${v.title}\n설명: ${v.description.slice(0, 200)}`)
      .join("\n---\n")

    try {
      console.log(`[분류] 배치 ${batchNum}/${totalBatches} (${batch.length}개 영상) 처리 중...`)
      const text = await callWithRetry(systemPrompt, `영상 목록:\n${videoList}`)
      const parsed = JSON.parse(text)
      const results: ClassificationResult[] = parsed.results ?? []
      console.log(`[분류] 배치 ${batchNum} 완료 - 맛집 영상: ${results.filter((r) => r.isRestaurant).length}/${batch.length}`)
      allResults.push(...results)
    } catch (err) {
      console.error(`[분류] 배치 ${batchNum} 실패:`, err instanceof Error ? err.message : err)
      batch.forEach((v) =>
        allResults.push({ videoId: v.id, isRestaurant: false })
      )
    }
  }

  return allResults
}

/** 2단계: 음식점 정보 추출 */
export async function extractRestaurantInfo(
  videos: {
    id: string
    title: string
    description: string
    topComment?: string | null
  }[]
): Promise<ExtractionResult[]> {
  const BATCH_SIZE = 10
  const allResults: ExtractionResult[] = []

  const systemPrompt = `Role: 너는 유튜브 영상 데이터를 분석하여 정확한 맛집 정보를 추출하는 데이터 엔지니어이자 미식가야.

Task: 각 영상의 [영상 제목]과 [고정 댓글]을 분석하여 식당의 이름, 음식 종류, 지역을 추출해.

Constraint:
- 영상 제목에는 "역대급", "인생 맛집" 같은 수식어가 많으니 무시하고, 고정 댓글에 명시된 실제 상호명을 우선시할 것.
- 만약 고정 댓글에 식당 정보가 없다면 제목에서 추론할 것.
- 정보를 찾을 수 없는 항목은 "미확인"으로 표시할 것.
- 하나의 영상에 여러 식당이 등장할 수 있으므로 배열로 반환할 것.

반드시 JSON 형식으로만 응답: {"results": [{"videoId": "영상ID", "restaurants": [{"name": "식당명", "region": "지역", "foodType": "음식종류"}]}]}`

  for (let i = 0; i < videos.length; i += BATCH_SIZE) {
    if (i > 0) await sleep(2000)

    const batch = videos.slice(i, i + BATCH_SIZE)
    const batchNum = Math.floor(i / BATCH_SIZE) + 1
    const totalBatches = Math.ceil(videos.length / BATCH_SIZE)

    const videoList = batch
      .map((v) => {
        let text = `[${v.id}]\n영상 제목: ${v.title}`
        if (v.topComment) text += `\n고정 댓글: ${v.topComment.slice(0, 300)}`
        else text += `\n고정 댓글: (없음)`
        return text
      })
      .join("\n---\n")

    try {
      console.log(`[추출] 배치 ${batchNum}/${totalBatches} (${batch.length}개 영상) 처리 중...`)
      const text = await callWithRetry(systemPrompt, `영상 목록:\n${videoList}`)
      const parsed = JSON.parse(text)
      const results: ExtractionResult[] = parsed.results ?? []
      const totalRestaurants = results.reduce((sum, r) => sum + r.restaurants.length, 0)
      console.log(`[추출] 배치 ${batchNum} 완료 - 추출된 맛집: ${totalRestaurants}개`)
      allResults.push(...results)
    } catch (err) {
      console.error(`[추출] 배치 ${batchNum} 실패:`, err instanceof Error ? err.message : err)
      batch.forEach((v) =>
        allResults.push({
          videoId: v.id,
          restaurants: [
            { name: "미확인 맛집", region: "미확인", foodType: "미확인" },
          ],
        })
      )
    }
  }

  return allResults
}
