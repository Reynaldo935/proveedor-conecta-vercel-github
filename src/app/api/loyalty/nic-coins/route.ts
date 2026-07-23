/**
 * NIC Coins Payment & Loyalty API
 * ProveedorConecta Nicaragua
 * 
 * NIC Coins are a platform-native token: 1 NIC Coin = 1 Córdoba (NIO)
 * Earned through loyalty points and usable as payment method.
 * 
 * Endpoints:
 * - GET  /api/loyalty/nic-coins  → Get user NIC Coins balance
 * - POST /api/loyalty/nic-coins  → Redeem loyalty points → NIC Coins
 * - GET  /api/loyalty/nic-coins/rates → Get conversion rates
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthenticatedUserId, setAuthCookie } from '@/lib/auth'

// Conversion: 10 loyalty points = 1 NIC Coin = C$1
const POINTS_PER_NIC_COIN = 10
const NIC_COIN_VALUE_NIO = 1 // 1 NIC Coin = 1 Córdoba

export async function GET(request: NextRequest) {
  try {
    const userId = await getAuthenticatedUserId(request)
    if (!userId) {
      return NextResponse.json({ success: false, message: 'No autenticado' }, { status: 200 })
    }
    await setAuthCookie(userId)

    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action') || 'balance'

    if (action === 'rates') {
      return NextResponse.json({
        success: true,
        data: {
          pointsPerNicCoin: POINTS_PER_NIC_COIN,
          nicCoinValueNIO: NIC_COIN_VALUE_NIO,
          description: '10 puntos de lealtad = 1 NIC Coin = C$1 córdoba',
        },
      })
    }

    // Get user's NIC Coins wallet and loyalty points
    const loyaltyPoints = await db.loyaltyPoint.findUnique({ where: { userId } })
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { balance: true },
    })

    return NextResponse.json({
      success: true,
      data: {
        loyaltyPoints: loyaltyPoints?.balance || 0,
        totalLoyaltyEarned: loyaltyPoints?.totalEarned || 0,
        totalLoyaltyRedeemed: loyaltyPoints?.totalRedeemed || 0,
        nicCoins: user?.balance || 0,
        walletBalanceNIO: user?.balance || 0,
        conversionRate: `${POINTS_PER_NIC_COIN} puntos = 1 NIC Coin = C$${NIC_COIN_VALUE_NIO}`,
      },
    })
  } catch (error) {
    console.error('NIC Coins GET error:', error)
    return NextResponse.json({ success: false, message: 'Error al obtener NIC Coins' }, { status: 200 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getAuthenticatedUserId(request)
    if (!userId) {
      return NextResponse.json({ success: false, message: 'No autenticado' }, { status: 200 })
    }
    await setAuthCookie(userId)

    const body = await request.json()
    const { action, points } = body

    if (action === 'redeem') {
      // Convert loyalty points to NIC Coins
      const pointsToRedeem = parseInt(points) || 0
      if (pointsToRedeem < POINTS_PER_NIC_COIN) {
        return NextResponse.json({
          success: false,
          message: `Se necesitan al menos ${POINTS_PER_NIC_COIN} puntos para convertir a NIC Coins`,
        }, { status: 200 })
      }

      const loyaltyData = await db.loyaltyPoint.findUnique({ where: { userId } })
      if (!loyaltyData || loyaltyData.balance < pointsToRedeem) {
        return NextResponse.json({
          success: false,
          message: 'Puntos de lealtad insuficientes',
        }, { status: 200 })
      }

      const nicCoinsEarned = Math.floor(pointsToRedeem / POINTS_PER_NIC_COIN)
      const pointsUsed = nicCoinsEarned * POINTS_PER_NIC_COIN

      await db.$transaction(async (tx) => {
        // Deduct loyalty points
        await tx.loyaltyPoint.update({
          where: { userId },
          data: {
            balance: { decrement: pointsUsed },
            totalRedeemed: { increment: pointsUsed },
          },
        })

        // Create point history record
        await tx.pointHistory.create({
          data: {
            userId,
            type: 'REDEEM',
            amount: -pointsUsed,
            reason: `Convertido a ${nicCoinsEarned} NIC Coins (${POINTS_PER_NIC_COIN} pts por NIC Coin)`,
          },
        })

        // Add NIC Coins to user (using balance field for now, or a dedicated field)
        // We use the user's balance as NIC Coins wallet since 1 NIC Coin = C$1
        await tx.user.update({
          where: { id: userId },
          data: {
            balance: { increment: nicCoinsEarned },
          },
        })
      })

      return NextResponse.json({
        success: true,
        data: {
          pointsRedeemed: pointsUsed,
          nicCoinsEarned,
          message: `¡Convertido! ${pointsUsed} puntos → ${nicCoinsEarned} NIC Coins (valor: C$${nicCoinsEarned})`,
        },
      })
    }

    if (action === 'pay-with-nic-coins') {
      // Pay using NIC Coins (internal ledger transaction)
      const { amount, productId, sellerId } = body

      if (!amount || amount <= 0) {
        return NextResponse.json({ success: false, message: 'Monto inválido' }, { status: 200 })
      }

      const result = await db.$transaction(async (tx) => {
        const buyer = await tx.user.findUnique({ where: { id: userId } })
        if (!buyer || buyer.balance < amount) {
          throw new Error('INSUFFICIENT_NIC_COINS')
        }

        const COMMISSION_RATE = 0.03
        const commission = Math.round(amount * COMMISSION_RATE * 100) / 100
        const sellerPayout = Math.round((amount - commission) * 100) / 100

        // Deduct from buyer (NIC Coins / balance)
        await tx.user.update({
          where: { id: userId },
          data: { balance: { decrement: amount } },
        })

        // Credit seller 97%
        await tx.user.update({
          where: { id: sellerId },
          data: { balance: { increment: sellerPayout } },
        })

        // Create transaction
        const transaction = await tx.transaction.create({
          data: {
            buyerId: userId,
            sellerId,
            productId: productId || 'nic-coins-payment',
            amount,
            commission,
            sellerPayout,
            paymentMethod: 'NIC_COINS',
            status: 'COMPLETED',
            paymentDetails: JSON.stringify({ currency: 'NIC_COINS', rate: '1:1 NIO' }),
          },
        })

        // Create commission log
        await tx.commissionLog.create({
          data: {
            transactionId: transaction.id,
            amount: commission,
            rate: COMMISSION_RATE,
            destination: 'rey7214935@gmail.com',
            bankAccount: 'LAFISE',
            status: 'PENDING',
          },
        })

        return transaction
      }).catch((err: Error) => {
        if (err.message === 'INSUFFICIENT_NIC_COINS') throw err
        throw err
      })

      return NextResponse.json({
        success: true,
        data: {
          transaction: result,
          message: 'Pago con NIC Coins completado exitosamente',
        },
      })
    }

    return NextResponse.json({ success: false, message: 'Acción no válida' }, { status: 200 })
  } catch (error: any) {
    if (error?.message === 'INSUFFICIENT_NIC_COINS') {
      return NextResponse.json({
        success: false,
        message: 'NIC Coins insuficientes. Gana más puntos de lealtad comprando productos.',
      }, { status: 200 })
    }
    console.error('NIC Coins POST error:', error)
    return NextResponse.json({ success: false, message: 'Error al procesar NIC Coins' }, { status: 200 })
  }
}
