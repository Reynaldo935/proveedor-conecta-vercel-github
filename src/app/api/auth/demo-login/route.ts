import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { setAuthCookie } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email } = body

    if (!email) {
      return NextResponse.json({ success: false, error: 'Email es requerido' }, { status: 200 })
    }

    // Only allow demo login for specific demo accounts
    const demoEmails = [
      'vendedor@demo.com',
      'comprador@demo.com',
      'admin@demo.com',
    ]

    if (!demoEmails.includes(email)) {
      return NextResponse.json({ success: false, error: 'Cuenta de demo no valida' }, { status: 200 })
    }

    const user = await db.user.findUnique({ where: { email } })

    if (!user) {
      return NextResponse.json({ success: false, error: 'Cuenta de demo no encontrada' }, { status: 200 })
    }

    // Set auth cookie
    await setAuthCookie(user.id)

    return NextResponse.json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        avatar: user.avatar,
        isVerified: user.isVerified,
      },
    })
  } catch (error) {
    console.error('Demo login error:', error)
    return NextResponse.json({ success: false, error: 'Error en login demo' }, { status: 200 })
  }
}
