import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUserId, setAuthCookie } from '@/lib/auth'
import { db } from '@/lib/db'
import { createHmac } from 'crypto'

const WEBHOOK_SECRET = process.env.COMMISSION_WEBHOOK_SECRET || 'proveedorconecta_commission_secret_2024'

export async function GET(request: NextRequest) {
  try {
    const userId = await getAuthenticatedUserId(request)

    if (!userId) {
      return NextResponse.json({ success: false, error: 'No autenticado' }, { status: 200 })
    }
    await setAuthCookie(userId)

    const user = await db.user.findUnique({ where: { id: userId } })
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Acceso denegado' }, { status: 200 })
    }

    const commissionLogs = await db.commissionLog.findMany({
      orderBy: { createdAt: 'desc' },
    })

    // Enrich with transaction data
    const commissions = await Promise.all(
      commissionLogs.map(async (c) => {
        const transaction = await db.transaction.findUnique({
          where: { id: c.transactionId },
          select: {
            id: true,
            amount: true,
            paymentMethod: true,
            status: true,
            product: { select: { title: true } },
            buyer: { select: { name: true } },
            seller: { select: { name: true } },
          },
        })
        return { ...c, transaction }
      })
    )

    const totalCommission = commissionLogs.reduce((sum, c) => sum + c.amount, 0)
    const paidCommission = commissionLogs.filter(c => c.status === 'PAID').reduce((sum, c) => sum + c.amount, 0)
    const pendingCommission = commissionLogs.filter(c => c.status === 'PENDING').reduce((sum, c) => sum + c.amount, 0)

    return NextResponse.json({
      success: true,
      data: {
        commissions,
        summary: {
          total: totalCommission,
          paid: paidCommission,
          pending: pendingCommission,
          count: commissionLogs.length,
        },
      },
    })
  } catch (error) {
    console.error('Commissions error:', error)
    return NextResponse.json({ success: false, error: 'Error al obtener comisiones' }, { status: 200 })
  }
}

// Webhook endpoint for payment gateway to confirm commission payment
export async function POST(request: NextRequest) {
  try {
    const payload = await request.text()
    const receivedSignature = request.headers.get('x-pasarela-signature') || ''

    // HMAC-SHA256 validation
    const calculatedSignature = createHmac('sha256', WEBHOOK_SECRET).update(payload).digest('hex')

    if (receivedSignature && !timingSafeEqual(receivedSignature, calculatedSignature)) {
      return NextResponse.json({ success: false, error: 'Invalid signature' }, { status: 200 })
    }

    const body = JSON.parse(payload)
    const { transactionId, status } = body

    if (!transactionId) {
      return NextResponse.json({ success: false, error: 'transactionId required' }, { status: 200 })
    }

    const commission = await db.commissionLog.findFirst({ where: { transactionId } })
    if (!commission) {
      return NextResponse.json({ success: false, error: 'Commission not found' }, { status: 200 })
    }

    await db.commissionLog.update({
      where: { id: commission.id },
      data: { status: status || 'PAID' },
    })

    return NextResponse.json({ success: true, data: { id: commission.id, status: status || 'PAID' } })
  } catch (error) {
    console.error('Commission webhook error:', error)
    return NextResponse.json({ success: false, error: 'Webhook processing error' }, { status: 200 })
  }
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let result = 0
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }
  return result === 0
}
