'use server'

import { cookies } from 'next/headers'
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db/client'
import { adminUsers } from '@/lib/db/schema'
import { verifyPassword } from '@/lib/auth/password'
import { createSessionToken, SESSION_COOKIE_NAME } from '@/lib/auth/session'

export async function loginAdmin(email: string, password: string): Promise<{ ok: boolean; error?: string }> {
  const [user] = await db.select().from(adminUsers).where(eq(adminUsers.email, email))

  if (!user || !verifyPassword(password, user.passwordHash)) {
    return { ok: false, error: 'Email atau password salah.' }
  }

  const token = await createSessionToken(user.id, process.env.SESSION_SECRET!)
  const cookieStore = await cookies()
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  })

  return { ok: true }
}

export async function logoutAdmin() {
  const cookieStore = await cookies()
  cookieStore.delete(SESSION_COOKIE_NAME)
}
