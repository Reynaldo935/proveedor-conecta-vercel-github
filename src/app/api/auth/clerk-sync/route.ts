/**
 * POST /api/auth/clerk-sync
 *
 * Bridges Clerk authentication with Prisma/Turso database.
 * Uses email matching (no clerkId column needed — avoids migration errors).
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { setAuthCookie } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, name, avatar } = body

    if (!email) {
      return NextResponse.json({ success: false, error: 'email es requerido' }, { status: 200 })
    }

    let user = await db.user.findUnique({
      where: { email },
      include: { businessProfile: true },
    })

    if (!user) {
      user = await db.user.create({
        data: {
          email,
          name: name || email,
          avatar: avatar || '',
          role: 'BUYER',
          emailVerified: true,
        },
        include: { businessProfile: true },
      })
    } else if (avatar && avatar !== user.avatar) {
      user = await db.user.update({
        where: { id: user.id },
        data: { avatar },
        include: { businessProfile: true },
      })
    }

    await setAuthCookie(user.id)
    const { password: _, ...safeUser } = user
    return NextResponse.json({ success: true, data: safeUser })
  } catch (error) {
    console.error('Clerk sync error:', error)
    return NextResponse.json({ success: false, error: 'Error al sincronizar usuario' }, { status: 200 })
  }
}
