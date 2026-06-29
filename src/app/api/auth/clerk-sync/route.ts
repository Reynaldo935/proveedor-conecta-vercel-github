/**
 * POST /api/auth/clerk-sync
 *
 * Bridges Clerk authentication with our Prisma/Turso database.
 * Called from the client when a Clerk user is authenticated.
 * Finds or creates a User record linked to the Clerk ID.
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { setAuthCookie } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { clerkId, email, name, avatar } = body

    if (!clerkId || !email) {
      return NextResponse.json({ success: false, error: 'clerkId y email son requeridos' }, { status: 200 })
    }

    // Try to find existing user by clerkId or email
    let user = await db.user.findFirst({
      where: { OR: [{ clerkId }, { email }] },
      include: { businessProfile: true },
    })

    if (user) {
      // Update clerkId if user was found by email but has no clerkId yet
      if (!user.clerkId || user.clerkId !== clerkId) {
        user = await db.user.update({
          where: { id: user.id },
          data: { clerkId, avatar: avatar || user.avatar },
          include: { businessProfile: true },
        })
      }
    } else {
      // Create new user linked to Clerk
      user = await db.user.create({
        data: {
          clerkId,
          email,
          name: name || email,
          avatar: avatar || '',
          role: 'BUYER',
          emailVerified: true, // Clerk already verified the email
          isVerified: false,
        },
        include: { businessProfile: true },
      })
    }

    // Set the legacy auth cookie for API routes that still use cookie-based auth
    await setAuthCookie(user.id)

    const { password: _, ...safeUser } = user
    return NextResponse.json({ success: true, data: safeUser })
  } catch (error) {
    console.error('Clerk sync error:', error)
    return NextResponse.json({ success: false, error: 'Error al sincronizar usuario' }, { status: 200 })
  }
}
