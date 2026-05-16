import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { cookies } from 'next/headers'

export async function GET() {
  try {
    const cookieStore = await cookies()
    const userId = cookieStore.get('pc_user_id')?.value
    if (!userId) return NextResponse.json({ success: false, error: 'No autenticado' }, { status: 401 })

    const saved = await db.savedProduct.findMany({
      where: { userId },
      include: { product: { include: { seller: { select: { id: true, name: true, avatar: true, businessProfile: { select: { businessName: true } } } } } } },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({
      success: true,
      data: saved.map(s => ({ ...s, product: { ...s.product, images: s.product.images ? JSON.parse(s.product.images) : [] } })),
    })
  } catch (error) {
    console.error('Get saved products error:', error)
    return NextResponse.json({ success: false, error: 'Error al obtener guardados' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const userId = cookieStore.get('pc_user_id')?.value
    if (!userId) return NextResponse.json({ success: false, error: 'No autenticado' }, { status: 401 })

    const body = await request.json()
    const { productId } = body
    if (!productId) return NextResponse.json({ success: false, error: 'productId requerido' }, { status: 400 })

    const existing = await db.savedProduct.findUnique({
      where: { userId_productId: { userId, productId } },
    })

    if (existing) {
      await db.savedProduct.delete({ where: { id: existing.id } })
      return NextResponse.json({ success: true, data: { saved: false } })
    } else {
      await db.savedProduct.create({ data: { userId, productId } })
      return NextResponse.json({ success: true, data: { saved: true } })
    }
  } catch (error) {
    console.error('Toggle save error:', error)
    return NextResponse.json({ success: false, error: 'Error al guardar' }, { status: 500 })
  }
}
