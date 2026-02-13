import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { LoginButton } from "@/components/auth/login-button"

export default async function Home() {
  const session = await auth()
  if (session) redirect("/dashboard")

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] flex-col items-center justify-center px-4">
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          YouTube 좋아요에 숨겨진
          <br />
          <span className="text-primary">맛집</span>을 찾아드려요
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          좋아요 누른 영상, 재생목록 속 맛집 영상을 AI가 자동으로 찾아서
          <br className="hidden sm:block" />
          음식점 이름, 지역, 음식 종류까지 정리해드립니다.
        </p>

        <div className="mt-8">
          <LoginButton />
        </div>

        <ol className="mt-16 grid gap-8 text-left sm:grid-cols-3" style={{ listStyle: "none", padding: 0 }}>
          <li className="rounded-lg border p-6 transition-shadow duration-200 hover:shadow-sm">
            <div aria-hidden="true" className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-primary text-lg font-bold text-primary-foreground">
              1
            </div>
            <h3 className="font-semibold">Google 로그인</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              YouTube 읽기 권한만 사용합니다. 영상을 수정하거나 삭제하지 않습니다.
            </p>
          </li>
          <li className="rounded-lg border p-6 transition-shadow duration-200 hover:shadow-sm">
            <div aria-hidden="true" className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-primary text-lg font-bold text-primary-foreground">
              2
            </div>
            <h3 className="font-semibold">AI가 분석</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              좋아요 영상 또는 재생목록에서 맛집 영상만 골라 음식점 정보를 추출합니다.
            </p>
          </li>
          <li className="rounded-lg border p-6 transition-shadow duration-200 hover:shadow-sm">
            <div aria-hidden="true" className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-primary text-lg font-bold text-primary-foreground">
              3
            </div>
            <h3 className="font-semibold">맛집 리스트 완성</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              음식점 이름, 지역, 음식 종류가 정리된 나만의 맛집 리스트를 확인하세요.
            </p>
          </li>
        </ol>
      </div>
    </div>
  )
}
