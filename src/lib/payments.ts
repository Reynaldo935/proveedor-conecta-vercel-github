/**
 * Payment Gateway Client Library
 * ProveedorConecta Nicaragua
 *
 * Provides server-side clients for PixelPay, Pagadito, PayPal, and Stripe.
 * Each function checks for required env vars and returns simulated/dummy
 * responses when credentials are not configured (for development).
 *
 * All functions are async and handle errors gracefully.
 * Vercel serverless compatible — no persistent connections.
 */

// ─── PixelPay (Nicaragua) ────────────────────────────────────────────────────

interface PixelPayParams {
  amount: number
  currency: string
  description: string
  customerEmail: string
  customerName: string
  orderId: string
}

interface PixelPayResult {
  success: boolean
  transactionId?: string
  redirectUrl?: string
  error?: string
}

export async function processPixelPay(params: PixelPayParams): Promise<PixelPayResult> {
  const apiKey = process.env.PIXELPAY_API_KEY
  const secret = process.env.PIXELPAY_SECRET

  // Simulated response when credentials are not configured
  if (!apiKey || !secret) {
    console.log('[PixelPay] Using simulated response (missing PIXELPAY_API_KEY or PIXELPAY_SECRET)')
    return {
      success: true,
      transactionId: `PX-SIM-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
      redirectUrl: `${(() => { const u = process.env.NEXT_PUBLIC_APP_URL; if (!u) throw new Error('NEXT_PUBLIC_APP_URL is required in production'); return u })()}/payment/success?gateway=pixelpay&order=${params.orderId}&simulated=1`,
    }
  }

  try {
    const sandbox = process.env.PIXELPAY_SANDBOX === 'true'
    const baseUrl = sandbox
      ? 'https://sandbox.pixel-pay.com/api/v2'
      : 'https://pixel-pay.com/api/v2'

    const response = await fetch(`${baseUrl}/transaction/sale`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        amount: params.amount,
        currency: params.currency,
        description: params.description,
        customer_email: params.customerEmail,
        customer_name: params.customerName,
        order_id: params.orderId,
        sandbox: sandbox,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error')
      console.error('[PixelPay] API error:', response.status, errorText)
      return { success: false, error: `PixelPay API error: ${response.status}` }
    }

    const data = await response.json()

    return {
      success: true,
      transactionId: data.id || data.transaction_id,
      redirectUrl: data.redirect_url || data.payment_url,
    }
  } catch (error) {
    console.error('[PixelPay] Error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'PixelPay processing failed',
    }
  }
}

// ─── Pagadito (Central America) ──────────────────────────────────────────────

interface PagaditoParams {
  amount: number
  currency: string
  description: string
  orderId: string
}

interface PagaditoResult {
  success: boolean
  transactionId?: string
  redirectUrl?: string
  error?: string
}

export async function processPagadito(params: PagaditoParams): Promise<PagaditoResult> {
  const uid = process.env.PAGADITO_UID
  const wsk = process.env.PAGADITO_WSK

  // Simulated response when credentials are not configured
  if (!uid || !wsk) {
    console.log('[Pagadito] Using simulated response (missing PAGADITO_UID or PAGADITO_WSK)')
    return {
      success: true,
      transactionId: `PG-SIM-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
      redirectUrl: `${(() => { const u = process.env.NEXT_PUBLIC_APP_URL; if (!u) throw new Error('NEXT_PUBLIC_APP_URL is required in production'); return u })()}/payment/success?gateway=pagadito&order=${params.orderId}&simulated=1`,
    }
  }

  try {
    const sandbox = process.env.PAGADITO_SANDBOX === 'true'
    const baseUrl = sandbox
      ? 'https://sandbox.pagadito.com/api'
      : 'https://api.pagadito.com/api'

    // Step 1: Connect to get a token
    const connectResponse = await fetch(`${baseUrl}/connect`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        uid,
        wsk,
        format_return: 'json',
      }),
    })

    if (!connectResponse.ok) {
      return { success: false, error: `Pagadito connect failed: ${connectResponse.status}` }
    }

    const connectData = await connectResponse.json()
    const token = connectData.value?.token || connectData.token

    if (!token) {
      return { success: false, error: 'Failed to obtain Pagadito token' }
    }

    // Step 2: Execute transaction
    const execResponse = await fetch(`${baseUrl}/execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token,
        ern: params.orderId,
        amount: params.amount,
        currency: params.currency,
        details: [
          {
            quantity: 1,
            description: params.description,
            price: params.amount,
          },
        ],
        format_return: 'json',
      }),
    })

    if (!execResponse.ok) {
      return { success: false, error: `Pagadito execute failed: ${execResponse.status}` }
    }

    const execData = await execResponse.json()

    return {
      success: true,
      transactionId: execData.value?.reference || execData.reference,
      redirectUrl: execData.value?.redirect_url || execData.url,
    }
  } catch (error) {
    console.error('[Pagadito] Error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Pagadito processing failed',
    }
  }
}

// ─── PayPal ──────────────────────────────────────────────────────────────────

interface PayPalOrderParams {
  amount: number
  currency: string
  description: string
  returnUrl: string
  cancelUrl: string
}

interface PayPalOrderResult {
  success: boolean
  orderId?: string
  approveUrl?: string
  error?: string
}

interface PayPalCaptureResult {
  success: boolean
  transactionId?: string
  error?: string
}

let _paypalAccessToken: { token: string; expiresAt: number } | null = null

async function getPayPalAccessToken(): Promise<string | null> {
  const clientId = process.env.PAYPAL_CLIENT_ID
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET

  if (!clientId || !clientSecret) return null

  // Use cached token if still valid
  if (_paypalAccessToken && _paypalAccessToken.expiresAt > Date.now()) {
    return _paypalAccessToken.token
  }

  const sandbox = process.env.PAYPAL_SANDBOX === 'true'
  const baseUrl = sandbox
    ? 'https://api-m.sandbox.paypal.com'
    : 'https://api-m.paypal.com'

  try {
    const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')
    const response = await fetch(`${baseUrl}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${auth}`,
      },
      body: 'grant_type=client_credentials',
    })

    if (!response.ok) return null

    const data = await response.json()
    _paypalAccessToken = {
      token: data.access_token,
      expiresAt: Date.now() + (data.expires_in - 60) * 1000, // Buffer 60 seconds
    }
    return data.access_token
  } catch {
    return null
  }
}

export async function createPayPalOrder(params: PayPalOrderParams): Promise<PayPalOrderResult> {
  const clientId = process.env.PAYPAL_CLIENT_ID
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET

  // Simulated response when credentials are not configured
  if (!clientId || !clientSecret) {
    console.log('[PayPal] Using simulated response (missing PAYPAL_CLIENT_ID or PAYPAL_CLIENT_SECRET)')
    const simOrderId = `PP-SIM-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`
    return {
      success: true,
      orderId: simOrderId,
      approveUrl: `${(() => { const u = process.env.NEXT_PUBLIC_APP_URL; if (!u) throw new Error('NEXT_PUBLIC_APP_URL is required in production'); return u })()}/payment/success?gateway=paypal&orderId=${simOrderId}&simulated=1`,
    }
  }

  try {
    const accessToken = await getPayPalAccessToken()
    if (!accessToken) {
      return { success: false, error: 'Failed to obtain PayPal access token' }
    }

    const sandbox = process.env.PAYPAL_SANDBOX === 'true'
    const baseUrl = sandbox
      ? 'https://api-m.sandbox.paypal.com'
      : 'https://api-m.paypal.com'

    const response = await fetch(`${baseUrl}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [
          {
            description: params.description,
            amount: {
              currency_code: params.currency,
              value: params.amount.toFixed(2),
            },
          },
        ],
        application_context: {
          return_url: params.returnUrl,
          cancel_url: params.cancelUrl,
          brand_name: 'ProveedorConecta Nicaragua',
          user_action: 'PAY_NOW',
        },
      }),
    })

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error')
      console.error('[PayPal] Create order error:', response.status, errorText)
      return { success: false, error: `PayPal create order failed: ${response.status}` }
    }

    const data = await response.json()
    const approveLink = data.links?.find((link: { rel: string; href: string }) => link.rel === 'approve')

    return {
      success: true,
      orderId: data.id,
      approveUrl: approveLink?.href,
    }
  } catch (error) {
    console.error('[PayPal] Create order error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'PayPal order creation failed',
    }
  }
}

