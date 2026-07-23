/**
 * Seller Stats API
 * ProveedorConecta Nicaragua
 * 
 * GET /api/stats/seller — Returns dashboard statistics for the authenticated seller
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthenticatedUserId, setAuthCookie } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const userId = await getAuthenticatedUserId(request)
    if (!userId) {
      return NextResponse.json({ success: false, message: 'No autenticado' }, { status: 200 })
    }
    await setAuthCookie(userId)

    const { searchParams } = new URL(request.url)
    const range = searchParams.get('range') || '30d'
    const view = searchParams.get('view') || 'daily'

    // Calculate date range
    const now = new Date()
    let startDate = new Date()
    switch (range) {
      case '7d': startDate.setDate(now.getDate() - 7); break
      case '30d': startDate.setDate(now.getDate() - 30); break
      case '90d': startDate.setDate(now.getDate() - 90); break
      default: startDate = new Date(2020, 0, 1); break
    }

    // Get all completed transactions for this seller
    const transactions = await db.transaction.findMany({
      where: {
        sellerId: userId,
        status: 'COMPLETED',
        createdAt: { gte: startDate },
      },
      include: {
        product: { select: { id: true, title: true, category: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    // Calculate totals
    const totalSales = transactions.reduce((sum, t) => sum + t.amount, 0)
    const totalCommissions = transactions.reduce((sum, t) => sum + t.commission, 0)
    const netProfit = totalSales - totalCommissions
    const totalOrders = transactions.length

    // Get active products count
    const totalProducts = await db.product.count({
      where: { sellerId: userId, status: 'ACTIVE' },
    })

    // Get review stats
    const reviews = await db.review.findMany({
      where: { targetId: userId },
      select: { rating: true },
    })
    const totalReviews = reviews.length
    const averageRating = totalReviews > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews
      : 0

    // Build daily earnings data
    const dailyMap = new Map<string, { gross: number; commission: number; net: number }>()
    const categoryMap = new Map<string, number>()
    const productSalesMap = new Map<string, { title: string; sales: number; revenue: number }>()

    for (const t of transactions) {
      const dateKey = view === 'daily'
        ? t.createdAt.toISOString().slice(0, 10)
        : t.createdAt.toISOString().slice(0, 7) // YYYY-MM for monthly

      const existing = dailyMap.get(dateKey) || { gross: 0, commission: 0, net: 0 }
      existing.gross += t.amount
      existing.commission += t.commission
      existing.net += t.amount - t.commission
      dailyMap.set(dateKey, existing)

      // Category breakdown
      const cat = t.product?.category || 'Otros'
      categoryMap.set(cat, (categoryMap.get(cat) || 0) + t.amount)

      // Top products
      const prodKey = t.productId
      const prod = productSalesMap.get(prodKey) || {
        title: t.product?.title || 'Desconocido',
        sales: 0,
        revenue: 0,
      }
      prod.sales += 1
      prod.revenue += t.amount
      productSalesMap.set(prodKey, prod)
    }

    // Format daily earnings
    const dailyEarnings = Array.from(dailyMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, values]) => ({
        date: view === 'daily' ? date.slice(5) : date, // MM-DD or YYYY-MM
        ...values,
      }))
      .slice(-30) // Limit to last 30 data points

    // Format category breakdown
    const categoryBreakdown = Array.from(categoryMap.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)

    // Format top products
    const topProducts = Array.from(productSalesMap.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10)

    // Recent transactions
    const recentTransactions = transactions.slice(0, 5).map(t => ({
      id: t.id,
      productTitle: t.product?.title || 'Desconocido',
      amount: t.amount,
      commission: t.commission,
      createdAt: t.createdAt.toISOString(),
      status: t.status,
    }))

    return NextResponse.json({
      success: true,
      data: {
        totalSales,
        totalCommissions,
        netProfit,
        totalOrders,
        totalProducts,
        totalReviews,
        averageRating,
        dailyEarnings,
        categoryBreakdown,
        topProducts: topProducts.map(p => ({
          id: p.title,
          title: p.title,
          sales: p.sales,
          revenue: p.revenue,
        })),
        recentTransactions,
      },
    })
  } catch (error) {
    console.error('Seller stats error:', error)
    return NextResponse.json({ success: false, message: 'Error al obtener estadísticas' }, { status: 200 })
  }
}
