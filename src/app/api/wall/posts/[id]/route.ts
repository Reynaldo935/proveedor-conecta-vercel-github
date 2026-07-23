/**
 * Social Wall Post [id] API
 * ProveedorConecta Nicaragua
 * 
 * GET    /api/wall/posts/[id] — Get single post with comments
 * PUT    /api/wall/posts/[id] — Edit post (owner only)
 * DELETE /api/wall/posts/[id] — Delete post (owner or admin only)
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthenticatedUserId, setAuthCookie } from '@/lib/auth'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const userId = await getAuthenticatedUserId(request)
    if (!userId) {
      return NextResponse.json({ success: false, message: 'No autenticado' }, { status: 200 })
    }
    await setAuthCookie(userId)

    const post = await db.socialWall.findUnique({
      where: { id },
      include: {
        author: { select: { id: true, name: true, avatar: true } },
        comments: {
          include: { author: { select: { id: true, name: true, avatar: true } } },
          orderBy: { createdAt: 'asc' },
        },
      },
    })

    if (!post) {
      return NextResponse.json({ success: false, message: 'Post no encontrado' }, { status: 200 })
    }

    return NextResponse.json({
      success: true,
      data: {
        ...post,
        mediaUrls: (() => { try { return JSON.parse(post.mediaUrls) } catch { return [] } })(),
        createdAt: post.createdAt.toISOString(),
        updatedAt: post.updatedAt.toISOString(),
        comments: post.comments.map(c => ({
          ...c,
          createdAt: c.createdAt.toISOString(),
        })),
      },
    })
  } catch (error) {
    console.error('Wall post GET error:', error)
    return NextResponse.json({ success: false, message: 'Error al obtener post' }, { status: 200 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const userId = await getAuthenticatedUserId(request)
    if (!userId) {
      return NextResponse.json({ success: false, message: 'No autenticado' }, { status: 200 })
    }
    await setAuthCookie(userId)

    const post = await db.socialWall.findUnique({ where: { id } })
    if (!post) {
      return NextResponse.json({ success: false, message: 'Post no encontrado' }, { status: 200 })
    }

    if (post.authorId !== userId) {
      const user = await db.user.findUnique({ where: { id: userId } })
      if (user?.role !== 'ADMIN') {
        return NextResponse.json({ success: false, message: 'No autorizado' }, { status: 200 })
      }
    }

    const body = await request.json()
    const { content, mediaUrls } = body

    const updated = await db.socialWall.update({
      where: { id },
      data: {
        ...(content !== undefined && { content }),
        ...(mediaUrls !== undefined && { mediaUrls: JSON.stringify(mediaUrls) }),
        isEdited: true,
      },
      include: {
        author: { select: { id: true, name: true, avatar: true } },
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        ...updated,
        mediaUrls: (() => { try { return JSON.parse(updated.mediaUrls) } catch { return [] } })(),
        createdAt: updated.createdAt.toISOString(),
        updatedAt: updated.updatedAt.toISOString(),
      },
    })
  } catch (error) {
    console.error('Wall post PUT error:', error)
    return NextResponse.json({ success: false, message: 'Error al editar post' }, { status: 200 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const userId = await getAuthenticatedUserId(request)
    if (!userId) {
      return NextResponse.json({ success: false, message: 'No autenticado' }, { status: 200 })
    }
    await setAuthCookie(userId)

    const post = await db.socialWall.findUnique({ where: { id } })
    if (!post) {
      return NextResponse.json({ success: false, message: 'Post no encontrado' }, { status: 200 })
    }

    if (post.authorId !== userId) {
      const user = await db.user.findUnique({ where: { id: userId } })
      if (user?.role !== 'ADMIN') {
        return NextResponse.json({ success: false, message: 'No autorizado' }, { status: 200 })
      }
    }

    await db.socialWall.delete({ where: { id } })

    return NextResponse.json({ success: true, message: 'Post eliminado' })
  } catch (error) {
    console.error('Wall post DELETE error:', error)
    return NextResponse.json({ success: false, message: 'Error al eliminar post' }, { status: 200 })
  }
}
