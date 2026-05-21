import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { cookies } from 'next/headers'

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const cookieStore = await cookies()
    const userId = cookieStore.get('pc_user_id')?.value
    if (!userId) return NextResponse.json({ success: false, error: 'No autenticado' }, { status: 401 })

    const user = await db.user.findUnique({ where: { id: userId } })
    if (!user || user.email !== 'rey7214935@gmail.com') {
      return NextResponse.json({ success: false, error: 'Solo el administrador' }, { status: 403 })
    }

    const body = await request.json()
    const { status } = body

    if (!['PAID', 'PENDING', 'FAILED'].includes(status)) {
      return NextResponse.json({ success: false, error: 'Estado inválido' }, { status: 400 })
    }

    const commission = await db.commissionLog.update({
      where: { id },
      data: { status }
    })

    return NextResponse.json({ success: true, data: commission })
  } catch (error) {
    console.error('Update commission error:', error)
    return NextResponse.json({ success: false, error: 'Error al actualizar comisión' }, { status: 500 })
  }
}
