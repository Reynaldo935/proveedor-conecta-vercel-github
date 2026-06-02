import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'
import { createAuditLog, getClientIp, getUserAgent } from '@/lib/audit'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json({ success: false, error: 'Email y contraseña son requeridos' }, { status: 400 })
    }

    const foundUser = await db.user.findUnique({
      where: { email },
      include: { businessProfile: true },
    })

    if (!foundUser || !foundUser.password) {
      return NextResponse.json({ success: false, error: 'Credenciales inválidas' }, { status: 401 })
    }

    const valid = await bcrypt.compare(password, foundUser.password)
    if (!valid) {
      return NextResponse.json({ success: false, error: 'Credenciales inválidas' }, { status: 401 })
    }

    // Auto-verify email on login for demo/hackathon
    if (!foundUser.emailVerified) {
      await db.user.update({
        where: { id: foundUser.id },
        data: { emailVerified: true },
      })
    }

    // Re-fetch user to get updated emailVerified status and balance
    const user = await db.user.findUnique({
      where: { id: foundUser.id },
      include: { businessProfile: true },
    })

    if (!user) {
      return NextResponse.json({ success: false, error: 'Error al obtener usuario' }, { status: 500 })
    }

    // Audit log
    await createAuditLog({
      userId: user.id,
      action: 'LOGIN',
      entity: 'User',
      entityId: user.id,
      details: `Inicio de sesión: ${user.email}`,
      ip: getClientIp(request),
      userAgent: getUserAgent(request),
    })

    const { password: _, ...safeUser } = user
    const response = NextResponse.json({ success: true, data: safeUser })
    response.cookies.set('pc_user_id', user.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30,
      path: '/',
    })
    return response
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json({ success: false, error: 'Error al iniciar sesión' }, { status: 500 })
  }
}
