/**
 * Payment Gateway Processing API Route
 * POST /api/payments/gateways
 *
 * Authenticates the user, validates the product exists,
 * and calls the appropriate payment gateway.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUserId } from '@/lib/auth'
import { db } from '@/lib/db'
import { processPixelPay, processPagadito, createPayPalOrder, createStripeCheckoutSession } from '@/lib/payments'

type GatewayType = 'pixelpay' | 'pagadito' | 'paypal' | 'stripe'

interface GatewaysRequestBody {
  gateway: GatewayType
  productId: string
  amount: number
  currency?: string
}

const VALID_GATEWAYS: GatewayType[] = ['pixelpay', 'pagadito', 'paypal', 'stripe']

export async function POST(request: NextRequest) {
  try {
    // Authenticate the user
    const userId = await getAuthenticatedUserId(request)
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'No autenticado' },
        { status: 401 }
      )
    }

    const body: GatewaysRequestBody = await request.json()

    // Validate required fields
    if (!body.gateway || !body.productId || !body.amount) {
      return NextResponse.json(
        { success: false, error: 'Se requiere gateway, productId y amount' },
        { status: 400 }
      )
    }

    // Validate gateway type
    if (!VALID_GATEWAYS.includes(body.gateway)) {
      return NextResponse.json(
        { success: false, error: `Gateway inválido. Válidos: ${VALID_GATEWAYS.join(', ')}` },
        { status: 400 }
      )
    }

    // Validate amount is positive
    if (body.amount <= 0) {
      return NextResponse.json(
        { success: false, error: 'El monto debe ser mayor a 0' },
        { status: 400 }
      )
    }

    // Validate the product exists
    const product = await db.product.findUnique({
      where: { id: body.productId },
      include: { seller: { include: { businessProfile: true } } },
    })

    if (!product) {
      return NextResponse.json(
        { success: false, error: 'Producto no encontrado' },
        { status: 404 }
      )
    }

    // Get user info for payment
    const user = await db.user.findUnique({
      where: { id: userId },
    })

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Usuario no encontrado' },
        { status: 404 }
      )
    }

    const currency = body.currency || 'NIO'
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const orderId = `ORD-${Date.now()}-${body.productId.slice(0, 8)}`

    let result: { success: boolean; redirectUrl?: string; orderId?: string; sessionId?: string; url?: string; error?: string }

    switch (body.gateway) {
      case 'pixelpay': {
        const payResult = await processPixelPay({
          amount: body.amount,
          currency,
          description: product.title,
          customerEmail: user.email,
          customerName: user.name || user.email,
          orderId,
        })
        result = {
          success: payResult.success,
          redirectUrl: payResult.redirectUrl,
          orderId: payResult.transactionId,
          error: payResult.error,
        }
        break
      }

      case 'pagadito': {
        const payResult = await processPagadito({
          amount: body.amount,
          currency,
          description: product.title,
          orderId,
        })
        result = {
          success: payResult.success,
          redirectUrl: payResult.redirectUrl,
          orderId: payResult.transactionId,
          error: payResult.error,
        }
        break
      }

      case 'paypal': {
        const payResult = await createPayPalOrder({
          amount: body.amount,
          currency: currency === 'NIO' ? 'USD' : currency, // PayPal requires USD or supported currencies
          description: product.title,
          returnUrl: `${appUrl}/payment/success?gateway=paypal&orderId=${orderId}`,
          cancelUrl: `${appUrl}/payment/cancel?gateway=paypal&orderId=${orderId}`,
        })
        result = {
          success: payResult.success,
          redirectUrl: payResult.approveUrl,
          orderId: payResult.orderId,
          error: payResult.error,
        }
        break
      }

      case 'stripe': {
        const payResult = await createStripeCheckoutSession({
          amount: body.amount,
          currency: currency === 'NIO' ? 'usd' : currency.toLowerCase(),
          description: product.title,
          successUrl: `${appUrl}/payment/success?gateway=stripe&session_id={CHECKOUT_SESSION_ID}`,
          cancelUrl: `${appUrl}/payment/cancel?gateway=stripe`,
          metadata: {
            productId: body.productId,
            userId,
            orderId,
          },
        })
        result = {
          success: payResult.success,
          sessionId: payResult.sessionId,
          url: payResult.url,
          error: payResult.error,
        }
        break
      }
    }

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || 'Error procesando el pago' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        redirectUrl: result.redirectUrl,
        orderId: result.orderId,
        sessionId: result.sessionId,
        url: result.url,
        gateway: body.gateway,
        amount: body.amount,
        currency,
        productId: body.productId,
      },
    })
  } catch (error) {
    console.error('[Payment Gateways API] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
