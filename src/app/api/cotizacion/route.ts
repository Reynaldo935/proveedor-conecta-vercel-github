import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const userId = cookieStore.get('pc_user_id')?.value
    if (!userId) return NextResponse.json({ success: false, error: 'No autenticado' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const role = searchParams.get('role') || 'buyer'

    const where = role === 'seller' ? { sellerId: userId } : { buyerId: userId }

    const cotizaciones = await db.cotizacion.findMany({
      where,
      include: {
        buyer: { select: { id: true, name: true, avatar: true } },
        responses: { include: { seller: { select: { id: true, name: true, avatar: true, businessProfile: { select: { businessName: true } } } } } },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ success: true, data: cotizaciones })
  } catch (error) {
    console.error('Get cotizaciones error:', error)
    return NextResponse.json({ success: false, error: 'Error al obtener cotizaciones' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const userId = cookieStore.get('pc_user_id')?.value
    if (!userId) return NextResponse.json({ success: false, error: 'No autenticado' }, { status: 401 })

    const body = await request.json()
    const { title, description, category } = body

    if (!title) return NextResponse.json({ success: false, error: 'Título es requerido' }, { status: 400 })

    const cotizacion = await db.cotizacion.create({
      data: { buyerId: userId, title, description: description || '', category: category || '', status: 'OPEN' },
    })

    return NextResponse.json({ success: true, data: cotizacion })
  } catch (error) {
    console.error('Create cotizacion error:', error)
    return NextResponse.json({ success: false, error: 'Error al crear cotización' }, { status: 500 })
  }
}
