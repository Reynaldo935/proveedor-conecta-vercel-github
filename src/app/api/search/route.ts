import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { cookies } from 'next/headers'
import { Prisma } from '@prisma/client'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const q = searchParams.get('q') || ''
    const category = searchParams.get('category') || ''
    const minPrice = parseFloat(searchParams.get('minPrice') || '0')
    const maxPrice = parseFloat(searchParams.get('maxPrice') || '999999')
    const limit = parseInt(searchParams.get('limit') || '20')
    const sort = searchParams.get('sort') || 'recent'

    if (!q && !category) {
      return NextResponse.json({ success: true, data: [] })
    }

    // Build where clause properly using Prisma.ProductWhereInput
    const where: Prisma.ProductWhereInput = { status: 'ACTIVE' }

    if (q) {
      where.OR = [
        { title: { contains: q } },
        { description: { contains: q } },
        { tags: { contains: q } },
        { category: { contains: q } },
        { seller: { businessProfile: { businessName: { contains: q } } } },
      ]
    }

    if (category) {
      where.category = { contains: category }
    }

    if (minPrice > 0 || maxPrice < 999999) {
      where.OR = [
        { discountPrice: { gte: minPrice, lte: maxPrice } },
        { discountPrice: null, price: { gte: minPrice, lte: maxPrice } },
      ]
    }

    // Determine sort order
    let orderBy: Prisma.ProductOrderByWithRelationInput = { publishedAt: 'desc' }
    if (sort === 'price_asc') orderBy = { price: 'asc' }
    else if (sort === 'price_desc') orderBy = { price: 'desc' }

    const cookieStore = await cookies()
    const userId = cookieStore.get('pc_user_id')?.value

    const products = await db.product.findMany({
      where,
      include: {
        seller: {
          select: {
            id: true, name: true, avatar: true,
            businessProfile: { select: { businessName: true, logo: true } },
          },
        },
        likes: { select: { userId: true } },
      },
      orderBy,
      take: limit,
    })

    return NextResponse.json({
      success: true,
      data: products.map(p => ({
        ...p,
        images: p.images ? JSON.parse(p.images) : [],
        likeCount: p.likes.length,
        isLiked: userId ? p.likes.some(l => l.userId === userId) : false,
        likes: undefined,
      })),
    })
  } catch (error) {
    console.error('Search error:', error)
    return NextResponse.json({ success: false, error: 'Error en búsqueda' }, { status: 500 })
  }
}
