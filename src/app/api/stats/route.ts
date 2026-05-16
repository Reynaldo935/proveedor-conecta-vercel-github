import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { cookies } from 'next/headers'

export async function GET() {
  try {
    const cookieStore = await cookies()
    const userId = cookieStore.get('pc_user_id')?.value
    if (!userId) return NextResponse.json({ success: false, error: 'No autenticado' }, { status: 401 })

    const [totalProducts, activeProducts, totalLikes, totalTransactions, totalRevenue, pendingCotizaciones] = await Promise.all([
      db.product.count({ where: { sellerId: userId } }),
      db.product.count({ where: { sellerId: userId, status: 'ACTIVE' } }),
      db.like.count({ where: { product: { sellerId: userId } } }),
      db.transaction.count({ where: { sellerId: userId, status: 'COMPLETED' } }),
      db.transaction.aggregate({ where: { sellerId: userId, status: 'COMPLETED' }, _sum: { amount: true } }),
      db.cotizacion.count({ where: { responses: { some: { sellerId: userId, status: 'PENDING' } } } }),
    ])

    return NextResponse.json({
      success: true,
      data: {
        totalProducts,
        activeProducts,
        totalLikes,
        totalTransactions,
        totalRevenue: totalRevenue._sum.amount || 0,
        pendingCotizaciones,
      },
    })
  } catch (error) {
    console.error('Stats error:', error)
    return NextResponse.json({ success: false, error: 'Error al obtener estadísticas' }, { status: 500 })
  }
}
