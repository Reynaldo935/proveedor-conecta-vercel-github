import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import crypto from 'crypto'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, name, googleId, avatar, role } = body

    if (!email) {
      return NextResponse.json({ success: false, error: 'Email es requerido' }, { status: 400 })
    }

    let user = await db.user.findUnique({
      where: { email },
      include: { businessProfile: true },
    })

    if (user) {
      // Update Google ID but do NOT auto-verify email
      user = await db.user.update({
        where: { id: user.id },
        data: {
          googleId: googleId || user.googleId,
          avatar: avatar || user.avatar,
          name: name || user.name,
          // emailVerified stays as-is — must verify explicitly
        },
        include: { businessProfile: true },
      })
    } else {
      // Create new user from Google — email NOT verified by default
      const userRole = role === 'SELLER' ? 'SELLER' : 'BUYER'
      user = await db.user.create({
        data: {
          email,
          name: name || email.split('@')[0],
          googleId: googleId || '',
          avatar: avatar || '',
          role: userRole,
          isVerified: false,
          emailVerified: false, // Must verify even for Google users
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

    // If email not verified, generate verification token
    let verificationLink: string | undefined
    let verificationToken: string | undefined

    if (!user!.emailVerified) {
      // Delete existing tokens for this email
      await db.verificationToken.deleteMany({ where: { email } })

      const token = crypto.randomUUID()
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000)

      await db.verificationToken.create({
        data: { email, token, expiresAt },
      })

      verificationLink = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/auth/verify?token=${token}`
      verificationToken = token

      console.log(`[EMAIL SIMULATION] Google auth verification email for ${email}`)
      console.log(`[EMAIL SIMULATION] Link: ${verificationLink}`)
    }

    const cookieStore = await (await import('next/headers')).cookies()
    cookieStore.set('pc_user_id', user!.id, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30,
      path: '/',
    })

    const { password: _, ...safeUser } = user!
    return NextResponse.json({
      success: true,
      data: {
        ...safeUser,
        verificationLink,
        verificationToken,
        requiresVerification: !user!.emailVerified,
      },
    })
  } catch (error) {
    console.error('Google auth error:', error)
    return NextResponse.json({ success: false, error: 'Error al autenticar con Google' }, { status: 500 })
  }
}
