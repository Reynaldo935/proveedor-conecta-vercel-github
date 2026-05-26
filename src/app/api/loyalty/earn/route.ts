import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthenticatedUserId, setAuthCookie } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const userId = await getAuthenticatedUserId(request)

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'No autenticado' },
        { status: 401 }
      )
    }

    await setAuthCookie(userId)

    const body = await request.json()
    const { userId: targetUserId, amount, transactionId } = body

    // Use targetUserId if provided (for internal calls), otherwise use authenticated user
    const effectiveUserId = targetUserId || userId

    if (!amount || typeof amount !== 'number' || amount <= 0) {
      return NextResponse.json(
        { success: false, error: 'Monto inválido' },
        { status: 400 }
      )
    }

    // 1 point per C$1 spent
    let pointsEarned = Math.floor(amount)

    // Check for bonus points from product settings (2x points)
    let bonusMultiplier = 1
    if (transactionId) {
      const transaction = await db.transaction.findUnique({
        where: { id: transactionId },
        include: { product: true },
      })
      if (transaction) {
        // Check if product has discount (could indicate promotional bonus)
        // For now, we just check quantityDiscounts as a proxy for promotional products
        const quantityDiscounts = await db.quantityDiscount.findMany({
          where: { productId: transaction.productId },
        })
        if (quantityDiscounts.length > 0) {
          bonusMultiplier = 2
          pointsEarned = pointsEarned * bonusMultiplier
        }
      }
    }

    if (pointsEarned <= 0) {
      return NextResponse.json({
        success: true,
        data: { pointsEarned: 0, message: 'No se generaron puntos' },
      })
    }

    // Update or create loyalty points
    const existingPoints = await db.loyaltyPoint.findUnique({
      where: { userId: effectiveUserId },
    })

    if (existingPoints) {
      await db.loyaltyPoint.update({
        where: { userId: effectiveUserId },
        data: {
          balance: { increment: pointsEarned },
          totalEarned: { increment: pointsEarned },
          expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        },
      })
    } else {
      await db.loyaltyPoint.create({
        data: {
          userId: effectiveUserId,
          balance: pointsEarned,
          totalEarned: pointsEarned,
          expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        },
      })
    }

    // Create history entry
    const reason = transactionId
      ? bonusMultiplier > 1
        ? `Ganancia de ${pointsEarned} puntos (2x bonificación) por compra`
        : `Ganancia de ${pointsEarned} puntos por compra`
      : `Ganancia de ${pointsEarned} puntos`

    await db.pointHistory.create({
      data: {
        userId: effectiveUserId,
        type: bonusMultiplier > 1 ? 'BONUS' : 'EARN',
        amount: pointsEarned,
        reason,
        transactionId: transactionId || null,
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        pointsEarned,
        bonusMultiplier,
        message: bonusMultiplier > 1
          ? `¡Ganaste ${pointsEarned} puntos (2x bonificación)!`
          : `Ganaste ${pointsEarned} puntos`,
      },
    })
  } catch (error) {
    console.error('Earn loyalty points error:', error)
    return NextResponse.json(
      { success: false, error: 'Error al otorgar puntos' },
      { status: 400 }
    )
  }
}
