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

    const { searchParams } = new URL(request.url)
    const role = searchParams.get('role') // buyer or seller

    let where: Record<string, unknown>
    if (role === 'buyer') {
      where = { buyerId: userId }
    } else if (role === 'seller') {
      where = { sellerId: userId }
    } else {
      where = {
        OR: [{ buyerId: userId }, { sellerId: userId }],
      }
    }

    const appointments = await db.appointment.findMany({
      where,
      include: {
        buyer: { select: { id: true, name: true, avatar: true } },
        seller: {
          select: {
            id: true,
            name: true,
            avatar: true,
            businessProfile: { select: { businessName: true } },
          },
        },
      },
      orderBy: { eventDate: 'desc' },
    })

    return NextResponse.json({
      success: true,
      data: appointments,
    })
  } catch (error) {
    console.error('Get appointments error:', error)
    return NextResponse.json(
      { success: false, error: 'Error al obtener citas' },
      { status: 500 }
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
    const { sellerId, title, description, eventDate, duration, notes } = body

    if (!sellerId || !title || !eventDate) {
      return NextResponse.json(
        { success: false, error: 'Vendedor, título y fecha son requeridos' },
        { status: 400 }
      )
    }

    // Verify seller exists and is actually a seller
    const seller = await db.user.findUnique({
      where: { id: sellerId },
    })

    if (!seller) {
      return NextResponse.json(
        { success: false, error: 'Vendedor no encontrado' },
        { status: 404 }
      )
    }

    if (seller.role !== 'SELLER' && seller.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'El usuario no es un vendedor' },
        { status: 400 }
      )
    }

    // Cannot request appointment with self
    if (sellerId === userId) {
      return NextResponse.json(
        { success: false, error: 'No puedes pedir una cita contigo mismo' },
        { status: 400 }
      )
    }

    const appointment = await db.appointment.create({
      data: {
        buyerId: userId,
        sellerId,
        title: title.trim(),
        description: description || '',
        eventDate: new Date(eventDate),
        duration: duration || 30,
        status: 'PENDING',
        notes: notes || '',
      },
      include: {
        buyer: { select: { id: true, name: true, avatar: true } },
        seller: {
          select: {
            id: true,
            name: true,
            avatar: true,
            businessProfile: { select: { businessName: true } },
          },
        },
      },
    })

    // Notify seller about new appointment request
    await db.notification.create({
      data: {
        userId: sellerId,
        type: 'MESSAGE',
        title: 'Nueva cita solicitada',
        message: `${seller.name} ha solicitado una cita: "${title.trim()}"`,
      },
    })

    return NextResponse.json({
      success: true,
      data: appointment,
    }, { status: 201 })
  } catch (error) {
    console.error('Create appointment error:', error)
    return NextResponse.json(
      { success: false, error: 'Error al crear cita' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
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
    const { id, status } = body

    if (!id || !status) {
      return NextResponse.json(
        { success: false, error: 'ID y estado son requeridos' },
        { status: 400 }
      )
    }

    const validStatuses = ['CONFIRMED', 'CANCELLED', 'COMPLETED']
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, error: 'Estado inválido' },
        { status: 400 }
      )
    }

    // Find the appointment
    const appointment = await db.appointment.findUnique({
      where: { id },
    })

    if (!appointment) {
      return NextResponse.json(
        { success: false, error: 'Cita no encontrada' },
        { status: 404 }
      )
    }

    // Only seller can confirm
    if (status === 'CONFIRMED' && appointment.sellerId !== userId) {
      return NextResponse.json(
        { success: false, error: 'Solo el vendedor puede confirmar la cita' },
        { status: 400 }
      )
    }

    // Either party can cancel
    if (status === 'CANCELLED') {
      if (appointment.buyerId !== userId && appointment.sellerId !== userId) {
        return NextResponse.json(
          { success: false, error: 'No tienes permiso para cancelar esta cita' },
          { status: 400 }
        )
      }
    }

    // Only seller can mark as completed
    if (status === 'COMPLETED' && appointment.sellerId !== userId) {
      return NextResponse.json(
        { success: false, error: 'Solo el vendedor puede completar la cita' },
        { status: 400 }
      )
    }

    // Cannot change status from CANCELLED or COMPLETED
    if (appointment.status === 'CANCELLED') {
      return NextResponse.json(
        { success: false, error: 'La cita ya fue cancelada' },
        { status: 400 }
      )
    }

    if (appointment.status === 'COMPLETED') {
      return NextResponse.json(
        { success: false, error: 'La cita ya fue completada' },
        { status: 400 }
      )
    }

    const updatedAppointment = await db.appointment.update({
      where: { id },
      data: { status },
      include: {
        buyer: { select: { id: true, name: true, avatar: true } },
        seller: {
          select: {
            id: true,
            name: true,
            avatar: true,
            businessProfile: { select: { businessName: true } },
          },
        },
      },
    })

    // Notify the other party about status change
    const notifyUserId = userId === appointment.buyerId ? appointment.sellerId : appointment.buyerId
    const statusMessages: Record<string, string> = {
      CONFIRMED: 'Cita confirmada',
      CANCELLED: 'Cita cancelada',
      COMPLETED: 'Cita completada',
    }

    await db.notification.create({
      data: {
        userId: notifyUserId,
        type: 'MESSAGE',
        title: statusMessages[status] || 'Cita actualizada',
        message: `La cita "${appointment.title}" ha sido ${statusMessages[status]?.toLowerCase() || 'actualizada'}`,
      },
    })

    return NextResponse.json({
      success: true,
      data: updatedAppointment,
    })
  } catch (error) {
    console.error('Update appointment error:', error)
    return NextResponse.json(
      { success: false, error: 'Error al actualizar cita' },
      { status: 500 }
    )
  }
}
