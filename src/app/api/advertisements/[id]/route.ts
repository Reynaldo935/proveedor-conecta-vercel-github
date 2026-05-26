import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUserId, setAuthCookie } from '@/lib/auth'
import { db } from '@/lib/db'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getAuthenticatedUserId(request)

    if (!userId) {
      return NextResponse.json({ success: false, error: 'No autenticado' }, { status: 401 })
    }
    await setAuthCookie(userId)

    const user = await db.user.findUnique({ where: { id: userId } })
    if (!user || user.email !== 'rey7214935@gmail.com') {
      return NextResponse.json({ success: false, error: 'Acceso denegado' }, { status: 403 })
    }

    const { id } = await params
    const body = await request.json()
    const { status } = body

    const validStatuses = ['PENDING', 'ACTIVE', 'PAUSED', 'EXPIRED', 'REJECTED']
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ success: false, error: 'Estado inválido' }, { status: 400 })
    }

    const updated = await db.advertisement.update({
      where: { id },
      data: { status },
      include: {
        seller: { select: { name: true, email: true } },
      },
    })

    return NextResponse.json({ success: true, data: updated })
  } catch (error) {
    console.error('Advertisement update error:', error)
    return NextResponse.json({ success: false, error: 'Error al actualizar anuncio' }, { status: 500 })
  }
}
