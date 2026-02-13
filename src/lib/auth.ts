import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "./prisma"

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    Google({
      authorization: {
        params: {
          scope:
            "openid email profile https://www.googleapis.com/auth/youtube.readonly",
          access_type: "offline",
          prompt: "consent",
        },
      },
    }),
  ],
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, account }) {
      if (account) {
        token.accessToken = account.access_token
        token.refreshToken = account.refresh_token
        token.expiresAt = account.expires_at
      }
      return token
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken as string
      session.user.id = token.sub as string
      return session
    },
  },
  pages: {
    signIn: "/",
  },
})

/** 유저의 YouTube access_token을 DB에서 가져오고, 만료 시 갱신 */
export async function getUserAccessToken(
  userId: string
): Promise<string | null> {
  const account = await prisma.account.findFirst({
    where: { userId, provider: "google" },
    select: {
      access_token: true,
      refresh_token: true,
      expires_at: true,
      id: true,
    },
  })

  if (!account?.access_token) return null

  // 토큰 만료 확인 (5분 여유: 만료 5분 전에 갱신)
  if (account.expires_at && account.expires_at * 1000 < Date.now() + 300000) {
    if (!account.refresh_token) return null

    try {
      const refreshed = await refreshGoogleToken(account.refresh_token)
      await prisma.account.update({
        where: { id: account.id },
        data: {
          access_token: refreshed.access_token,
          expires_at: refreshed.expires_at,
        },
      })
      return refreshed.access_token
    } catch {
      return null
    }
  }

  return account.access_token
}

async function refreshGoogleToken(refreshToken: string) {
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.AUTH_GOOGLE_ID!,
      client_secret: process.env.AUTH_GOOGLE_SECRET!,
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
  })

  if (!response.ok) {
    throw new Error(`Token refresh failed: ${response.status}`)
  }

  const data = await response.json()
  return {
    access_token: data.access_token as string,
    expires_at: Math.floor(Date.now() / 1000 + data.expires_in),
  }
}
