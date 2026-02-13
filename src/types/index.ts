// YouTube API 타입
export interface YouTubeVideo {
  id: string
  title: string
  description: string
  thumbnailUrl: string
  channelTitle: string
  publishedAt: string
}

export interface YouTubePlaylist {
  id: string
  title: string
  itemCount: number
  thumbnailUrl: string
}

// 스캔 작업 타입
export interface ScanJobStatus {
  id: string
  status:
    | "pending"
    | "collecting"
    | "filtering"
    | "extracting"
    | "completed"
    | "failed"
  totalVideos: number
  filteredCount: number
  restaurantCount: number
  errorMessage?: string
}

// 맛집 카드 타입
export interface RestaurantCard {
  id: string
  videoId: string
  videoTitle: string
  thumbnailUrl: string | null
  channelName: string | null
  restaurantName: string
  region: string | null
  foodType: string | null
  publishedAt: string | null
}

// Gemini AI 응답 타입
export interface ClassificationResult {
  videoId: string
  isRestaurant: boolean
}

export interface ExtractionResult {
  videoId: string
  restaurants: {
    name: string
    region: string
    foodType: string
  }[]
}
