/**
 * GET /api/cron/refresh-prices
 * 
 * Price refresh mechanism for Nicaraguan suppliers.
 * In production, this would scrape or call supplier APIs.
 * Currently simulates price variations (±5%) to keep listings dynamic.
 * 
 * Protected by CRON_SECRET header/query param.
 * Designed to be called by Vercel Cron Jobs every 24 hours.
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

function verifyCronSecret(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) return true // Dev mode: allow if no secret configured

  const headerSecret = request.headers.get('x-cron-secret')
  const querySecret = new URL(request.url).searchParams.get('secret')

  return headerSecret === secret || querySecret === secret
}

function simulatePriceVariation(basePrice: number): number {
  // Simulate ±5% random variation to keep prices dynamic
  const variation = 0.95 + Math.random() * 0.10 // 0.95 to 1.05
  return Math.round(basePrice * variation * 100) / 100
}

export async function GET(request: NextRequest) {
  try {
    if (!verifyCronSecret(request)) {
      return NextResponse.json({ success: false, message: 'Acceso no autorizado' }, { status: 200 })
    }

    // Refresh prices for all ACTIVE products in DB
    const products = await db.product.findMany({
      where: { status: 'ACTIVE' },
      select: { id: true, price: true, discountPrice: true, title: true },
    })

    let updatedCount = 0

    for (const product of products) {
      // Only update non-discount prices slightly to simulate market changes
      const newPrice = simulatePriceVariation(product.price)
      // Only update if variation is meaningful (>1% change)
      if (Math.abs(newPrice - product.price) / product.price > 0.01) {
        await db.product.update({
          where: { id: product.id },
          data: { price: newPrice },
        })
        updatedCount++
      }
    }

    // Log the price refresh audit entry
    try {
      await db.auditLog.create({
        data: {
          userId: 'system',
          action: 'PRICE_REFRESH',
          entity: 'Product',
          entityId: 'batch',
          details: `Precios actualizados: ${updatedCount} de ${products.length} productos`,
        },
      })
    } catch { /* audit log may fail if system user doesn't exist */ }

    return NextResponse.json({
      success: true,
      data: {
        totalProducts: products.length,
        updatedPrices: updatedCount,
        timestamp: new Date().toISOString(),
        nextRefresh: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      },
    })
  } catch (error) {
    console.error('Price refresh error:', error)
    return NextResponse.json({ success: false, message: 'Error al actualizar precios' }, { status: 200 })
  }
}
