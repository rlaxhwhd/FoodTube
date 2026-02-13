import { NextResponse } from "next/server"
import { auth, getUserAccessToken } from "@/lib/auth"
import { fetchUserPlaylists } from "@/lib/youtube"

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 })
  }

  const accessToken = await getUserAccessToken(session.user.id)
  if (!accessToken) {
    return NextResponse.json(
      { error: "YouTube 접근 토큰이 없습니다. 다시 로그인해주세요." },
      { status: 401 }
    )
  }

  try {
    const playlists = await fetchUserPlaylists(accessToken)
    return NextResponse.json({ playlists })
  } catch (error) {
    console.error("Playlists fetch error:", error)
    return NextResponse.json(
      { error: "재생목록을 불러오지 못했습니다." },
      { status: 500 }
    )
  }
}
