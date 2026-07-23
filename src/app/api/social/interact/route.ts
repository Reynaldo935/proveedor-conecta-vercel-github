/**
 * Social Post Likes & Comments API
 * ProveedorConecta Nicaragua
 * 
 * POST /api/social/interact — Like/unlike or comment on a post
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthenticatedUserId, setAuthCookie } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const userId = await getAuthenticatedUserId(request)
    if (!userId) {
      return NextResponse.json({ success: false, message: 'No autenticado' }, { status: 200 })
    }
    await setAuthCookie(userId)

    const body = await request.json()
    const { action, postId, content } = body

    if (!postId) {
      return NextResponse.json({ success: false, message: 'ID de publicación requerido' }, { status: 200 })
    }

    // Verify post exists
    const post = await db.socialPost.findUnique({ where: { id: postId } })
    if (!post) {
      return NextResponse.json({ success: false, message: 'Publicación no encontrada' }, { status: 200 })
    }

    if (action === 'like') {
      const existing = await db.socialPostLike.findUnique({
        where: { userId_postId: { userId, postId } },
      })

      if (existing) {
        await db.socialPostLike.delete({ where: { id: existing.id } })
        return NextResponse.json({ success: true, data: { liked: false, likeCount: await db.socialPostLike.count({ where: { postId } }) } })
      }

      await db.socialPostLike.create({ data: { userId, postId } })
      return NextResponse.json({ success: true, data: { liked: true, likeCount: await db.socialPostLike.count({ where: { postId } }) } })
    }

    if (action === 'comment') {
      if (!content || content.trim().length === 0) {
        return NextResponse.json({ success: false, message: 'Contenido del comentario requerido' }, { status: 200 })
      }

      const comment = await db.socialPostComment.create({
        data: { userId, postId, content: content.trim() },
        include: { user: { select: { id: true, name: true, avatar: true } } },
      })

      return NextResponse.json({
        success: true,
        data: { comment, commentCount: await db.socialPostComment.count({ where: { postId } }) },
      })
    }

    return NextResponse.json({ success: false, message: 'Acción no válida' }, { status: 200 })
  } catch (error) {
    console.error('Social interact error:', error)
    return NextResponse.json({ success: false, message: 'Error al procesar interacción' }, { status: 200 })
  }
}
