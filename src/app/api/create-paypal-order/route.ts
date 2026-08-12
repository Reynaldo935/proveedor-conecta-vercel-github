/**
 * POST /api/create-paypal-order
 * Crea una orden de pago PayPal (PagoStore)
 * Usa sandbox por defecto para pruebas
 */

import { NextResponse } from 'next/server'
import { createPayPalOrder } from '@/lib/payments'

export async function POST(request: Request) {
  try {
    const { amount, currency = 'USD', description = 'Compra en ProveedorConecta' } = await request.json()

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: 'Monto inválido' },
        { status: 400 }
      )
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://proveedor-conecta-vercel-github.vercel.app'

    const result = await createPayPalOrder({
      amount,
      currency,
      description,
      returnUrl: `${appUrl}/payment/success?gateway=paypal`,
      cancelUrl: `${appUrl}/checkout?cancelled=1`,
    })

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Error al crear orden PayPal' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      orderID: result.orderId,
      approveUrl: result.approveUrl,
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Error interno' },
      { status: 500 }
    )
  }
}
