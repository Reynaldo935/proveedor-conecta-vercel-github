/**
 * POST /api/capture-paypal-order
 * Captura (confirma) un pago PayPal previamente autorizado
 */

import { NextResponse } from 'next/server'
import { capturePayPalOrder } from '@/lib/payments'
import { db } from '@/lib/db'

export async function POST(request: Request) {
  try {
    const { orderID } = await request.json()

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

    // Registrar transacción en la base de datos
    try {
      await db.transaction.create({
        data: {
          buyerId: 'guest',
          sellerId: 'admin',
          productId: 'paypal-payment',
          amount: 0,
          commission: 0,
          sellerPayout: 0,
          paymentMethod: 'PAYPAL',
          status: 'COMPLETED',
          paymentDetails: JSON.stringify({
            paypalOrderId: orderID,
            transactionId: result.transactionId,
            gateway: 'paypal',
          }),
        },
      })
    } catch (dbError) {
      console.warn('[PayPal] Could not record transaction in DB:', dbError)
    }

    return NextResponse.json({
      status: 'COMPLETED',
      orderID: orderID,
      transactionId: result.transactionId,
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Error al capturar pago' },
      { status: 500 }
    )
  }
}
