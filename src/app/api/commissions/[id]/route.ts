import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthenticatedUserId, setAuthCookie } from '@/lib/auth'

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const userId = await getAuthenticatedUserId(request)
    if (!userId) return NextResponse.json({ success: false, error: 'No autenticado' }, { status: 200 })
    await setAuthCookie(userId)

    const user = await db.user.findUnique({ where: { id: userId } })
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Solo el administrador' }, { status: 200 })
    }

    const body = await request.json()
    const { status } = body

    if (!['PAID', 'PENDING', 'FAILED'].includes(status)) {
      return NextResponse.json({ success: false, error: 'Estado inválido' }, { status: 200 })
    }

    const commission = await db.commissionLog.update({
      where: { id },
      data: { status }
    })

    return NextResponse.json({ success: true, data: commission })
  } catch (error) {
    console.error('Update commission error:', error)
    return NextResponse.json({ success: false, error: 'Error al actualizar comisión' }, { status: 200 })
  }
}