export async function capturePayPalOrder(paypalOrderId: string): Promise<PayPalCaptureResult> {
  const clientId = process.env.PAYPAL_CLIENT_ID
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET

  // Simulated response when credentials are not configured
  if (!clientId || !clientSecret) {
    console.log('[PayPal] Using simulated capture response (missing credentials)')
    return {
      success: true,
      transactionId: `PP-CAPTURE-SIM-${Date.now()}`,
    }
  }

  try {
    const accessToken = await getPayPalAccessToken()
    if (!accessToken) {
      return { success: false, error: 'Failed to obtain PayPal access token' }
    }

    const sandbox = process.env.PAYPAL_SANDBOX === 'true'
    const baseUrl = sandbox
      ? 'https://api-m.sandbox.paypal.com'
      : 'https://api-m.paypal.com'

    const response = await fetch(`${baseUrl}/v2/checkout/orders/${paypalOrderId}/capture`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
    })

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error')
      console.error('[PayPal] Capture error:', response.status, errorText)
      return { success: false, error: `PayPal capture failed: ${response.status}` }
    }

    const data = await response.json()
    const captureId = data.purchase_units?.[0]?.payments?.captures?.[0]?.id

    return {
      success: true,
      transactionId: captureId || data.id,
    }
  } catch (error) {
    console.error('[PayPal] Capture error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'PayPal capture failed',
    }
  }
}

