import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { cookies } from 'next/headers'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, name, role } = body

    if (!email || !password || !name) {
      return NextResponse.json({ success: false, error: 'Email, contraseña y nombre son requeridos' }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json({ success: false, error: 'La contraseña debe tener al menos 6 caracteres' }, { status: 400 })
    }

    const existing = await db.user.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json({ success: false, error: 'El correo ya está registrado' }, { status: 400 })
    }

    const hashedPassword = await bcrypt.hash(password, 12)
    const userRole = role === 'SELLER' ? 'SELLER' : 'BUYER'

    const user = await db.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
        role: userRole,
        isVerified: false,
        emailVerified: false,
      },
    })

    if (userRole === 'SELLER') {
      await db.businessProfile.create({
        data: { userId: user.id },
      })
    }

    // Generate verification token
    const token = crypto.randomUUID()
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

    await db.verificationToken.create({
      data: {
        email,
        token,
        expiresAt,
      },
    })

    // Simulated verification link
    const verificationLink = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/auth/verify?token=${token}`

    // Simulate email sending
    console.log(`[EMAIL SIMULATION] Registration verification email for ${email}`)
    console.log(`[EMAIL SIMULATION] Link: ${verificationLink}`)

    // Set cookie so user can access verification page
    const cookieStore = await cookies()
    cookieStore.set('pc_user_id', user.id, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: '/',
    })

    const { password: _, ...safeUser } = user
    return NextResponse.json({
      success: true,
      data: {
        ...safeUser,
        verificationLink,
        verificationToken: token,
      },
    })
  } catch (error) {
    console.error('Register error:', error)
    return NextResponse.json({ success: false, error: 'Error al registrar usuario' }, { status: 500 })
  }
}
