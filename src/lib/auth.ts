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
 * Tries Clerk first, auto-creates DB record if needed, falls back to cookie.
 * RESILIENT: If Clerk authenticates but DB is down, still returns a valid ID.
 */
export async function getAuthenticatedUserId(_request?: Request): Promise<string | null> {
  try {
    // ── Clerk (primary) ──────────────────────────────────────────
    const { userId: clerkUserId } = await auth()
    if (clerkUserId) {
      const { currentUser } = await import('@clerk/nextjs/server')
      const clerkUser = await currentUser()
      const email = clerkUser?.emailAddresses[0]?.emailAddress || ''

      // Try to find user by email in DB
      let user: { id: string; email: string } | null = null
      try {
        user = await db.user.findFirst({
          where: { email },
          select: { id: true, email: true },
        })
      } catch {
        // DB unavailable — fall back to in-memory/cookie auth
        console.warn('[Auth] DB unavailable for Clerk user lookup, using cookie fallback')
      }

      if (!user && email) {
        // Auto-create user on first Clerk login
        const name = [clerkUser?.firstName, clerkUser?.lastName].filter(Boolean).join(' ') || email
        try {
          user = await db.user.create({
            data: {
              email,
              name,
              avatar: clerkUser?.imageUrl || '',
              role: email === 'rey7214935@gmail.com' ? 'ADMIN' : 'BUYER',
              emailVerified: true,
            },
            select: { id: true, email: true },
          })
        } catch {
          // Retry find (race condition) or DB down
          try {
            user = await db.user.findFirst({ where: { email }, select: { id: true, email: true } })
          } catch {
            // DB is down — use clerkUserId directly as fallback
            console.warn('[Auth] DB create/find failed, using clerkUserId as fallback')
          }
        }
      }

      if (user) return user.id

      // Last resort: if Clerk auth worked but DB is completely down,
      // return the Clerk user ID directly so authenticated actions work
      if (clerkUserId) {
        console.warn('[Auth] Using raw clerkUserId as fallback (DB down)')
        return 'clerk_' + clerkUserId
      }
    }
  } catch {
    // Clerk not available — will try cookie fallback
    console.warn('[Auth] Clerk auth unavailable, trying cookie fallback')
  }

  // ── Legacy cookie (fallback) ───────────────────────────────────
  try {
    const cookieStore = await cookies()
    const cookieUserId = cookieStore.get('pc_user_id')?.value
    if (cookieUserId) {
      try {
        const user = await db.user.findUnique({ where: { id: cookieUserId }, select: { id: true } })
        if (user) return cookieUserId
      } catch {
        // DB down — but we have a cookie, trust it
        return cookieUserId
      }
    }
  } catch { /* Cookie reading failed */ }

  return null
}

/**
 * Get the full authenticated user object (without password).
 * RESILIENT: Returns minimal user from Clerk if DB is down.
 */
export async function getAuthenticatedUser(_request?: Request) {
  try {
    const userId = await getAuthenticatedUserId()
    if (!userId) return null

    // Try DB first
    try {
      const user = await db.user.findUnique({
        where: { id: userId },
        include: { businessProfile: true },
      })
      if (user) {
        const { password: _, ...safeUser } = user
        return safeUser
      }
    } catch {
      console.warn('[Auth] DB unavailable for getAuthenticatedUser, building minimal user')
    }

    // DB DOWN — build minimal user from Clerk session
    try {
      const { currentUser } = await import('@clerk/nextjs/server')
      const clerkUser = await currentUser()
      if (clerkUser) {
        const email = clerkUser.emailAddresses[0]?.emailAddress || ''
        return {
          id: userId,
          email,
          name: [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(' ') || email || 'Usuario',
          role: email === 'rey7214935@gmail.com' ? 'ADMIN' : 'BUYER',
          avatar: clerkUser.imageUrl || '',
          coverPhoto: '',
          phone: '',
          department: '',
          address: '',
          bio: '',
          website: '',
          isVerified: true,
          emailVerified: true,
          phoneVerified: false,
          balance: 50000,
          createdAt: new Date(),
          updatedAt: new Date(),
          businessProfile: null,
        }
      }
    } catch {
      console.warn('[Auth] Clerk unavailable, cannot build minimal user')
    }

    return null
  } catch {
    return null
  }
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
