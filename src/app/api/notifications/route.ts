import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthenticatedUserId, setAuthCookie } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const userId = await getAuthenticatedUserId(request)
    if (!userId) return NextResponse.json({ success: false, error: 'No autenticado' }, { status: 401 })
    await setAuthCookie(userId)

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const unreadOnly = searchParams.get('unreadOnly') === 'true'

    const where: Record<string, unknown> = { userId }
    if (unreadOnly) where.isRead = false

    const [notifications, unreadCount] = await Promise.all([
      db.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
      }),
      db.notification.count({ where: { userId, isRead: false } }),
    ])

    return NextResponse.json({ success: true, data: notifications, unreadCount })
  } catch (error) {
    console.error('Get notifications error:', error)
    return NextResponse.json({ success: false, error: 'Error al obtener notificaciones' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const userId = await getAuthenticatedUserId(request)
    if (!userId) return NextResponse.json({ success: false, error: 'No autenticado' }, { status: 401 })
    await setAuthCookie(userId)

    const body = await request.json()

    if (body.markAll) {
      await db.notification.updateMany({ where: { userId, isRead: false }, data: { isRead: true } })
      return NextResponse.json({ success: true, data: { markedAll: true } })
    } else if (body.id) {
      // Verify notification belongs to the user
      const notification = await db.notification.findUnique({ where: { id: body.id } })
      if (!notification) {
        return NextResponse.json({ success: false, error: 'Notificación no encontrada' }, { status: 404 })
      }
      if (notification.userId !== userId) {
        return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 403 })
      }
      await db.notification.update({ where: { id: body.id }, data: { isRead: true } })
      return NextResponse.json({ success: true, data: { id: body.id, isRead: true } })
    }

    return NextResponse.json({ success: false, error: 'Se requiere id o markAll' }, { status: 400 })
  } catch (error) {
    console.error('Update notifications error:', error)
    return NextResponse.json({ success: false, error: 'Error al actualizar notificaciones' }, { status: 500 })
  }
}
