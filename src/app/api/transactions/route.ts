import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const userId = cookieStore.get('pc_user_id')?.value

    if (!userId) {
      return NextResponse.json({ success: false, error: 'No autenticado' }, { status: 401 })
    }

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
        product: { ...t.product, images: t.product.images ? JSON.parse(t.product.images) : [] },
      })),
    })
  } catch (error) {
    console.error('Get transactions error:', error)
    return NextResponse.json({ success: false, error: 'Error al obtener transacciones' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const userId = cookieStore.get('pc_user_id')?.value

    if (!userId) {
      return NextResponse.json({ success: false, error: 'No autenticado' }, { status: 401 })
    }

    const body = await request.json()
    const { productId, paymentMethod, cedula, cardLast4, paymentDetails, amount } = body

    if (!productId || !paymentMethod) {
      return NextResponse.json({ success: false, error: 'Producto y método de pago son requeridos' }, { status: 400 })
    }

    const validPaymentMethods = ['PAYPAL', 'BANPRO', 'BAC', 'LAFISE', 'BILLETERA']
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

    const finalAmount = amount || (product.discountPrice || product.price)

    const transaction = await db.transaction.create({
      data: {
        buyerId: userId,
        sellerId: product.sellerId,
        productId,
        amount: finalAmount,
        paymentMethod,
        status: 'PENDING',
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

    // Simulate payment processing - complete after 2 seconds
    setTimeout(async () => {
      try {
        await db.transaction.update({
          where: { id: transaction.id },
          data: { status: 'COMPLETED' },
        })
        await db.notification.create({
          data: {
            userId: product.sellerId,
            type: 'PAYMENT',
            title: 'Pago recibido',
            message: `Pago de C$${finalAmount} recibido por "${product.title}"`,
            link: `/transactions/${transaction.id}`,
          },
        })
      } catch (e) {
        console.error('Payment processing error:', e)
      }
    }, 2000)

    await db.auditLog.create({
      data: {
        userId,
        action: 'CREATE_TRANSACTION',
        entity: 'Transaction',
        entityId: transaction.id,
        details: `Transacción creada: ${paymentMethod} - C$${finalAmount}`,
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        ...transaction,
        product: { ...transaction.product, images: transaction.product.images ? JSON.parse(transaction.product.images) : [] },
      },
    })
  } catch (error) {
    console.error('Create transaction error:', error)
    return NextResponse.json({ success: false, error: 'Error al crear transacción' }, { status: 500 })
  }
}
