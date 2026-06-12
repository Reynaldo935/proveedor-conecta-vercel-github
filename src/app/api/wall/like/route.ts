import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthenticatedUserId, setAuthCookie } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const userId = await getAuthenticatedUserId(request)
    if (!userId) return NextResponse.json({ success: false, error: 'No autenticado' }, { status: 200 })
    await setAuthCookie(userId)

    const body = await request.json()
    const { postId } = body
    if (!postId) return NextResponse.json({ success: false, error: 'postId requerido' }, { status: 200 })

    const existing = await db.postLike.findUnique({
      where: { userId_postId: { userId, postId } },
    })

    if (existing) {
      await db.postLike.delete({ where: { id: existing.id } })
      return NextResponse.json({ success: true, data: { liked: false } })
    } else {
      await db.postLike.create({ data: { userId, postId } })
      return NextResponse.json({ success: true, data: { liked: true } })
    }
  } catch (error) {
    console.error('Toggle wall post like error:', error)
    return NextResponse.json({ success: false, error: 'Error al dar like' }, { status: 200 })
  }
}
