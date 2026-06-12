/**
 * Currency Exchange Rate API Route
 * GET /api/currencies
 *
 * Returns exchange rates for USD/NIO and EUR/NIO.
 * Uses free exchange rate APIs with fallback to the payments module.
 */

import { NextResponse } from 'next/server'
import { getExchangeRate } from '@/lib/payments'

// Cached rates (in-memory, short-lived)
let _cachedRates: {
  USD_NIO: number
  EUR_NIO: number
  source: string
  updatedAt: number
} | null = null

const CACHE_DURATION_MS = 30 * 60 * 1000 // 30 minutes

export async function GET() {
  try {
    // Return cached rates if still valid
    if (_cachedRates && Date.now() - _cachedRates.updatedAt < CACHE_DURATION_MS) {
      return NextResponse.json({
        success: true,
        data: {
          USD_NIO: _cachedRates.USD_NIO,
          EUR_NIO: _cachedRates.EUR_NIO,
          source: _cachedRates.source,
          updatedAt: new Date(_cachedRates.updatedAt).toISOString(),
        },
      })
    }

    // Try fetching from free API first
    try {
      const response = await fetch('https://open.er-api.com/v6/latest/USD', {
        signal: AbortSignal.timeout(5000),
      })

      if (response.ok) {
        const data = await response.json()
        const nioRate = data.rates?.NIO as number | undefined
        const eurToUsd = data.rates?.EUR as number | undefined

        if (nioRate && eurToUsd) {
          const eurNio = Math.round((nioRate / eurToUsd) * 100) / 100

          _cachedRates = {
            USD_NIO: Math.round(nioRate * 100) / 100,
            EUR_NIO: eurNio,
            source: 'open.er-api.com',
            updatedAt: Date.now(),
          }

          return NextResponse.json({
            success: true,
            data: {
              USD_NIO: _cachedRates.USD_NIO,
              EUR_NIO: _cachedRates.EUR_NIO,
              source: _cachedRates.source,
              updatedAt: new Date(_cachedRates.updatedAt).toISOString(),
            },
          })
        }
      }
    } catch (fetchError) {
      console.warn('[Currencies API] Primary API failed:', fetchError instanceof Error ? fetchError.message : fetchError)
    }

    // Fallback: use the exchange rate from payments module
    try {
      const rateResult = await getExchangeRate()

      // Estimate EUR/NIO from USD/NIO using approximate EUR/USD rate
      const approximateEurUsd = 1.08 // Approximate as of 2026
      const eurNio = Math.round((rateResult.rate / approximateEurUsd) * 100) / 100

      _cachedRates = {
        USD_NIO: Math.round(rateResult.rate * 100) / 100,
        EUR_NIO: eurNio,
        source: rateResult.source,
        updatedAt: Date.now(),
      }

      return NextResponse.json({
        success: true,
        data: {
          USD_NIO: _cachedRates.USD_NIO,
          EUR_NIO: _cachedRates.EUR_NIO,
          source: _cachedRates.source,
          updatedAt: new Date(_cachedRates.updatedAt).toISOString(),
        },
      })
    } catch {
      // Last resort fallback
    }

    // Ultimate fallback: static rates
    return NextResponse.json({
      success: true,
      data: {
        USD_NIO: 36.95,
        EUR_NIO: 39.81,
        source: 'fallback',
        updatedAt: new Date().toISOString(),
      },
    })
  } catch (error) {
    console.error('[Currencies API] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Error al obtener tasas de cambio' },
      { status: 200 }
    )
  }
}
