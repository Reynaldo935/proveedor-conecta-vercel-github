/**
 * ProveedorConecta Nicaragua — Server-Side Auth Helpers
 *
 * 🔐 Dual auth: Clerk (primary) + legacy cookie (fallback).
 * Existing API routes that call getAuthenticatedUserId() keep working.
 */

import { auth } from '@clerk/nextjs/server'
import { cookies } from 'next/headers'
import { db } from './db'

/**
 * Get the authenticated user ID.
 * Tries Clerk first, falls back to legacy pc_user_id cookie.
 */
export async function getAuthenticatedUserId(_request?: Request): Promise<string | null> {
  try {
    // ── Clerk (primary) ──────────────────────────────────────────
    const { userId: clerkUserId } = await auth()
    if (clerkUserId) {
      const user = await db.user.findUnique({
        where: { clerkId: clerkUserId },
        select: { id: true },
      })
      if (user) return user.id
    }
  } catch { /* Clerk not available */ }

  // ── Legacy cookie (fallback) ───────────────────────────────────
  try {
    const cookieStore = await cookies()
    const cookieUserId = cookieStore.get('pc_user_id')?.value
    if (cookieUserId) {
      const user = await db.user.findUnique({ where: { id: cookieUserId }, select: { id: true } })
      if (user) return cookieUserId
    }
  } catch { /* Cookie reading failed */ }

  return null
}

/**
 * Get the full authenticated user object (without password).
 */
export async function getAuthenticatedUser(_request?: Request) {
  const userId = await getAuthenticatedUserId()
  if (!userId) return null

  const user = await db.user.findUnique({
    where: { id: userId },
    include: { businessProfile: true },
  })

  if (!user) return null
  const { password: _, ...safeUser } = user
  return safeUser
}

/**
 * Check if the authenticated user is the admin (rey7214935@gmail.com).
 */
export async function isAdmin(): Promise<boolean> {
  const user = await getAuthenticatedUser()
  return user?.email === 'rey7214935@gmail.com'
}

// ─── Legacy Cookie Helpers ──────────────────────────────────────────

export async function setAuthCookie(userId: string) {
  const cookieStore = await cookies()
  const isProduction = process.env.NODE_ENV === 'production'
  cookieStore.set('pc_user_id', userId, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  })
}

export async function clearAuthCookie() {
  const cookieStore = await cookies()
  cookieStore.delete('pc_user_id')
}

// ─── Password Hashing (legacy) ─────────────────────────────────────

export async function hashPassword(password: string): Promise<string> {
  const bcrypt = await import('bcryptjs')
  return bcrypt.hash(password, 12)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const bcrypt = await import('bcryptjs')
  return bcrypt.compare(password, hash)
}
