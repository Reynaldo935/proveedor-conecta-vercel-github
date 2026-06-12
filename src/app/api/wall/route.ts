import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthenticatedUserId, setAuthCookie } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const businessProfileId = searchParams.get('businessProfileId')
    if (!businessProfileId) return NextResponse.json({ success: false, error: 'businessProfileId requerido' }, { status: 200 })

    const limit = parseInt(searchParams.get('limit') || '20')
    const cursor = searchParams.get('cursor') || ''

    const where: Record<string, unknown> = { businessProfileId }
    if (cursor) where.createdAt = { lt: new Date(cursor) }

    const posts = await db.wallPost.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
      include: {
        likes: { select: { userId: true } },
        comments: { include: { user: { select: { id: true, name: true, avatar: true } } }, orderBy: { createdAt: 'asc' } },
        businessProfile: { include: { user: { select: { id: true, name: true, avatar: true } } } },
      },
    })

    const hasMore = posts.length > limit
    const items = hasMore ? posts.slice(0, limit) : posts
    const nextCursor = hasMore && items.length > 0 ? items[items.length - 1].createdAt.toISOString() : null

    return NextResponse.json({ success: true, data: items, nextCursor })
  } catch (error) {
    console.error('Get wall posts error:', error)
    return NextResponse.json({ success: false, error: 'Error al obtener publicaciones' }, { status: 200 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getAuthenticatedUserId(request)
    if (!userId) return NextResponse.json({ success: false, error: 'No autenticado' }, { status: 200 })
    await setAuthCookie(userId)

    const body = await request.json()
    const { content, imageUrl, videoUrl, postType } = body

    if (!content && !imageUrl && !videoUrl) {
      return NextResponse.json({ success: false, error: 'Contenido, imagen o video requerido' }, { status: 200 })
    }

    const profile = await db.businessProfile.findUnique({ where: { userId } })
    if (!profile) return NextResponse.json({ success: false, error: 'Perfil de negocio no encontrado' }, { status: 200 })

    // Determine post type automatically if not provided
    let resolvedPostType = postType || 'text'
    if (!postType) {
      if (videoUrl) resolvedPostType = 'video'
      else if (imageUrl) resolvedPostType = 'photo'
      else resolvedPostType = 'text'
    }

    const post = await db.wallPost.create({
      data: {
        businessProfileId: profile.id,
        content: content || '',
        imageUrl: imageUrl || '',
        videoUrl: videoUrl || '',
        postType: resolvedPostType,
      },
      include: {
        likes: { select: { userId: true } },
        comments: { include: { user: { select: { id: true, name: true, avatar: true } } }, orderBy: { createdAt: 'asc' } },
      },
    })

    return NextResponse.json({ success: true, data: post })
  } catch (error) {
    console.error('Create wall post error:', error)
    return NextResponse.json({ success: false, error: 'Error al crear publicación' }, { status: 200 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const userId = await getAuthenticatedUserId(request)
    if (!userId) return NextResponse.json({ success: false, error: 'No autenticado' }, { status: 200 })
    await setAuthCookie(userId)

    const { searchParams } = new URL(request.url)
    const postId = searchParams.get('id')
    if (!postId) return NextResponse.json({ success: false, error: 'id de publicación requerido' }, { status: 200 })

    const post = await db.wallPost.findUnique({ where: { id: postId }, include: { businessProfile: true } })
    if (!post) return NextResponse.json({ success: false, error: 'Publicación no encontrada' }, { status: 200 })

    if (post.businessProfile.userId !== userId) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 200 })
    }

    await db.wallPost.delete({ where: { id: postId } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete wall post error:', error)
    return NextResponse.json({ success: false, error: 'Error al eliminar publicación' }, { status: 200 })
  }
}
