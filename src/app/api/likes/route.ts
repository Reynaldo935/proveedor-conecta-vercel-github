import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const userId = cookieStore.get('pc_user_id')?.value
    if (!userId) return NextResponse.json({ success: false, error: 'No autenticado' }, { status: 401 })

    const body = await request.json()
    const { productId } = body
    if (!productId) return NextResponse.json({ success: false, error: 'productId requerido' }, { status: 400 })

    const existing = await db.like.findUnique({
      where: { userId_productId: { userId, productId } },
    })

    if (existing) {
      await db.like.delete({ where: { id: existing.id } })
      return NextResponse.json({ success: true, data: { liked: false } })
    } else {
      await db.like.create({ data: { userId, productId } })
      return NextResponse.json({ success: true, data: { liked: true } })
    }
  } catch (error) {
    console.error('Toggle like error:', error)
    return NextResponse.json({ success: false, error: 'Error al dar like' }, { status: 500 })
  }
}
