import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { setAuthCookie } from '@/lib/auth'

// Mapping of demo email aliases (used by the UI) to real seeded user emails.
// This keeps demo login frictionless while never exposing real passwords.
const DEMO_ALIASES: Record<string, string> = {
  'ferreteria@demo.ni': 'ventas@ferreteríaamericana.com.ni',
  'agroserv@demo.ni': 'info@agropecuariaporvenir.com',
  'tech@demo.ni': 'ventas@siman.com',
  'comprador@demo.ni': 'rey7214935@gmail.com', // fallback to admin if no buyer seeded
  'admin@demo.ni': 'rey7214935@gmail.com',
  // legacy aliases
  'vendedor@demo.ni': 'ventas@ferreteríaamericana.com.ni',
  'vendedor@demo.com': 'ventas@ferreteríaamericana.com.ni',
  'comprador@demo.com': 'rey7214935@gmail.com',
  'admin@demo.com': 'rey7214935@gmail.com',
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email } = body

    if (!email) {
      return NextResponse.json({ success: false, error: 'Email es requerido' }, { status: 200 })
    }

    const alias = DEMO_ALIASES[email.toLowerCase()]
    if (!alias) {
      return NextResponse.json({ success: false, error: 'Cuenta de demo no valida' }, { status: 200 })
    }

    // Try to find the mapped real user; if missing, fall back to admin or first user
    let user = await db.user.findUnique({ where: { email: alias } })
    if (!user) {
      user = await db.user.findFirst({
        where: {
          OR: [
            { role: 'ADMIN' },
            { role: 'SELLER' },
          ],
        },
        orderBy: { createdAt: 'asc' },
      })
    }
    if (!user) {
      user = await db.user.findFirst()
    }

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
