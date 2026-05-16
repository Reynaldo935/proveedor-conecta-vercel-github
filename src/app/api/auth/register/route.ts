import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, name, role } = body

    if (!email || !password || !name) {
      return NextResponse.json({ success: false, error: 'Email, contraseña y nombre son requeridos' }, { status: 400 })
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

    const cookieStore = await cookies()
    cookieStore.set('pc_user_id', user.id, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: '/',
    })

    const { password: _, ...safeUser } = user
    return NextResponse.json({ success: true, data: safeUser })
  } catch (error) {
    console.error('Register error:', error)
    return NextResponse.json({ success: false, error: 'Error al registrar usuario' }, { status: 500 })
  }
}
