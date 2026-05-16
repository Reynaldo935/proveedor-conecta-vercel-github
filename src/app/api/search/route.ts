import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const q = searchParams.get('q') || ''
    const category = searchParams.get('category') || ''
    const limit = parseInt(searchParams.get('limit') || '20')

    if (!q && !category) {
      return NextResponse.json({ success: true, data: [] })
    }

    const where: Record<string, unknown> = { status: 'ACTIVE' }

    if (q) {
      where.OR = [
        { title: { contains: q } },
        { description: { contains: q } },
        { tags: { contains: q } },
        { category: { contains: q } },
      ]
    }
    if (category) where.category = category

    const products = await db.product.findMany({
      where,
      include: {
        seller: { select: { id: true, name: true, avatar: true, businessProfile: { select: { businessName: true } } } },
        likes: { select: { userId: true } },
      },
      orderBy: { publishedAt: 'desc' },
      take: limit,
    })

    return NextResponse.json({
      success: true,
      data: products.map(p => ({ ...p, images: p.images ? JSON.parse(p.images) : [], likeCount: p.likes.length, likes: undefined })),
    })
  } catch (error) {
    console.error('Search error:', error)
    return NextResponse.json({ success: false, error: 'Error en búsqueda' }, { status: 500 })
  }
}
