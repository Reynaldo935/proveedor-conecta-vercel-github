/**
 * POST /api/capture-paypal-order
 * Captura (confirma) un pago PayPal previamente autorizado
 * Crea la orden y transacción en la base de datos
 */

import { NextResponse } from 'next/server'
import { capturePayPalOrder } from '@/lib/payments'
import { db } from '@/lib/db'

export async function POST(request: Request) {
  try {
    const { orderID, productId, buyerEmail, amount, sellerId } = await request.json()

    if (!orderID) {
      return NextResponse.json(
        { error: 'orderID es requerido' },
        { status: 400 }
      )
    }

    const result = await capturePayPalOrder(orderID)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Error al capturar pago PayPal' },
        { status: 500 }
      )
    }

    // Registrar transacción en la base de datos con datos reales
    if (productId && amount) {
      try {
        // Buscar el producto para obtener el sellerId si no se proporcionó
        let finalSellerId = sellerId || 'admin'
        let productTitle = 'Producto'
        if (productId !== 'paypal-payment') {
          const product = await db.product.findUnique({
            where: { id: productId },
            select: { sellerId: true, title: true, price: true }
          })
          if (product) {
            finalSellerId = product.sellerId
            productTitle = product.title
          }
        }

        // Buscar o usar el buyerId
        let buyerId = 'guest'
        if (buyerEmail) {
          const user = await db.user.findUnique({
            where: { email: buyerEmail },
            select: { id: true }
          })
          if (user) buyerId = user.id
        }

        const commission = Math.round((amount * 0.03) * 100) / 100 // 3% commission
        const sellerPayout = Math.round((amount - commission) * 100) / 100

        await db.transaction.create({
          data: {
            buyerId,
            sellerId: finalSellerId,
            productId,
            amount,
            commission,
            sellerPayout,
            paymentMethod: 'PAYPAL',
            status: 'COMPLETED',
            paymentDetails: JSON.stringify({
              paypalOrderId: orderID,
              transactionId: result.transactionId,
              gateway: 'paypal',
              capturedAt: new Date().toISOString(),
            }),
          },
        })

        console.log(`✅ [PayPal] Transacción registrada: ${productTitle} - $${amount} - Comisión: $${commission}`)
      } catch (dbError) {
        console.warn('[PayPal] No se pudo registrar transacción en BD:', dbError)
      }
    }

    return NextResponse.json({
      status: 'COMPLETED',
      orderID: orderID,
      transactionId: result.transactionId,
      message: 'Pago procesado exitosamente',
    })
  } catch (error: any) {
    console.error('[PayPal Capture] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Error al capturar pago' },
      { status: 500 }
    )
  }
}
