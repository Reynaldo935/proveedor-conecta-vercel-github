import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUserId, setAuthCookie } from '@/lib/auth'
import { db } from '@/lib/db'

// Plan pricing map
const PLAN_AMOUNTS: Record<string, number> = {
  THREE_DAYS: 250,
  WEEKLY: 500,
  MONTHLY: 1500,
}

const PLAN_DURATIONS: Record<string, number> = {
  THREE_DAYS: 3,
  WEEKLY: 7,
  MONTHLY: 30,
}

export async function GET(request: NextRequest) {
  try {
    const userId = await getAuthenticatedUserId(request)

    if (!userId) {
      return NextResponse.json({ success: false, error: 'No autenticado' }, { status: 401 })
    }
    await setAuthCookie(userId)

    const user = await db.user.findUnique({ where: { id: userId } })
    if (!user || user.email !== 'rey7214935@gmail.com') {
      return NextResponse.json({ success: false, error: 'Acceso denegado' }, { status: 403 })
    }

    const ads = await db.advertisement.findMany({
      include: {
        seller: {
          select: { name: true, email: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ success: true, data: ads })
  } catch (error) {
    console.error('Advertisements error:', error)
    return NextResponse.json({ success: false, error: 'Error al obtener anuncios' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getAuthenticatedUserId(request)

    if (!userId) {
      return NextResponse.json({ success: false, error: 'No autenticado' }, { status: 401 })
    }
    await setAuthCookie(userId)

    const body = await request.json()
    const { title, description, imageUrl, targetUrl, plan, type, amount } = body

    // Validate required fields
    if (!title || typeof title !== 'string' || title.trim().length < 3) {
      return NextResponse.json(
        { success: false, error: 'El título es obligatorio (mínimo 3 caracteres)' },
        { status: 400 }
      )
    }

    if (!plan || !PLAN_AMOUNTS[plan]) {
      return NextResponse.json(
        { success: false, error: 'Plan inválido. Opciones: THREE_DAYS, WEEKLY, MONTHLY' },
        { status: 400 }
      )
    }

    if (!type || type !== 'PUBLISH') {
      return NextResponse.json(
        { success: false, error: 'Tipo de anuncio inválido' },
        { status: 400 }
      )
    }

    // Verify amount matches plan
    const expectedAmount = PLAN_AMOUNTS[plan]
    if (amount !== expectedAmount) {
      return NextResponse.json(
        { success: false, error: `El monto no coincide con el plan seleccionado. Esperado: C$${expectedAmount}` },
        { status: 400 }
      )
    }

    // Check user balance
    const user = await db.user.findUnique({ where: { id: userId } })
    if (!user) {
      return NextResponse.json({ success: false, error: 'Usuario no encontrado' }, { status: 404 })
    }

    if (user.balance < expectedAmount) {
      return NextResponse.json(
        { success: false, error: `Saldo insuficiente. Necesitas C$${expectedAmount} y tienes C$${Math.floor(user.balance)}` },
        { status: 400 }
      )
    }

    // Calculate ad dates
    const durationDays = PLAN_DURATIONS[plan] || 7
    const startDate = new Date()
    const endDate = new Date()
    endDate.setDate(endDate.getDate() + durationDays)

    // Deduct balance and create ad in a transaction
    const result = await db.$transaction(async (tx) => {
      // Deduct from user balance
      await tx.user.update({
        where: { id: userId },
        data: { balance: { decrement: expectedAmount } },
      })

      // Create advertisement
      const ad = await tx.advertisement.create({
        data: {
          sellerId: userId,
          type: type,
          plan: plan,
          title: title.trim(),
          description: description?.trim() || '',
          imageUrl: imageUrl || '',
          targetUrl: targetUrl?.trim() || '',
          amount: expectedAmount,
          status: 'PENDING', // Needs admin approval
          startDate,
          endDate,
        },
        include: {
          seller: { select: { name: true, email: true } },
        },
      })

      return ad
    })

    return NextResponse.json({
      success: true,
      data: result,
      message: 'Anuncio creado exitosamente. Será activado tras revisión.',
    })
  } catch (error) {
    console.error('Create advertisement error:', error)
    return NextResponse.json(
      { success: false, error: 'Error al crear anuncio' },
      { status: 500 }
    )
  }
}
