import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUserId, setAuthCookie } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const userId = await getAuthenticatedUserId(request)

    if (!userId) {
      return NextResponse.json({ success: false, error: 'No autenticado' }, { status: 200 })
    }
    await setAuthCookie(userId)

    const user = await db.user.findUnique({ where: { id: userId } })
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Acceso denegado' }, { status: 200 })
    }

    // Get platform-wide stats
    const [
      totalUsers,
      totalSellers,
      totalBuyers,
      totalProducts,
      activeProducts,
      totalTransactions,
      completedTransactions,
      totalRevenue,
      totalLikes,
      totalMessages,
    ] = await Promise.all([
      db.user.count(),
      db.user.count({ where: { role: 'SELLER' } }),
      db.user.count({ where: { role: 'BUYER' } }),
      db.product.count(),
      db.product.count({ where: { status: 'ACTIVE' } }),
      db.transaction.count(),
      db.transaction.count({ where: { status: 'COMPLETED' } }),
      db.transaction.aggregate({ _sum: { amount: true }, where: { status: 'COMPLETED' } }),
      db.like.count(),
      db.message.count(),
    ])

    const revenue = totalRevenue._sum.amount || 0
    const commission = Math.round(revenue * 0.03 * 100) / 100 // 3% commission

    // Recent signups (last 7 days)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    const recentSignups = await db.user.count({
      where: { createdAt: { gte: sevenDaysAgo } },
    })

    // Recent transactions
    const recentTransactions = await db.transaction.findMany({
      where: { status: 'COMPLETED' },
      include: {
        buyer: { select: { name: true, email: true } },
        product: { select: { title: true, price: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    })

    return NextResponse.json({
      success: true,
      data: {
        totalUsers,
        totalSellers,
        totalBuyers,
        totalProducts,
        activeProducts,
        totalTransactions,
        completedTransactions,
        totalRevenue: revenue,
        commission,
        totalLikes,
        totalMessages,
        recentSignups,
        recentTransactions,
      },
    })
  } catch (error) {
    console.error('Admin stats error:', error)
    return NextResponse.json({ success: false, error: 'Error al obtener estadísticas' }, { status: 200 })
  }
}
