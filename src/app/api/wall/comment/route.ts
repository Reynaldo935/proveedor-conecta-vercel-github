import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthenticatedUserId, setAuthCookie } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const userId = await getAuthenticatedUserId(request)
    if (!userId) return NextResponse.json({ success: false, error: 'No autenticado' }, { status: 200 })
    await setAuthCookie(userId)

    const body = await request.json()
    const { postId, content } = body
    if (!postId) return NextResponse.json({ success: false, error: 'postId requerido' }, { status: 200 })
    if (!content || !content.trim()) return NextResponse.json({ success: false, error: 'Contenido requerido' }, { status: 200 })

    const comment = await db.postComment.create({
      data: { userId, postId, content: content.trim() },
      include: { user: { select: { id: true, name: true, avatar: true } } },
    })

    return NextResponse.json({ success: true, data: comment })
  } catch (error) {
    console.error('Create wall comment error:', error)
    return NextResponse.json({ success: false, error: 'Error al crear comentario' }, { status: 200 })
  }
}
