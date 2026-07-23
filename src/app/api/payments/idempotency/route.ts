/**
 * Idempotency API for Payment Prevention
 * ProveedorConecta Nicaragua
 * 
 * Prevents duplicate payments using idempotency keys.
 * POST /api/payments/idempotency — Check/create idempotency key
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthenticatedUserId, setAuthCookie } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const userId = await getAuthenticatedUserId(request)
    if (!userId) {
      return NextResponse.json({ success: false, message: 'No autenticado' }, { status: 200 })
    }
    await setAuthCookie(userId)

    const body = await request.json()
    const { action, idempotencyKey, productId, amount } = body

    if (!idempotencyKey) {
      return NextResponse.json({ success: false, message: 'Idempotency key requerida' }, { status: 200 })
    }

    if (action === 'check') {
      // Check if this idempotency key was already used
      const existingTransaction = await db.transaction.findFirst({
        where: {
          buyerId: userId,
          paymentDetails: { contains: idempotencyKey },
          status: 'COMPLETED',
        },
      })

      if (existingTransaction) {
        return NextResponse.json({
          success: true,
          data: {
            isDuplicate: true,
            existingTransactionId: existingTransaction.id,
            message: 'Este pago ya fue procesado anteriormente',
          },
        })
      }

      return NextResponse.json({
        success: true,
        data: { isDuplicate: false },
      })
    }

    if (action === 'create') {
      // Create an idempotency record tied to this payment attempt
      const auditLog = await db.auditLog.create({
        data: {
          userId,
          action: 'IDEMPOTENCY_KEY_CREATED',
          entity: 'Payment',
          entityId: idempotencyKey,
          details: JSON.stringify({
            productId,
            amount,
            createdAt: new Date().toISOString(),
          }),
        },
      })

      return NextResponse.json({
        success: true,
        data: {
          idempotencyKey,
          auditId: auditLog.id,
          message: 'Llave de idempotencia creada',
        },
      })
    }

    return NextResponse.json({ success: false, message: 'Acción no válida' }, { status: 200 })
  } catch (error) {
    console.error('Idempotency error:', error)
    return NextResponse.json({ success: false, message: 'Error en verificación de idempotencia' }, { status: 200 })
  }
}
