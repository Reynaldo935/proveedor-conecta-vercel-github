import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { cookies } from 'next/headers'

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const cookieStore = await cookies()
    const userId = cookieStore.get('pc_user_id')?.value

    // Allow viewing without auth for public data, but verify access for private
    const cotizacion = await db.cotizacion.findUnique({
      where: { id },
      include: {
        buyer: { select: { id: true, name: true, avatar: true, phone: true } },
        responses: {
          include: {
            seller: { select: { id: true, name: true, avatar: true, businessProfile: { select: { businessName: true, logo: true, phone: true } } } },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    })

    if (!cotizacion) return NextResponse.json({ success: false, error: 'Cotización no encontrada' }, { status: 404 })

    // If user is logged in, check if they have access (buyer, seller who responded, or seller in same category)
    let canRespond = false
    if (userId) {
      if (cotizacion.buyerId === userId) {
        // Buyer can see but not respond
        canRespond = false
      } else {
        // Check if user is a seller who hasn't responded yet
        const existingResponse = cotizacion.responses.find(r => r.sellerId === userId)
        canRespond = !existingResponse && cotizacion.status === 'OPEN'
      }
    }

    return NextResponse.json({ success: true, data: { ...cotizacion, canRespond } })
  } catch (error) {
    console.error('Get cotizacion error:', error)
    return NextResponse.json({ success: false, error: 'Error al obtener cotización' }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const cookieStore = await cookies()
    const userId = cookieStore.get('pc_user_id')?.value
    if (!userId) return NextResponse.json({ success: false, error: 'No autenticado' }, { status: 401 })

    // Verify cotizacion exists and is open
    const cotizacion = await db.cotizacion.findUnique({
      where: { id },
      include: { responses: true },
    })

    if (!cotizacion) {
      return NextResponse.json({ success: false, error: 'Cotización no encontrada' }, { status: 404 })
    }

    if (cotizacion.status !== 'OPEN') {
      return NextResponse.json({ success: false, error: 'Esta cotización ya está cerrada' }, { status: 400 })
    }

    // Check if seller already responded
    const existingResponse = cotizacion.responses.find(r => r.sellerId === userId)
    if (existingResponse) {
      return NextResponse.json({ success: false, error: 'Ya has respondido a esta cotización' }, { status: 400 })
    }

    // Verify user is a seller
    const user = await db.user.findUnique({ where: { id: userId } })
    if (!user || user.role !== 'SELLER') {
      return NextResponse.json({ success: false, error: 'Solo vendedores pueden responder cotizaciones' }, { status: 403 })
    }

    const body = await request.json()
    const { price, description, deliveryTime, productId } = body

    if (!price || parseFloat(price) <= 0) {
      return NextResponse.json({ success: false, error: 'Precio válido es requerido' }, { status: 400 })
    }

    const response = await db.cotizacionResponse.create({
      data: {
        cotizacionId: id,
        sellerId: userId,
        price: parseFloat(price),
        description: description || '',
        deliveryTime: deliveryTime || '',
        productId: productId || null,
      },
      include: {
        seller: { select: { id: true, name: true, avatar: true, businessProfile: { select: { businessName: true } } } },
      },
    })

    // Notify the buyer
    await db.notification.create({
      data: {
        userId: cotizacion.buyerId,
        type: 'COTIZACION',
        title: 'Nueva respuesta a cotización',
        message: `Alguien respondió a tu cotización "${cotizacion.title}"`,
        link: `/cotizacion/${id}`,
      },
    })

    return NextResponse.json({ success: true, data: response })
  } catch (error) {
    console.error('Create cotizacion response error:', error)
    return NextResponse.json({ success: false, error: 'Error al responder cotización' }, { status: 500 })
  }
}

// PUT /api/cotizacion/[id] — update cotizacion (close it)
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const cookieStore = await cookies()
    const userId = cookieStore.get('pc_user_id')?.value
    if (!userId) return NextResponse.json({ success: false, error: 'No autenticado' }, { status: 401 })

    const cotizacion = await db.cotizacion.findUnique({ where: { id } })
    if (!cotizacion) {
      return NextResponse.json({ success: false, error: 'Cotización no encontrada' }, { status: 404 })
    }

    if (cotizacion.buyerId !== userId) {
      return NextResponse.json({ success: false, error: 'Solo el comprador puede modificar la cotización' }, { status: 403 })
    }

    const body = await request.json()
    const updated = await db.cotizacion.update({
      where: { id },
      data: { status: body.status || 'CLOSED' },
    })

    return NextResponse.json({ success: true, data: updated })
  } catch (error) {
    console.error('Update cotizacion error:', error)
    return NextResponse.json({ success: false, error: 'Error al actualizar cotización' }, { status: 500 })
  }
}
