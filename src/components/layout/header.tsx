"use client"

import Link from "next/link"
import { useSession, signOut } from "next-auth/react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export function Header() {
  const { data: session } = useSession()

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 hover:opacity-80">
          <span className="text-xl font-bold">맛플리</span>
        </Link>

        {session ? (
          <div className="flex items-center gap-4">
            <nav aria-label="메인 네비게이션" className="hidden gap-4 sm:flex">
              <Link
                href="/dashboard"
                className="text-sm font-medium text-muted-foreground transition-colors duration-150 hover:text-foreground"
              >
                대시보드
              </Link>
              <Link
                href="/restaurants"
                className="text-sm font-medium text-muted-foreground transition-colors duration-150 hover:text-foreground"
              >
                내 맛집
              </Link>
            </nav>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="relative h-8 w-8 rounded-full"
                  aria-label="사용자 메뉴"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage
                      src={session.user.image ?? undefined}
                      alt=""
                    />
                    <AvatarFallback>
                      {session.user.name?.charAt(0) ?? "U"}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <div className="px-2 py-1.5">
                  <p className="text-sm font-medium">{session.user.name}</p>
                  <p className="text-xs text-muted-foreground">{session.user.email}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="sm:hidden" asChild>
                  <Link href="/dashboard">대시보드</Link>
                </DropdownMenuItem>
                <DropdownMenuItem className="sm:hidden" asChild>
                  <Link href="/restaurants">내 맛집</Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => signOut({ callbackUrl: "/" })}>
                  로그아웃
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ) : (
          <Button variant="ghost" size="sm" asChild>
            <Link href="/">로그인</Link>
          </Button>
        )}
      </div>
    </header>
  )
}
