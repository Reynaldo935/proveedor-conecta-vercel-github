import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthenticatedUserId, setAuthCookie } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const userId = await getAuthenticatedUserId(request)
    if (!userId) return NextResponse.json({ success: false, error: 'No autenticado' }, { status: 200 })
    await setAuthCookie(userId)

    const body = await request.json()
    const { productId } = body
    if (!productId) return NextResponse.json({ success: false, error: 'productId requerido' }, { status: 200 })

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
    return NextResponse.json({ success: false, error: 'Error al dar like' }, { status: 200 })
  }
}
