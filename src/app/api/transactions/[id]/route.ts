import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthenticatedUserId, setAuthCookie } from '@/lib/auth'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const userId = await getAuthenticatedUserId(request)

    if (!userId) {
      return NextResponse.json({ success: false, error: 'No autenticado' }, { status: 401 })
    }
    await setAuthCookie(userId)

    const transaction = await db.transaction.findUnique({
      where: { id },
      include: {
        product: { select: { id: true, title: true, images: true, price: true, discountPrice: true, quantity: true } },
        buyer: { select: { id: true, name: true, email: true, avatar: true } },
        seller: { select: { id: true, name: true, avatar: true, businessProfile: { select: { businessName: true, phone: true } } } },
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
      data: {
        ...transaction,
        product: { ...transaction.product, images: transaction.product.images ? JSON.parse(transaction.product.images) : [] },
      },
    })
  } catch (error) {
    console.error('Get transaction error:', error)
    return NextResponse.json({ success: false, error: 'Error al obtener transacción' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const userId = await getAuthenticatedUserId(request)

    if (!userId) {
      return NextResponse.json({ success: false, error: 'No autenticado' }, { status: 401 })
    }
    await setAuthCookie(userId)

    const existing = await db.transaction.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Transacción no encontrada' }, { status: 404 })
    }

    if (existing.buyerId !== userId && existing.sellerId !== userId) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 403 })
    }

    const body = await request.json()
    const validStatuses = ['PENDING', 'COMPLETED', 'FAILED', 'REFUNDED']
    if (!body.status || !validStatuses.includes(body.status)) {
      return NextResponse.json({ success: false, error: 'Estado no válido' }, { status: 400 })
    }

    const transaction = await db.transaction.update({
      where: { id },
      data: { status: body.status },
      include: {
        product: { select: { id: true, title: true } },
        buyer: { select: { id: true, name: true } },
        seller: { select: { id: true, name: true } },
      },
    })

    // Notify the other party about status change
    const notifyUserId = userId === transaction.buyerId ? transaction.sellerId : transaction.buyerId
    await db.notification.create({
      data: {
        userId: notifyUserId,
        type: 'PAYMENT',
        title: 'Estado de transacción actualizado',
        message: `Transacción por "${transaction.product.title}" cambió a ${body.status}`,
        link: `/transactions/${id}`,
      },
    })

    await db.auditLog.create({
      data: {
        userId,
        action: 'UPDATE_TRANSACTION',
        entity: 'Transaction',
        entityId: id,
        details: `Transacción ${id} actualizada a ${body.status}`,
      },
    })

    return NextResponse.json({ success: true, data: transaction })
  } catch (error) {
    console.error('Update transaction error:', error)
    return NextResponse.json({ success: false, error: 'Error al actualizar transacción' }, { status: 500 })
  }
}
