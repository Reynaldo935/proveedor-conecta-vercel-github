import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const cookieStore = await cookies()
    const userId = cookieStore.get('pc_user_id')?.value

    if (!userId) {
      return NextResponse.json({ success: false, error: 'No autenticado' }, { status: 401 })
    }

    const user = await db.user.findUnique({ where: { id: userId } })
    if (!user || user.email !== 'rey7214935@gmail.com') {
      return NextResponse.json({ success: false, error: 'Acceso denegado' }, { status: 403 })
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
    return NextResponse.json({ success: false, error: 'Error al obtener ayudantes' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies()
    const userId = cookieStore.get('pc_user_id')?.value

    if (!userId) {
      return NextResponse.json({ success: false, error: 'No autenticado' }, { status: 401 })
    }

    const user = await db.user.findUnique({ where: { id: userId } })
    if (!user || user.email !== 'rey7214935@gmail.com') {
      return NextResponse.json({ success: false, error: 'Acceso denegado' }, { status: 403 })
    }

    const body = await request.json()
    const { targetUserId, helperRole } = body

    if (!targetUserId || !helperRole) {
      return NextResponse.json({ success: false, error: 'targetUserId y helperRole son requeridos' }, { status: 400 })
    }

    const validRoles = ['DEVELOPER', 'MARKETING', 'FULLSTACK', 'GRAPHIC_DESIGN', 'COMMUNICATOR']
    if (!validRoles.includes(helperRole)) {
      return NextResponse.json({ success: false, error: 'Rol inválido' }, { status: 400 })
    }

    const targetUser = await db.user.findUnique({ where: { id: targetUserId } })
    if (!targetUser) {
      return NextResponse.json({ success: false, error: 'Usuario no encontrado' }, { status: 404 })
    }

    const updated = await db.user.update({
      where: { id: targetUserId },
      data: { helperRole },
      select: { id: true, name: true, email: true, helperRole: true },
    })

    return NextResponse.json({ success: true, data: updated })
  } catch (error) {
    console.error('Admin helpers POST error:', error)
    return NextResponse.json({ success: false, error: 'Error al asignar rol' }, { status: 500 })
  }
}
