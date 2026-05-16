import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { cookies } from 'next/headers'

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const cookieStore = await cookies()
    const userId = cookieStore.get('pc_user_id')?.value

    if (!userId) {
      return NextResponse.json({ success: false, error: 'No autenticado' }, { status: 401 })
    }

    const transaction = await db.transaction.findUnique({
      where: { id },
      include: {
        product: { select: { id: true, title: true, images: true } },
        buyer: { select: { id: true, name: true, email: true } },
        seller: { select: { id: true, name: true, businessProfile: { select: { businessName: true } } } },
      },
    })

    if (!transaction) {
      return NextResponse.json({ success: false, error: 'Transacción no encontrada' }, { status: 404 })
    }

    if (transaction.buyerId !== userId && transaction.sellerId !== userId) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 403 })
    }

    return NextResponse.json({
      success: true,
      data: { ...transaction, product: { ...transaction.product, images: transaction.product.images ? JSON.parse(transaction.product.images) : [] } },
    })
  } catch (error) {
    console.error('Get transaction error:', error)
    return NextResponse.json({ success: false, error: 'Error al obtener transacción' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const cookieStore = await cookies()
    const userId = cookieStore.get('pc_user_id')?.value

    if (!userId) {
      return NextResponse.json({ success: false, error: 'No autenticado' }, { status: 401 })
    }

    const body = await request.json()
    const transaction = await db.transaction.update({
      where: { id },
      data: { status: body.status },
    })

    return NextResponse.json({ success: true, data: transaction })
  } catch (error) {
    console.error('Update transaction error:', error)
    return NextResponse.json({ success: false, error: 'Error al actualizar transacción' }, { status: 500 })
  }
}
