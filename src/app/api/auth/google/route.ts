import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, name, googleId, avatar } = body

    if (!email) {
      return NextResponse.json({ success: false, error: 'Email es requerido' }, { status: 400 })
    }

    let user = await db.user.findUnique({
      where: { email },
      include: { businessProfile: true },
    })

    if (user) {
      // Update Google ID and mark as verified
      user = await db.user.update({
        where: { id: user.id },
        data: {
          googleId: googleId || user.googleId,
          emailVerified: true,
          avatar: avatar || user.avatar,
          name: name || user.name,
        },
        include: { businessProfile: true },
      })
    } else {
      // Create new user from Google
      const userRole = body.role === 'SELLER' ? 'SELLER' : 'BUYER'
      user = await db.user.create({
        data: {
          email,
          name: name || email.split('@')[0],
          googleId: googleId || '',
          avatar: avatar || '',
          role: userRole,
          isVerified: true,
          emailVerified: true,
        },
        include: { businessProfile: true },
      })

      if (userRole === 'SELLER') {
        await db.businessProfile.create({ data: { userId: user.id } })
        user = await db.user.findUnique({
          where: { id: user.id },
          include: { businessProfile: true },
        })
      }
    }

    const cookieStore = await cookies()
    cookieStore.set('pc_user_id', user!.id, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30,
      path: '/',
    })

    const { password: _, ...safeUser } = user!
    return NextResponse.json({ success: true, data: safeUser })
  } catch (error) {
    console.error('Google auth error:', error)
    return NextResponse.json({ success: false, error: 'Error al autenticar con Google' }, { status: 500 })
  }
}
