import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthenticatedUserId, setAuthCookie } from '@/lib/auth'

const COMMISSION_RATE = 0.03

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const userId = await getAuthenticatedUserId(request)

    if (!userId) {
      return NextResponse.json({ success: false, error: 'No autenticado' }, { status: 200 })
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
      return NextResponse.json({ success: false, error: 'Transacción no encontrada' }, { status: 200 })
    }

    if (transaction.buyerId !== userId && transaction.sellerId !== userId) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 200 })
    }

    return NextResponse.json({
      success: true,
      data: {
        ...transaction,
        product: { ...transaction.product, images: (() => { try { return transaction.product.images ? JSON.parse(transaction.product.images) : [] } catch { return [] } })() },
      },
    })
  } catch (error) {
    console.error('Get transaction error:', error)
    return NextResponse.json({ success: false, error: 'Error al obtener transacción' }, { status: 200 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const userId = await getAuthenticatedUserId(request)

    if (!userId) {
      return NextResponse.json({ success: false, error: 'No autenticado' }, { status: 200 })
    }
    await setAuthCookie(userId)

    const existing = await db.transaction.findUnique({
      where: { id },
      include: {
        product: { select: { id: true, title: true, sellerId: true } },
        buyer: { select: { id: true, name: true } },
        seller: { select: { id: true, name: true } },
      },
    })
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Transacción no encontrada' }, { status: 200 })
    }

    if (existing.buyerId !== userId && existing.sellerId !== userId) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 200 })
    }

    const body = await request.json()
    const validStatuses = ['PENDING', 'COMPLETED', 'FAILED', 'REFUNDED']
    if (!body.status || !validStatuses.includes(body.status)) {
      return NextResponse.json({ success: false, error: 'Estado no válido' }, { status: 200 })
    }

    // ── PENDING → COMPLETED transition with commission split ──────────────
    if (existing.status === 'PENDING' && body.status === 'COMPLETED') {
      const finalAmount = existing.amount
      const commission = Math.round(finalAmount * COMMISSION_RATE * 100) / 100
      const sellerPayout = Math.round((finalAmount - commission) * 100) / 100

      const result = await db.$transaction(async (tx) => {
        // Verify buyer has sufficient balance
        const buyer = await tx.user.findUnique({ where: { id: existing.buyerId } })
        if (!buyer) throw new Error('BUYER_NOT_FOUND')

        const buyerBalance = (buyer as Record<string, unknown>).balance as number | undefined
        const userBalance = typeof buyerBalance === 'number' ? buyerBalance : 0

        if (userBalance < finalAmount) {
          throw new Error('INSUFFICIENT_FUNDS')
        }

        // Deduct from buyer
        await tx.user.update({
          where: { id: existing.buyerId },
          data: { balance: { decrement: finalAmount } },
        })

        // Credit seller (97% payout)
        await tx.user.update({
          where: { id: existing.sellerId },
          data: { balance: { increment: sellerPayout } },
        })

        // Update transaction to COMPLETED with commission fields
        const updatedTransaction = await tx.transaction.update({
          where: { id },
          data: {
            status: 'COMPLETED',
            commission,
            sellerPayout,
          },
          include: {
            product: { select: { id: true, title: true } },
            buyer: { select: { id: true, name: true } },
            seller: { select: { id: true, name: true } },
          },
        })

        // Decrease product quantity
        await tx.product.update({
          where: { id: existing.productId },
          data: { quantity: { decrement: 1 } },
        })

        return { updatedTransaction, userBalance }
      }).catch((txError: Error) => {
        if (txError.message === 'INSUFFICIENT_FUNDS') throw new Error('INSUFFICIENT_FUNDS')
        if (txError.message === 'BUYER_NOT_FOUND') throw new Error('BUYER_NOT_FOUND')
        throw txError
      })

      // Create commission log
      await db.commissionLog.create({
        data: {
          transactionId: id,
          amount: commission,
          rate: COMMISSION_RATE,
          destination: 'rey7214935@gmail.com',
          bankAccount: 'LAFISE',
          status: 'PENDING',
        },
      })

      // Notify seller
      await db.notification.create({
        data: {
          userId: existing.sellerId,
          type: 'PAYMENT',
          title: 'Pago recibido',
          message: `Pago de C$${finalAmount} recibido por "${existing.product.title}" (Tu ganancia: C$${sellerPayout.toFixed(2)})`,
          link: `/transactions/${id}`,
        },
      })

      // Audit log
      await db.auditLog.create({
        data: {
          userId,
          action: 'COMPLETE_TRANSACTION',
          entity: 'Transaction',
          entityId: id,
          details: `Transacción completada: C$${finalAmount} — Comisión 3%: C$${commission.toFixed(2)} — Pago vendedor: C$${sellerPayout.toFixed(2)}`,
        },
      })

      return NextResponse.json({ success: true, data: result.updatedTransaction })
    }

    // ── COMPLETED → REFUNDED transition ───────────────────────────────────
    if (existing.status === 'COMPLETED' && body.status === 'REFUNDED') {
      const refundAmount = existing.sellerPayout || (existing.amount - existing.commission)

      const result = await db.$transaction(async (tx) => {
        // Refund buyer the full amount
        await tx.user.update({
          where: { id: existing.buyerId },
          data: { balance: { increment: existing.amount } },
        })

        // Deduct from seller the payout they received
        await tx.user.update({
          where: { id: existing.sellerId },
          data: { balance: { decrement: refundAmount } },
        })

        // Restore product quantity
        await tx.product.update({
          where: { id: existing.productId },
          data: { quantity: { increment: 1 } },
        })

        // Update transaction
        const updatedTransaction = await tx.transaction.update({
          where: { id },
          data: { status: 'REFUNDED' },
          include: {
            product: { select: { id: true, title: true } },
            buyer: { select: { id: true, name: true } },
            seller: { select: { id: true, name: true } },
          },
        })

        return updatedTransaction
      })

      // Notify both parties
      await db.notification.create({
        data: {
          userId: existing.buyerId,
          type: 'PAYMENT',
          title: 'Reembolso procesado',
          message: `Reembolso de C$${existing.amount} procesado por "${existing.product.title}"`,
          link: `/transactions/${id}`,
        },
      })
      await db.notification.create({
        data: {
          userId: existing.sellerId,
          type: 'PAYMENT',
          title: 'Transacción reembolsada',
          message: `Reembolso de C$${existing.amount} por "${existing.product.title}"`,
          link: `/transactions/${id}`,
        },
      })

      await db.auditLog.create({
        data: {
          userId,
          action: 'REFUND_TRANSACTION',
          entity: 'Transaction',
          entityId: id,
          details: `Transacción reembolsada: C$${existing.amount}`,
        },
      })

      return NextResponse.json({ success: true, data: result })
    }

    // ── Standard status update (no financial changes) ─────────────────────
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
    // Handle custom errors from PENDING→COMPLETED flow
    if (error instanceof Error && error.message === 'INSUFFICIENT_FUNDS') {
      return NextResponse.json({
        success: false,
        error: '💸 Sin fondos — Dinero insuficiente para completar la transacción.',
        errorCode: 'INSUFFICIENT_FUNDS',
      }, { status: 200 })
    }
    if (error instanceof Error && error.message === 'BUYER_NOT_FOUND') {
      return NextResponse.json({ success: false, error: 'Comprador no encontrado' }, { status: 200 })
    }
    console.error('Update transaction error:', error)
    return NextResponse.json({ success: false, error: 'Error al actualizar transacción' }, { status: 200 })
  }
}
