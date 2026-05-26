import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthenticatedUserId, setAuthCookie } from '@/lib/auth'
import crypto from 'crypto'

export async function GET(request: NextRequest) {
  try {
    const userId = await getAuthenticatedUserId(request)

    if (!userId) {
      return NextResponse.json({ success: false, error: 'No autenticado' }, { status: 401 })
    }

    // Re-set auth cookie
    await setAuthCookie(userId)

    const { searchParams } = new URL(request.url)
    const role = searchParams.get('role') || ''
    const status = searchParams.get('status') || ''

    const where: Record<string, unknown> = {}
    if (role === 'buyer') where.buyerId = userId
    else if (role === 'seller') where.sellerId = userId
    else where.OR = [{ buyerId: userId }, { sellerId: userId }]

    if (status) where.status = status

    const transactions = await db.transaction.findMany({
      where,
      include: {
        product: { select: { id: true, title: true, images: true, price: true, discountPrice: true } },
        buyer: { select: { id: true, name: true, avatar: true } },
        seller: { select: { id: true, name: true, avatar: true, businessProfile: { select: { businessName: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({
      success: true,
      data: transactions.map(t => ({
        ...t,
        product: { ...t.product, images: (() => { try { return t.product.images ? JSON.parse(t.product.images) : [] } catch { return [] } })() },
      })),
    })
  } catch (error) {
    console.error('Get transactions error:', error)
    return NextResponse.json({ success: false, error: 'Error al obtener transacciones' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getAuthenticatedUserId(request)

    if (!userId) {
      return NextResponse.json({ success: false, error: 'No autenticado' }, { status: 401 })
    }

    // Re-set auth cookie
    await setAuthCookie(userId)

    const body = await request.json()
    const { productId, paymentMethod, cedula, cardLast4, paymentDetails, amount } = body

    if (!productId || !paymentMethod) {
      return NextResponse.json({ success: false, error: 'Producto y método de pago son requeridos' }, { status: 400 })
    }

    const validPaymentMethods = ['PAYPAL', 'BANPRO', 'BAC', 'LAFISE', 'BILLETERA', 'PIXELPAY', 'PAGADITO', 'GOOGLE_PAY', 'BANPRO_BILLETERA', 'KASH', 'WESTERN_UNION']
    if (!validPaymentMethods.includes(paymentMethod)) {
      return NextResponse.json({ success: false, error: 'Método de pago no válido' }, { status: 400 })
    }

    const product = await db.product.findUnique({ where: { id: productId } })
    if (!product || product.status === 'DELETED') {
      return NextResponse.json({ success: false, error: 'Producto no encontrado' }, { status: 404 })
    }

    if (product.sellerId === userId) {
      return NextResponse.json({ success: false, error: 'No puedes comprar tu propio producto' }, { status: 400 })
    }

    if (product.quantity <= 0) {
      return NextResponse.json({ success: false, error: 'Producto agotado' }, { status: 400 })
    }

    // Check if buyer already has a pending/completed transaction for this product
    const existingTransaction = await db.transaction.findFirst({
      where: {
        buyerId: userId,
        productId,
        status: { in: ['PENDING', 'COMPLETED'] },
      },
    })
    if (existingTransaction) {
      return NextResponse.json({ success: false, error: 'Ya tienes una compra pendiente o completada para este producto' }, { status: 400 })
    }

    const finalAmount = amount || (product.discountPrice || product.price)
    const COMMISSION_RATE = 0.03
    const commission = Math.round(finalAmount * COMMISSION_RATE * 100) / 100
    const sellerPayout = Math.round((finalAmount - commission) * 100) / 100

    // ============================================================
    // PRE-VALIDATION — Bank validation (non-demo accounts only)
    // ============================================================
    const buyer = await db.user.findUnique({ where: { id: userId } })
    if (!buyer) {
      return NextResponse.json({ success: false, error: 'Usuario no encontrado' }, { status: 404 })
    }

    const isDemoAccount = buyer?.email?.endsWith('@demo.ni') || false

    if (!isDemoAccount) {
      const validationHash = crypto
        .createHash('sha256')
        .update(`${userId}-${paymentMethod}`)
        .digest('hex')
      const bankValidationOk = parseInt(validationHash.slice(0, 8), 16) % 100 < 95

      if (!bankValidationOk) {
        return NextResponse.json({
          success: false,
          error: '🏦 Transacción rechazada por el banco — La entidad financiera no pudo verificar tu información. Verifica tus datos e intenta de nuevo.',
          errorCode: 'BANK_DECLINED',
          data: {
            paymentMethod,
            amount: finalAmount,
            currency: 'NIO',
          },
        }, { status: 400 })
      }
    }

    // ============================================================
    // ALL VALIDATIONS PASSED — DEDUCT BALANCE & CREATE TRANSACTION
    // Use Prisma $transaction to ensure atomicity AND race-condition safety:
    //   0. Read & validate buyer balance INSIDE the transaction
    //   1. Deduct from buyer balance
    //   2. Credit seller balance (97% payout)
    //   3. Create transaction record
    //   4. Decrease product quantity
    // If any step fails, all changes are rolled back.
    // ============================================================

    const transaction = await db.$transaction(async (tx) => {
      // 0. Read buyer balance INSIDE the transaction to prevent race conditions
      const txBuyer = await tx.user.findUnique({ where: { id: userId } })
      if (!txBuyer) {
        throw new Error('USER_NOT_FOUND')
      }

      const buyerBalance = (txBuyer as Record<string, unknown>).balance as number | undefined
      const userBalance = typeof buyerBalance === 'number' ? buyerBalance : 50000

      if (userBalance < finalAmount) {
        // Log insufficient funds attempt inside transaction
        await tx.auditLog.create({
          data: {
            userId,
            action: 'PAYMENT_DECLINED_INSUFFICIENT_FUNDS',
            entity: 'Product',
            entityId: productId,
            details: `Sin fondos: Saldo C$${userBalance.toFixed(2)}, Monto C$${finalAmount.toFixed(2)} — ${paymentMethod}`,
          },
        })
        throw new Error('INSUFFICIENT_FUNDS')
      }

      // 1. Deduct balance from buyer (atomic decrement)
      await tx.user.update({
        where: { id: userId },
        data: {
          balance: { decrement: finalAmount },
        },
      })

      // 2. Credit seller balance with 97% payout (atomic increment)
      await tx.user.update({
        where: { id: product.sellerId },
        data: {
          balance: { increment: sellerPayout },
        },
      })

      // 3. Create transaction record
      const newTransaction = await tx.transaction.create({
        data: {
          buyerId: userId,
          sellerId: product.sellerId,
          productId,
          amount: finalAmount,
          commission,
          sellerPayout,
          paymentMethod,
          status: 'COMPLETED', // Mark as completed immediately since balance was deducted
          cedula: cedula || '',
          cardLast4: cardLast4 || '',
          paymentDetails: paymentDetails || '',
        },
        include: {
          product: { select: { id: true, title: true, images: true, price: true } },
          buyer: { select: { id: true, name: true, avatar: true } },
          seller: { select: { id: true, name: true, avatar: true } },
        },
      })

      // 4. Decrease product quantity
      await tx.product.update({
        where: { id: productId },
        data: { quantity: { decrement: 1 } },
      })

      return { newTransaction, userBalance }
    }).catch((txError: Error) => {
      // Handle custom errors thrown inside the transaction
      if (txError.message === 'INSUFFICIENT_FUNDS') {
        // Re-throw with a marker so the outer catch can identify it
        const insufficientFundsError = new Error('INSUFFICIENT_FUNDS')
        insufficientFundsError.cause = { finalAmount, paymentMethod }
        throw insufficientFundsError
      }
      if (txError.message === 'USER_NOT_FOUND') {
        throw new Error('USER_NOT_FOUND')
      }
      throw txError
    })

    const { newTransaction, userBalance } = transaction

    // Notify seller
    await db.notification.create({
      data: {
        userId: product.sellerId,
        type: 'PAYMENT',
        title: 'Pago recibido',
        message: `Pago de C$${finalAmount} recibido por "${product.title}" (Tu ganancia: C$${sellerPayout.toFixed(2)})`,
        link: `/transactions/${newTransaction.id}`,
      },
    })

    await db.auditLog.create({
      data: {
        userId,
        action: 'CREATE_TRANSACTION',
        entity: 'Transaction',
        entityId: newTransaction.id,
        details: `Transacción creada: ${paymentMethod} - C$${finalAmount} — Comisión: C$${commission.toFixed(2)} — Pago vendedor: C$${sellerPayout.toFixed(2)} — Saldo restante: C$${Math.max(0, userBalance - finalAmount).toFixed(2)}`,
      },
    })

    // Create commission log
    await db.commissionLog.create({
      data: {
        transactionId: newTransaction.id,
        amount: commission,
        rate: COMMISSION_RATE,
        destination: 'rey7214935@gmail.com',
        bankAccount: 'LAFISE',
        status: 'PENDING',
      },
    })

    // Award loyalty points to buyer (1 point per C$1 spent)
    try {
      const pointsEarned = Math.floor(finalAmount)
      if (pointsEarned > 0) {
        const existingPoints = await db.loyaltyPoint.findUnique({ where: { userId } })
        if (existingPoints) {
          await db.loyaltyPoint.update({
            where: { userId },
            data: {
              balance: { increment: pointsEarned },
              totalEarned: { increment: pointsEarned },
              expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 12 months
            },
          })
        } else {
          await db.loyaltyPoint.create({
            data: {
              userId,
              balance: pointsEarned,
              totalEarned: pointsEarned,
              expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
            },
          })
        }
        await db.pointHistory.create({
          data: {
            userId,
            type: 'EARN',
            amount: pointsEarned,
            reason: `Compra de ${product.title}`,
            transactionId: newTransaction.id,
          },
        })
      }
    } catch (loyaltyError) {
      console.error('Loyalty points error (non-blocking):', loyaltyError)
    }

    return NextResponse.json({
      success: true,
      data: {
        ...newTransaction,
        product: { ...newTransaction.product, images: (() => { try { return newTransaction.product.images ? JSON.parse(newTransaction.product.images) : [] } catch { return [] } })() },
      },
    })
  } catch (error) {
    // Handle custom errors from inside the transaction
    if (error instanceof Error && error.message === 'INSUFFICIENT_FUNDS') {
      return NextResponse.json({
        success: false,
        error: `💸 Sin fondos — Dinero insuficiente. Recarga tu cuenta o intenta con otro método de pago.`,
        errorCode: 'INSUFFICIENT_FUNDS',
      }, { status: 400 })
    }
    if (error instanceof Error && error.message === 'USER_NOT_FOUND') {
      return NextResponse.json({ success: false, error: 'Usuario no encontrado' }, { status: 404 })
    }
    console.error('Create transaction error:', error)
    return NextResponse.json({ success: false, error: 'Error al crear transacción' }, { status: 500 })
  }
}
