import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthenticatedUser, setAuthCookie } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request)

    if (!user) {
      return NextResponse.json({ success: false, error: 'No autenticado' }, { status: 401 })
    }

    const userId = user.id as string
    const RECHARGE_AMOUNT = 10000 // C$10,000 per recharge

    const updatedUser = await db.user.update({
      where: { id: userId },
      data: {
        balance: { increment: RECHARGE_AMOUNT },
      },
      include: { businessProfile: true },
    })

    // Re-set auth cookie
    await setAuthCookie(userId)

    // Create audit log
    await db.auditLog.create({
      data: {
        userId,
        action: 'BALANCE_RECHARGE',
        entity: 'User',
        entityId: userId,
        details: `Saldo recargado: +C$${RECHARGE_AMOUNT} — Nuevo saldo: C$${updatedUser.balance}`,
      },
    })

    const { password: _, ...safeUser } = updatedUser
    return NextResponse.json({
      success: true,
      data: {
        ...safeUser,
        phoneVerified: updatedUser.phoneVerified,
      },
    })
  } catch (error) {
    console.error('Recharge error:', error)
    return NextResponse.json({ success: false, error: 'Error al recargar saldo' }, { status: 500 })
  }
}
