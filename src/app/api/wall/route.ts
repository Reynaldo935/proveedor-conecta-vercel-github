import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const businessProfileId = searchParams.get('businessProfileId')
    if (!businessProfileId) return NextResponse.json({ success: false, error: 'businessProfileId requerido' }, { status: 400 })

    const limit = parseInt(searchParams.get('limit') || '20')
    const cursor = searchParams.get('cursor') || ''

    const where: Record<string, unknown> = { businessProfileId }
    if (cursor) where.createdAt = { lt: new Date(cursor) }

    const posts = await db.wallPost.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
    })

    const hasMore = posts.length > limit
    const items = hasMore ? posts.slice(0, limit) : posts
    const nextCursor = hasMore && items.length > 0 ? items[items.length - 1].createdAt.toISOString() : null

    return NextResponse.json({ success: true, data: items, nextCursor })
  } catch (error) {
    console.error('Get wall posts error:', error)
    return NextResponse.json({ success: false, error: 'Error al obtener publicaciones' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const userId = cookieStore.get('pc_user_id')?.value
    if (!userId) return NextResponse.json({ success: false, error: 'No autenticado' }, { status: 401 })

    const body = await request.json()
    const { content, imageUrl } = body

    if (!content && !imageUrl) {
      return NextResponse.json({ success: false, error: 'Contenido o imagen requerido' }, { status: 400 })
    }

    const profile = await db.businessProfile.findUnique({ where: { userId } })
    if (!profile) return NextResponse.json({ success: false, error: 'Perfil de negocio no encontrado' }, { status: 404 })

    const post = await db.wallPost.create({
      data: { businessProfileId: profile.id, content: content || '', imageUrl: imageUrl || '' },
    })

    return NextResponse.json({ success: true, data: post })
  } catch (error) {
    console.error('Create wall post error:', error)
    return NextResponse.json({ success: false, error: 'Error al crear publicación' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const userId = cookieStore.get('pc_user_id')?.value
    if (!userId) return NextResponse.json({ success: false, error: 'No autenticado' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const postId = searchParams.get('id')
    if (!postId) return NextResponse.json({ success: false, error: 'id de publicación requerido' }, { status: 400 })

    const post = await db.wallPost.findUnique({ where: { id: postId }, include: { businessProfile: true } })
    if (!post) return NextResponse.json({ success: false, error: 'Publicación no encontrada' }, { status: 404 })

    if (post.businessProfile.userId !== userId) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 403 })
    }

    await db.wallPost.delete({ where: { id: postId } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete wall post error:', error)
    return NextResponse.json({ success: false, error: 'Error al eliminar publicación' }, { status: 500 })
  }
}
