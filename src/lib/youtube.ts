import type { YouTubeVideo, YouTubePlaylist } from "@/types"

const YT_API_BASE = "https://www.googleapis.com/youtube/v3"

async function ytFetch(
  path: string,
  accessToken: string,
  params: Record<string, string>
) {
  const url = new URL(`${YT_API_BASE}/${path}`)
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${accessToken}` },
  })

  if (!res.ok) {
    const body = await res.text()
    if (res.status === 401) {
      throw new Error("YouTube 토큰이 만료되었습니다. 다시 로그인해주세요.")
    }
    if (res.status === 403) {
      throw new Error("YouTube API 할당량이 초과되었거나 권한이 없습니다.")
    }
    throw new Error(`YouTube API error ${res.status}: ${body}`)
  }

  return res.json()
}

/** 좋아요 누른 영상 ID 목록 수집 (playlistId "LL" 사용) */
export async function fetchLikedVideoIds(
  accessToken: string,
  maxResults: number
): Promise<string[]> {
  return fetchPlaylistVideoIds(accessToken, "LL", maxResults)
}

/** 재생목록의 영상 ID 목록 수집 */
export async function fetchPlaylistVideoIds(
  accessToken: string,
  playlistId: string,
  maxResults: number
): Promise<string[]> {
  const videoIds: string[] = []
  let pageToken: string | undefined

  while (videoIds.length < maxResults) {
    const params: Record<string, string> = {
      part: "contentDetails",
      playlistId,
      maxResults: String(Math.min(50, maxResults - videoIds.length)),
    }
    if (pageToken) params.pageToken = pageToken

    const data = await ytFetch("playlistItems", accessToken, params)

    for (const item of data.items ?? []) {
      const vid = item.contentDetails?.videoId
      if (vid) videoIds.push(vid)
    }

    pageToken = data.nextPageToken
    if (!pageToken) break
  }

  return videoIds.slice(0, maxResults)
}

/** 사용자 재생목록 목록 조회 */
export async function fetchUserPlaylists(
  accessToken: string
): Promise<YouTubePlaylist[]> {
  const data = await ytFetch("playlists", accessToken, {
    part: "snippet,contentDetails",
    mine: "true",
    maxResults: "50",
  })

  return (data.items ?? []).map(
    (item: {
      id: string
      snippet: { title: string; thumbnails?: { medium?: { url: string } } }
      contentDetails: { itemCount: number }
    }) => ({
      id: item.id,
      title: item.snippet.title,
      itemCount: item.contentDetails.itemCount,
      thumbnailUrl: item.snippet.thumbnails?.medium?.url ?? "",
    })
  )
}

/** 영상 상세 정보 배치 조회 (50개씩) */
export async function fetchVideoDetails(
  accessToken: string,
  videoIds: string[]
): Promise<YouTubeVideo[]> {
  const videos: YouTubeVideo[] = []

  for (let i = 0; i < videoIds.length; i += 50) {
    const batch = videoIds.slice(i, i + 50)
    const data = await ytFetch("videos", accessToken, {
      part: "snippet",
      id: batch.join(","),
    })

    for (const item of data.items ?? []) {
      videos.push({
        id: item.id,
        title: item.snippet.title,
        description: item.snippet.description ?? "",
        thumbnailUrl:
          item.snippet.thumbnails?.high?.url ??
          item.snippet.thumbnails?.medium?.url ??
          "",
        channelTitle: item.snippet.channelTitle,
        publishedAt: item.snippet.publishedAt,
      })
    }
  }

  return videos
}

/** 영상의 인기 댓글 1개 수집 */
export async function fetchTopComment(
  accessToken: string,
  videoId: string
): Promise<string | null> {
  try {
    const data = await ytFetch("commentThreads", accessToken, {
      part: "snippet",
      videoId,
      order: "relevance",
      maxResults: "1",
    })

    const comment =
      data.items?.[0]?.snippet?.topLevelComment?.snippet?.textDisplay
    return comment ?? null
  } catch {
    // 댓글 비활성화 등 → null 반환
    return null
  }
}
