import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { SourceSelector } from "@/components/scan/source-selector"

export default async function DashboardPage() {
  const session = await auth()
  if (!session) redirect("/")

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-2xl font-bold">맛집 찾기</h1>
      <p className="mt-2 text-muted-foreground">
        어디서 맛집 영상을 찾을까요?
      </p>
      <div className="mt-8">
        <SourceSelector />
      </div>
    </div>
  )
}
