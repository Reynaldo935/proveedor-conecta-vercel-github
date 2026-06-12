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

    const helpers = await db.user.findMany({
      where: {
        helperRole: { not: '' },
      },
      select: {
        id: true,
        name: true,
        email: true,
        helperRole: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ success: true, data: helpers })
  } catch (error) {
    console.error('Admin helpers error:', error)
    return NextResponse.json({ success: false, error: 'Error al obtener ayudantes' }, { status: 200 })
  }
}

export async function POST(request: NextRequest) {
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

    const body = await request.json()
    const { targetUserId, helperRole } = body

    if (!targetUserId || !helperRole) {
      return NextResponse.json({ success: false, error: 'targetUserId y helperRole son requeridos' }, { status: 200 })
    }

    const validRoles = ['DEVELOPER', 'MARKETING', 'FULLSTACK', 'GRAPHIC_DESIGN', 'COMMUNICATOR']
    if (!validRoles.includes(helperRole)) {
      return NextResponse.json({ success: false, error: 'Rol inválido' }, { status: 200 })
    }

    const targetUser = await db.user.findUnique({ where: { id: targetUserId } })
    if (!targetUser) {
      return NextResponse.json({ success: false, error: 'Usuario no encontrado' }, { status: 200 })
    }

    const updated = await db.user.update({
      where: { id: targetUserId },
      data: { helperRole },
      select: { id: true, name: true, email: true, helperRole: true },
    })

    return NextResponse.json({ success: true, data: updated })
  } catch (error) {
    console.error('Admin helpers POST error:', error)
    return NextResponse.json({ success: false, error: 'Error al asignar rol' }, { status: 200 })
  }
}
