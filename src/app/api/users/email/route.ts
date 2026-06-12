import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUserId, setAuthCookie } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const userId = await getAuthenticatedUserId(request)

    if (!userId) {
      return NextResponse.json({ success: false, error: 'No autenticado' }, { status: 200 })
    }
    await setAuthCookie(userId)

    const user = await db.user.findUnique({ where: { id: userId } })
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Acceso denegado' }, { status: 200 })
    }

    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email')

    if (!email) {
      return NextResponse.json({ success: false, error: 'Email es requerido' }, { status: 200 })
    }

    const foundUser = await db.user.findUnique({
      where: { email },
      select: { id: true, name: true, email: true, role: true, helperRole: true },
    })

    if (!foundUser) {
      return NextResponse.json({ success: false, error: 'Usuario no encontrado' }, { status: 200 })
    }

    return NextResponse.json({ success: true, data: foundUser })
  } catch (error) {
    console.error('User email lookup error:', error)
    return NextResponse.json({ success: false, error: 'Error al buscar usuario' }, { status: 200 })
  }
}
