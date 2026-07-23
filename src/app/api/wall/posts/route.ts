/**
 * Social Wall Posts API
 * ProveedorConecta Nicaragua
 * 
 * Facebook-style wall posts with multimedia support.
 * GET  /api/wall/posts — List posts (feed)
 * POST /api/wall/posts — Create a new wall post
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
    const targetUserId = searchParams.get('userId') || userId
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    const posts = await db.socialWall.findMany({
      where: { authorId: targetUserId },
      include: {
        author: { select: { id: true, name: true, avatar: true } },
        _count: { select: { comments: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    })

    const formatted = posts.map(p => ({
      id: p.id,
      authorId: p.authorId,
      author: p.author,
      content: p.content,
      mediaUrls: (() => { try { return JSON.parse(p.mediaUrls || '[]') } catch { return [] } })(),
      postType: p.postType,
      likeCount: p.likeCount,
      commentCount: p._count.comments,
      isEdited: p.isEdited,
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
      _count: undefined,
    }))

    return NextResponse.json({ success: true, data: formatted })
  } catch (error) {
    console.error('Wall posts GET error:', error)
    return NextResponse.json({ success: false, message: 'Error al obtener posts' }, { status: 200 })
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
    const { content, mediaUrls, postType } = body

    if (!content && (!mediaUrls || mediaUrls.length === 0)) {
      return NextResponse.json({ success: false, message: 'El post debe tener contenido o medios' }, { status: 200 })
    }

    const post = await db.socialWall.create({
      data: {
        authorId: userId,
        content: content || '',
        mediaUrls: JSON.stringify(mediaUrls || []),
        postType: postType || 'text',
      },
      include: {
        author: { select: { id: true, name: true, avatar: true } },
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        ...post,
        mediaUrls: (() => { try { return JSON.parse(post.mediaUrls) } catch { return [] } })(),
        commentCount: 0,
        createdAt: post.createdAt.toISOString(),
        updatedAt: post.updatedAt.toISOString(),
      },
    })
  } catch (error) {
    console.error('Wall posts POST error:', error)
    return NextResponse.json({ success: false, message: 'Error al crear post' }, { status: 200 })
  }
}
