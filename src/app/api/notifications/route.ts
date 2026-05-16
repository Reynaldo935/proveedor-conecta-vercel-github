import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { cookies } from 'next/headers'

export async function GET() {
  try {
    const cookieStore = await cookies()
    const userId = cookieStore.get('pc_user_id')?.value
    if (!userId) return NextResponse.json({ success: false, error: 'No autenticado' }, { status: 401 })

    const notifications = await db.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })

    return NextResponse.json({ success: true, data: notifications })
  } catch (error) {
    console.error('Get notifications error:', error)
    return NextResponse.json({ success: false, error: 'Error al obtener notificaciones' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const userId = cookieStore.get('pc_user_id')?.value
    if (!userId) return NextResponse.json({ success: false, error: 'No autenticado' }, { status: 401 })

    const body = await request.json()
    if (body.markAll) {
      await db.notification.updateMany({ where: { userId, isRead: false }, data: { isRead: true } })
    } else if (body.id) {
      await db.notification.update({ where: { id: body.id }, data: { isRead: true } })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Update notifications error:', error)
    return NextResponse.json({ success: false, error: 'Error al actualizar notificaciones' }, { status: 500 })
  }
}
