import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { cookies } from 'next/headers'

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const cotizacion = await db.cotizacion.findUnique({
      where: { id },
      include: {
        buyer: { select: { id: true, name: true, avatar: true } },
        responses: { include: { seller: { select: { id: true, name: true, avatar: true, businessProfile: { select: { businessName: true } } } } } },
      },
    })
    if (!cotizacion) return NextResponse.json({ success: false, error: 'Cotización no encontrada' }, { status: 404 })
    return NextResponse.json({ success: true, data: cotizacion })
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

    const body = await request.json()
    const { price, description, deliveryTime, productId } = body

    const response = await db.cotizacionResponse.create({
      data: {
        cotizacionId: id,
        sellerId: userId,
        price: parseFloat(price) || 0,
        description: description || '',
        deliveryTime: deliveryTime || '',
        productId: productId || null,
      },
    })

    return NextResponse.json({ success: true, data: response })
  } catch (error) {
    console.error('Create cotizacion response error:', error)
    return NextResponse.json({ success: false, error: 'Error al responder cotización' }, { status: 500 })
  }
}
