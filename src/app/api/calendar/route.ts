import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthenticatedUserId, setAuthCookie } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const userId = await getAuthenticatedUserId(request)

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'No autenticado' },
        { status: 200 }
      )
    }

    await setAuthCookie(userId)

    const { searchParams } = new URL(request.url)
    const month = searchParams.get('month') // YYYY-MM format
    const view = searchParams.get('view') || 'month' // month/week/day

    let startDate: Date
    let endDate: Date

    if (month) {
      const [year, mon] = month.split('-').map(Number)
      startDate = new Date(year, mon - 1, 1)
      endDate = new Date(year, mon, 1) // First day of next month
    } else {
      // Default to current month
      const now = new Date()
      startDate = new Date(now.getFullYear(), now.getMonth(), 1)
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 1)
    }

    // Adjust date range based on view
    if (view === 'week') {
      // Show 7 days from start of the week
      const dayOfWeek = startDate.getDay()
      startDate = new Date(startDate)
      startDate.setDate(startDate.getDate() - dayOfWeek)
      endDate = new Date(startDate)
      endDate.setDate(endDate.getDate() + 7)
    } else if (view === 'day') {
      // Show just one day
      endDate = new Date(startDate)
      endDate.setDate(endDate.getDate() + 1)
    }

    const events = await db.calendarEvent.findMany({
      where: {
        userId,
        eventDate: {
          gte: startDate,
          lt: endDate,
        },
      },
      orderBy: { eventDate: 'asc' },
    })

    // Also include appointments for this period
    const appointments = await db.appointment.findMany({
      where: {
        OR: [
          { buyerId: userId },
          { sellerId: userId },
        ],
        eventDate: {
          gte: startDate,
          lt: endDate,
        },
      },
      include: {
        buyer: { select: { id: true, name: true, avatar: true } },
        seller: { select: { id: true, name: true, avatar: true } },
      },
      orderBy: { eventDate: 'asc' },
    })

    return NextResponse.json({
      success: true,
      data: {
        events,
        appointments: appointments.map((a) => ({
          id: a.id,
          title: a.title,
          description: a.description,
          eventDate: a.eventDate,
          duration: a.duration,
          status: a.status,
          notes: a.notes,
          buyer: a.buyer,
          seller: a.seller,
          isAppointment: true,
        })),
        range: {
          start: startDate,
          end: endDate,
        },
      },
    })
  } catch (error) {
    console.error('Get calendar events error:', error)
    return NextResponse.json(
      { success: false, error: 'Error al obtener eventos del calendario' },
      { status: 200 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getAuthenticatedUserId(request)

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'No autenticado' },
        { status: 200 }
      )
    }

    await setAuthCookie(userId)

    const body = await request.json()
    const { title, description, eventType, eventDate, duration, notes } = body

    if (!title || !eventDate) {
      return NextResponse.json(
        { success: false, error: 'Título y fecha son requeridos' },
        { status: 200 }
      )
    }

    const validEventTypes = ['meeting', 'delivery', 'restock', 'other']
    if (eventType && !validEventTypes.includes(eventType)) {
      return NextResponse.json(
        { success: false, error: 'Tipo de evento inválido' },
        { status: 200 }
      )
    }

    const event = await db.calendarEvent.create({
      data: {
        userId,
        title: title.trim(),
        description: description || '',
        eventType: eventType || 'other',
        eventDate: new Date(eventDate),
        duration: duration || 60,
        notes: notes || '',
      },
    })

    return NextResponse.json({
      success: true,
      data: event,
    }, { status: 201 })
  } catch (error) {
    console.error('Create calendar event error:', error)
    return NextResponse.json(
      { success: false, error: 'Error al crear evento' },
      { status: 200 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const userId = await getAuthenticatedUserId(request)

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'No autenticado' },
        { status: 200 }
      )
    }

    await setAuthCookie(userId)

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID del evento es requerido' },
        { status: 200 }
      )
    }

    // Verify event exists and belongs to user
    const event = await db.calendarEvent.findUnique({
      where: { id },
    })

    if (!event) {
      return NextResponse.json(
        { success: false, error: 'Evento no encontrado' },
        { status: 200 }
      )
    }

    if (event.userId !== userId) {
      return NextResponse.json(
        { success: false, error: 'No tienes permiso para eliminar este evento' },
        { status: 200 }
      )
    }

    await db.calendarEvent.delete({
      where: { id },
    })

    return NextResponse.json({
      success: true,
      data: { id, deleted: true },
    })
  } catch (error) {
    console.error('Delete calendar event error:', error)
    return NextResponse.json(
      { success: false, error: 'Error al eliminar evento' },
      { status: 200 }
    )
  }
}
