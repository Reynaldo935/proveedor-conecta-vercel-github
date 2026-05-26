import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthenticatedUserId, setAuthCookie } from '@/lib/auth'
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

    // Collect separate conditions for text search and price filters
    const conditions: Prisma.ProductWhereInput[] = []

    if (q) {
      conditions.push({
        OR: [
          { title: { contains: q } },
          { description: { contains: q } },
          { tags: { contains: q } },
          { category: { contains: q } },
          { seller: { businessProfile: { businessName: { contains: q } } } },
        ],
      })
    }

    if (category) {
      where.category = { contains: category }
    }

    if (minPrice > 0 || maxPrice < 999999) {
      conditions.push({
        OR: [
          { discountPrice: { gte: minPrice, lte: maxPrice } },
          { discountPrice: null, price: { gte: minPrice, lte: maxPrice } },
        ],
      })
    }

    // Combine all conditions with AND so they don't overwrite each other
    if (conditions.length === 1) {
      where.OR = conditions[0].OR
    } else if (conditions.length > 1) {
      where.AND = conditions
    }

    // Determine sort order
    let orderBy: Prisma.ProductOrderByWithRelationInput = { publishedAt: 'desc' }
    if (sort === 'price_asc') orderBy = { price: 'asc' }
    else if (sort === 'price_desc') orderBy = { price: 'desc' }

    const userId = await getAuthenticatedUserId(request)
    if (userId) await setAuthCookie(userId)

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
        images: (() => { try { return p.images ? JSON.parse(p.images) : [] } catch { return [] } })(),
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
