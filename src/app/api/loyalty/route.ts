import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthenticatedUserId, setAuthCookie } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const userId = await getAuthenticatedUserId(request)

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'No autenticado' },
        { status: 401 }
      )
    }

    await setAuthCookie(userId)

    // Get or create loyalty points
    let loyaltyPoint = await db.loyaltyPoint.findUnique({ where: { userId } })

    if (!loyaltyPoint) {
      loyaltyPoint = await db.loyaltyPoint.create({
        data: {
          userId,
          balance: 0,
          totalEarned: 0,
          totalRedeemed: 0,
          expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        },
      })
    }

    // Get recent history
    const history = await db.pointHistory.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })

    return NextResponse.json({
      success: true,
      data: {
        balance: loyaltyPoint.balance,
        totalEarned: loyaltyPoint.totalEarned,
        totalRedeemed: loyaltyPoint.totalRedeemed,
        expiresAt: loyaltyPoint.expiresAt,
        history,
      },
    })
  } catch (error) {
    console.error('Get loyalty points error:', error)
    return NextResponse.json(
      { success: false, error: 'Error al obtener puntos de lealtad' },
      { status: 400 }
    )
  }
}

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
    const { points } = body

    if (!points || typeof points !== 'number' || points <= 0) {
      return NextResponse.json(
        { success: false, error: 'Cantidad de puntos inválida' },
        { status: 400 }
      )
    }

    // Minimum redemption: 100 points
    if (points < 100) {
      return NextResponse.json(
        { success: false, error: 'Mínimo 100 puntos para canjear' },
        { status: 400 }
      )
    }

    // Get current loyalty points
    let loyaltyPoint = await db.loyaltyPoint.findUnique({ where: { userId } })

    if (!loyaltyPoint) {
      loyaltyPoint = await db.loyaltyPoint.create({
        data: {
          userId,
          balance: 0,
          totalEarned: 0,
          totalRedeemed: 0,
          expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        },
      })
    }

    if (loyaltyPoint.balance < points) {
      return NextResponse.json(
        { success: false, error: 'Puntos insuficientes' },
        { status: 400 }
      )
    }

    // Calculate discount: 100 points = C$1
    const discountAmount = Math.floor(points / 100)

    // Deduct points
    const updatedPoints = await db.loyaltyPoint.update({
      where: { userId },
      data: {
        balance: { decrement: points },
        totalRedeemed: { increment: points },
      },
    })

    // Create history entry
    await db.pointHistory.create({
      data: {
        userId,
        type: 'REDEEM',
        amount: -points,
        reason: `Canje de ${points} puntos por C$${discountAmount} de descuento`,
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        balance: updatedPoints.balance,
        totalEarned: updatedPoints.totalEarned,
        totalRedeemed: updatedPoints.totalRedeemed,
        discountAmount,
        pointsRedeemed: points,
      },
    })
  } catch (error) {
    console.error('Redeem loyalty points error:', error)
    return NextResponse.json(
      { success: false, error: 'Error al canjear puntos' },
      { status: 400 }
    )
  }
}
