/**
 * GET /api/payments/redirect — Redirect to real bank payment channels
 * 
 * Each payment method redirects to the actual Nicaraguan bank/payment gateway.
 * URL params: method, amount, description
 */
import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUserId } from '@/lib/auth'

const PAYMENT_URLS: Record<string, string> = {
  BANPRO: 'https://www.banpro.com.ni/personas/banca-en-linea/',
  BAC: 'https://www.baccredomatic.com/ni/',
  LAFISE: 'https://www.lafise.com/ni/',
  PAYPAL: 'https://www.paypal.com/paypalme/proveedorconecta',
  PIXELPAY: 'https://pixelpay.app/',
  PAGADITO: 'https://www.pagadito.com/',
  GOOGLE_PAY: 'https://pay.google.com/',
  KASH: 'https://kash.com.ni/',
  WESTERN_UNION: 'https://www.westernunion.com/ni',
  TIGO_MONEY: 'https://www.tigo.com.ni/tigo-money',
  BANPRO_BILLETERA: 'https://www.banpro.com.ni/personas/billetera/',
  BILLETERA: 'https://www.banpro.com.ni/personas/billetera/',
}

export async function GET(request: NextRequest) {
  try {
    const userId = await getAuthenticatedUserId(request)
    if (!userId) {
      // Even if not authenticated, redirect to payment provider
    }

    const { searchParams } = new URL(request.url)
    const method = (searchParams.get('method') || 'BANPRO').toUpperCase()
    const amount = searchParams.get('amount') || '0'
    const description = searchParams.get('description') || 'Compra en ProveedorConecta'

    const paymentUrl = PAYMENT_URLS[method]

    if (paymentUrl) {
      // Redirect to real bank/payment gateway
      return NextResponse.redirect(paymentUrl, { status: 302 })
    }

    // Fallback: show payment instructions
    return NextResponse.json({
      success: true,
      message: `Pago de C$${amount} por "${description}"`,
      method,
      instructions: getInstructions(method),
      bankAccounts: getBankAccounts(),
    })
  } catch {
    return NextResponse.json({ success: false, error: 'Error de pago' }, { status: 200 })
  }
}

function getInstructions(method: string): string {
  const instructions: Record<string, string> = {
    BANPRO: 'Transfiere a la cuenta Banpro y envía el comprobante.',
    BAC: 'Transfiere a la cuenta BAC y envía el comprobante.',
    LAFISE: 'Transfiere a la cuenta LAFISE y envía el comprobante.',
    PAYPAL: 'Envía el pago a paypal@proveedorconecta.ni.',
    BILLETERA: 'Usa tu billetera Banpro para pagar al instante.',
  }
  return instructions[method] || 'Realiza la transferencia y envía el comprobante por WhatsApp.'
}

function getBankAccounts() {
  return {
    BANPRO: { account: '100-123456-78900', name: 'ProveedorConecta Nicaragua' },
    BAC: { account: '200-987654-32100', name: 'ProveedorConecta Nicaragua' },
    LAFISE: { account: '300-555555-11111', name: 'ProveedorConecta Nicaragua' },
    whatsapp: '+505 8888-7777',
  }
}
