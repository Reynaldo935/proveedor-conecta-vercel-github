import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const scope = searchParams.get('scope') || 'user'

    if (scope === 'platform') {
      // Platform-wide statistics (public)
      const totalProducts = await db.product.count()
      const activeProducts = await db.product.count({ where: { status: 'ACTIVE' } })
      const totalUsers = await db.user.count()
      const totalSellers = await db.user.count({ where: { role: 'SELLER' } })
      const totalTransactions = await db.transaction.count({ where: { status: 'COMPLETED' } })
      const totalCotizaciones = await db.cotizacion.count()
      const openCotizaciones = await db.cotizacion.count({ where: { status: 'OPEN' } })

      // Calculate total revenue from completed transactions
      const completedTransactions = await db.transaction.findMany({
        where: { status: 'COMPLETED' },
        select: { amount: true },
      })
      const totalRevenue = completedTransactions.reduce((sum, t) => sum + t.amount, 0)

      return NextResponse.json({
        success: true,
        data: {
          totalProducts,
          activeProducts,
          totalUsers,
          totalSellers,
          totalBuyers: totalUsers - totalSellers,
          totalTransactions,
          totalRevenue,
          totalCotizaciones,
          openCotizaciones,
        },
      })
    }

    // User-specific statistics
    const cookieStore = await cookies()
    const userId = cookieStore.get('pc_user_id')?.value
    if (!userId) return NextResponse.json({ success: false, error: 'No autenticado' }, { status: 401 })

    const user = await db.user.findUnique({ where: { id: userId } })
    if (!user) return NextResponse.json({ success: false, error: 'Usuario no encontrado' }, { status: 404 })

    if (user.role === 'SELLER') {
      const totalProducts = await db.product.count({ where: { sellerId: userId } })
      const activeProducts = await db.product.count({ where: { sellerId: userId, status: 'ACTIVE' } })
      const totalLikes = await db.like.count({ where: { product: { sellerId: userId } } })
      const totalTransactions = await db.transaction.count({ where: { sellerId: userId, status: 'COMPLETED' } })
      const followerCount = await db.follow.count({ where: { followingId: userId } })

      // Calculate revenue manually
      const sellerTransactions = await db.transaction.findMany({
        where: { sellerId: userId, status: 'COMPLETED' },
        select: { amount: true },
      })
      const totalRevenue = sellerTransactions.reduce((sum, t) => sum + t.amount, 0)

      return NextResponse.json({
        success: true,
        data: {
          role: 'SELLER',
          totalProducts,
          activeProducts,
          totalLikes,
          totalTransactions,
          totalRevenue,
          followerCount,
        },
      })
    } else {
      // Buyer stats
      const totalPurchases = await db.transaction.count({ where: { buyerId: userId, status: 'COMPLETED' } })
      const pendingOrders = await db.transaction.count({ where: { buyerId: userId, status: 'PENDING' } })
      const savedProducts = await db.savedProduct.count({ where: { userId } })
      const followingCount = await db.follow.count({ where: { followerId: userId } })

      // Calculate spent manually
      const buyerTransactions = await db.transaction.findMany({
        where: { buyerId: userId, status: 'COMPLETED' },
        select: { amount: true },
      })
      const totalSpent = buyerTransactions.reduce((sum, t) => sum + t.amount, 0)

      return NextResponse.json({
        success: true,
        data: {
          role: 'BUYER',
          totalPurchases,
          totalSpent,
          pendingOrders,
          savedProducts,
          followingCount,
        },
      })
    }
  } catch (error) {
    console.error('Stats error:', error)
    return NextResponse.json({ success: false, error: 'Error al obtener estadísticas' }, { status: 500 })
  }
}
