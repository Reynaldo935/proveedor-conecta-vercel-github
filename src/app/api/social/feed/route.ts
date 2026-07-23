/**
 * Social Feed API — Facebook-style timeline
 * ProveedorConecta Nicaragua
 * 
 * GET  /api/social/feed — Get posts from followed users + own posts
 * POST /api/social/feed — Create a new social post
 * PUT  /api/social/feed — Edit a post
 * DELETE /api/social/feed?id=X — Delete a post
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthenticatedUserId, setAuthCookie } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const userId = await getAuthenticatedUserId(request)
    if (!userId) {
      return NextResponse.json({ success: false, message: 'No autenticado' }, { status: 200 })
    }
    await setAuthCookie(userId)

    const { searchParams } = new URL(request.url)
    const profileUserId = searchParams.get('userId') || userId
    const limit = parseInt(searchParams.get('limit') || '20')
    const cursor = searchParams.get('cursor')

    const where: any = { userId: profileUserId }
    if (cursor) {
      where.createdAt = { lt: new Date(cursor) }
    }

    const posts = await db.socialPost.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
      include: {
        user: { select: { id: true, name: true, avatar: true, isVerified: true } },
        likes: { select: { userId: true } },
        comments: {
          include: { user: { select: { id: true, name: true, avatar: true } } },
          orderBy: { createdAt: 'asc' },
          take: 10,
        },
        _count: { select: { likes: true, comments: true } },
      },
    })

    const hasMore = posts.length > limit
    const items = hasMore ? posts.slice(0, limit) : posts

    return NextResponse.json({
      success: true,
      data: items.map(p => ({
        ...p,
        likeCount: p._count.likes,
        commentCount: p._count.comments,
        likedByMe: p.likes.some(l => l.userId === userId),
        images: (() => { try { return JSON.parse(p.images) } catch { return [] } })(),
        _count: undefined,
      })),
      hasMore,
      nextCursor: hasMore && items.length > 0 ? items[items.length - 1].createdAt.toISOString() : null,
    })
  } catch (error) {
    console.error('Social feed GET error:', error)
    return NextResponse.json({ success: false, message: 'Error al obtener publicaciones' }, { status: 200 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getAuthenticatedUserId(request)
    if (!userId) {
      return NextResponse.json({ success: false, message: 'No autenticado' }, { status: 200 })
    }
    await setAuthCookie(userId)

    const body = await request.json()
    const { content, images, videoUrl, postType } = body

    if (!content && (!images || images.length === 0) && !videoUrl) {
      return NextResponse.json({ success: false, message: 'Contenido requerido' }, { status: 200 })
    }

    let resolvedType = postType || 'text'
    if (!postType) {
      if (videoUrl) resolvedType = 'video'
      else if (images && images.length > 0) resolvedType = 'photo'
    }

    const post = await db.socialPost.create({
      data: {
        userId,
        content: content || '',
        images: JSON.stringify(images || []),
        videoUrl: videoUrl || '',
        postType: resolvedType,
      },
      include: {
        user: { select: { id: true, name: true, avatar: true, isVerified: true } },
        _count: { select: { likes: true, comments: true } },
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        ...post,
        likeCount: 0,
        commentCount: 0,
        likedByMe: false,
        images: images || [],
        _count: undefined,
      },
    })
  } catch (error) {
    console.error('Social feed POST error:', error)
    return NextResponse.json({ success: false, message: 'Error al crear publicación' }, { status: 200 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const userId = await getAuthenticatedUserId(request)
    if (!userId) {
      return NextResponse.json({ success: false, message: 'No autenticado' }, { status: 200 })
    }
    await setAuthCookie(userId)

    const body = await request.json()
    const { postId, content, images } = body

    if (!postId) {
      return NextResponse.json({ success: false, message: 'ID de publicación requerido' }, { status: 200 })
    }

    const post = await db.socialPost.findUnique({ where: { id: postId } })
    if (!post || post.userId !== userId) {
      return NextResponse.json({ success: false, message: 'No autorizado' }, { status: 200 })
    }

    const updated = await db.socialPost.update({
      where: { id: postId },
      data: {
        ...(content !== undefined && { content }),
        ...(images !== undefined && { images: JSON.stringify(images) }),
        isEdited: true,
      },
      include: {
        user: { select: { id: true, name: true, avatar: true, isVerified: true } },
        _count: { select: { likes: true, comments: true } },
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        ...updated,
        likeCount: updated._count.likes,
        commentCount: updated._count.comments,
        images: (() => { try { return JSON.parse(updated.images) } catch { return [] } })(),
        _count: undefined,
      },
    })
  } catch (error) {
    console.error('Social feed PUT error:', error)
    return NextResponse.json({ success: false, message: 'Error al editar publicación' }, { status: 200 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const userId = await getAuthenticatedUserId(request)
    if (!userId) {
      return NextResponse.json({ success: false, message: 'No autenticado' }, { status: 200 })
    }
    await setAuthCookie(userId)

    const { searchParams } = new URL(request.url)
    const postId = searchParams.get('id')
    if (!postId) {
      return NextResponse.json({ success: false, message: 'ID de publicación requerido' }, { status: 200 })
    }

    const post = await db.socialPost.findUnique({ where: { id: postId } })
    if (!post || post.userId !== userId) {
      return NextResponse.json({ success: false, message: 'No autorizado' }, { status: 200 })
    }

    await db.socialPost.delete({ where: { id: postId } })

    return NextResponse.json({ success: true, message: 'Publicación eliminada' })
  } catch (error) {
    console.error('Social feed DELETE error:', error)
    return NextResponse.json({ success: false, message: 'Error al eliminar publicación' }, { status: 200 })
  }
}
