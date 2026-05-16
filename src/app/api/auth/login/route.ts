import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json({ success: false, error: 'Email y contraseña son requeridos' }, { status: 400 })
    }

    const user = await db.user.findUnique({ 
      where: { email },
      include: { businessProfile: true },
    })

    if (!user || !user.password) {
      return NextResponse.json({ success: false, error: 'Credenciales inválidas' }, { status: 401 })
    }

    const valid = await bcrypt.compare(password, user.password)
    if (!valid) {
      return NextResponse.json({ success: false, error: 'Credenciales inválidas' }, { status: 401 })
    }

    // Check if email is verified
    if (!user.emailVerified) {
      return NextResponse.json({
        success: false,
        error: 'Debes verificar tu correo electrónico antes de iniciar sesión',
        requiresVerification: true,
        data: { email: user.email },
      }, { status: 403 })
    }

    const cookieStore = await cookies()
    cookieStore.set('pc_user_id', user.id, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30,
      path: '/',
    })

    const { password: _, ...safeUser } = user
    return NextResponse.json({ success: true, data: safeUser })
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json({ success: false, error: 'Error al iniciar sesión' }, { status: 500 })
  }
}