// ─── Stripe (for ad subscriptions) ───────────────────────────────────────────

interface StripeCheckoutParams {
  amount: number
  currency: string
  description: string
  successUrl: string
  cancelUrl: string
  metadata?: Record<string, string>
}

interface StripeCheckoutResult {
  success: boolean
  sessionId?: string
  url?: string
  error?: string
}

export async function createStripeCheckoutSession(params: StripeCheckoutParams): Promise<StripeCheckoutResult> {
  const secretKey = process.env.STRIPE_SECRET_KEY

  // Simulated response when credentials are not configured
  if (!secretKey) {
    console.log('[Stripe] Using simulated response (missing STRIPE_SECRET_KEY)')
    const simSessionId = `CS-SIM-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`
    return {
      success: true,
      sessionId: simSessionId,
      url: `${(() => { const u = process.env.NEXT_PUBLIC_APP_URL; if (!u) throw new Error('NEXT_PUBLIC_APP_URL is required in production'); return u })()}/payment/success?gateway=stripe&session_id=${simSessionId}&simulated=1`,
    }
  }

  try {
    // Use Stripe REST API directly (no SDK needed for Vercel serverless)
    const response = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Bearer ${secretKey}`,
      },
      body: new URLSearchParams({
        'payment_method_types[0]': 'card',
        'line_items[0][price_data][currency]': params.currency,
        'line_items[0][price_data][product_data][name]': params.description,
        'line_items[0][price_data][unit_amount]': String(Math.round(params.amount * 100)), // Stripe expects cents
        'line_items[0][quantity]': '1',
        'mode': 'payment',
        'success_url': params.successUrl,
        'cancel_url': params.cancelUrl,
        ...(params.metadata
          ? Object.entries(params.metadata).reduce(
              (acc, [key, value], index) => ({
                ...acc,
                [`metadata[${key}]`]: value,
              }),
              {}
            )
          : {}),
      }).toString(),
    })

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error')
      console.error('[Stripe] Create session error:', response.status, errorText)
      return { success: false, error: `Stripe checkout session failed: ${response.status}` }
    }

    const data = await response.json()

    return {
      success: true,
      sessionId: data.id,
      url: data.url,
    }
  } catch (error) {
    console.error('[Stripe] Create session error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Stripe checkout session creation failed',
    }
  }
}

// ─── Exchange Rate Utility ───────────────────────────────────────────────────

interface ExchangeRateResult {
  rate: number
  source: string
}

// Cached exchange rate (in-memory, short-lived)
let _cachedRate: { rate: number; source: string; updatedAt: number } | null = null
const CACHE_DURATION_MS = 30 * 60 * 1000 // 30 minutes

export async function getExchangeRate(): Promise<ExchangeRateResult> {
  // Return cached rate if still valid
  if (_cachedRate && Date.now() - _cachedRate.updatedAt < CACHE_DURATION_MS) {
    return { rate: _cachedRate.rate, source: _cachedRate.source }
  }

  try {
    // Use exchangerate-api.com free endpoint or open.er-api.com
    const response = await fetch(
      'https://open.er-api.com/v6/latest/USD',
      { next: { revalidate: 1800 } } // Cache for 30 min at fetch level
    )

    if (response.ok) {
      const data = await response.json()
      const nioRate = data.rates?.NIO
      if (nioRate) {
        _cachedRate = {
          rate: nioRate,
          source: 'open.er-api.com',
          updatedAt: Date.now(),
        }
        return { rate: nioRate, source: 'open.er-api.com' }
      }
    }

    // Fallback: try another free API
    const fallbackResponse = await fetch(
      'https://api.exchangerate.host/latest?base=USD&symbols=NIO'
    )

    if (fallbackResponse.ok) {
      const fallbackData = await fallbackResponse.json()
      const nioRate = fallbackData.rates?.NIO
      if (nioRate) {
        _cachedRate = {
          rate: nioRate,
          source: 'exchangerate.host',
          updatedAt: Date.now(),
        }
        return { rate: nioRate, source: 'exchangerate.host' }
      }
    }

    throw new Error('Could not fetch exchange rate from any source')
  } catch (error) {
    console.warn('[ExchangeRate] API failed, using fallback rate:', error)
    // Fallback to a reasonable current rate (approximate as of 2026)
    const fallbackRate = _cachedRate?.rate || 36.95
    return { rate: fallbackRate, source: 'fallback' }
  }
}
