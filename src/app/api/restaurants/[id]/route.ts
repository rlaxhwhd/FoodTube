import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 })
  }

  const { id } = await params

  const restaurant = await prisma.restaurant.findUnique({ where: { id } })
  if (!restaurant || restaurant.userId !== session.user.id) {
    return NextResponse.json({ error: "맛집을 찾을 수 없습니다." }, { status: 404 })
  }

  await prisma.restaurant.delete({ where: { id } })

  return NextResponse.json({ success: true })
}
