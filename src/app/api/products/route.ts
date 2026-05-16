import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { cookies } from 'next/headers'
import { Prisma } from '@prisma/client'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category') || ''
    const search = searchParams.get('search') || ''
    const minPrice = parseFloat(searchParams.get('minPrice') || '0')
    const maxPrice = parseFloat(searchParams.get('maxPrice') || '999999')
    const location = searchParams.get('location') || ''
    const cursor = searchParams.get('cursor') || ''
    const limit = parseInt(searchParams.get('limit') || '20')
    const sellerId = searchParams.get('sellerId') || ''

    const cookieStore = await cookies()
    const userId = cookieStore.get('pc_user_id')?.value

    const where: Prisma.ProductWhereInput = {
      status: 'ACTIVE',
    }

    if (category) where.category = category
    if (sellerId) where.sellerId = sellerId
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { description: { contains: search } },
        { tags: { contains: search } },
      ]
    }
    if (minPrice > 0 || maxPrice < 999999) {
      where.price = { gte: minPrice, lte: maxPrice }
    }
    if (location) {
      where.seller = { address: { contains: location } }
    }
    if (cursor) {
      where.id = { lt: cursor }
    }

    const products = await db.product.findMany({
      where,
      include: {
        seller: {
          select: { id: true, name: true, avatar: true, address: true, businessProfile: { select: { businessName: true, logo: true } } },
        },
        likes: { select: { userId: true } },
      },
      orderBy: { publishedAt: 'desc' },
      take: limit + 1,
    })

    // Get saved status for logged-in users
    let savedProductIds: string[] = []
    if (userId) {
      const saved = await db.savedProduct.findMany({
        where: { userId },
        select: { productId: true },
      })
      savedProductIds = saved.map(s => s.productId)
    }

    const hasMore = products.length > limit
    const items = hasMore ? products.slice(0, limit) : products
    const nextCursor = hasMore ? items[items.length - 1].id : null

    return NextResponse.json({
      success: true,
      data: items.map(p => ({
        ...p,
        images: p.images ? JSON.parse(p.images) : [],
        likeCount: p.likes.length,
        isLiked: userId ? p.likes.some(l => l.userId === userId) : false,
        isSaved: savedProductIds.includes(p.id),
        likes: undefined,
      })),
      nextCursor,
    })
  } catch (error) {
    console.error('Get products error:', error)
    return NextResponse.json({ success: false, error: 'Error al obtener productos' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const userId = cookieStore.get('pc_user_id')?.value

    if (!userId) {
      return NextResponse.json({ success: false, error: 'No autenticado' }, { status: 401 })
    }

    const user = await db.user.findUnique({ where: { id: userId } })
    if (!user || user.role !== 'SELLER') {
      return NextResponse.json({ success: false, error: 'Solo vendedores pueden publicar productos' }, { status: 403 })
    }

    const body = await request.json()
    const { title, description, price, discountPrice, discountPercent, category, tags, images, videoUrl, quantity, discountStart, discountEnd } = body

    if (!title || !price) {
      return NextResponse.json({ success: false, error: 'Título y precio son requeridos' }, { status: 400 })
    }

    if (parseFloat(price) <= 0) {
      return NextResponse.json({ success: false, error: 'El precio debe ser mayor que 0' }, { status: 400 })
    }

    const product = await db.product.create({
      data: {
        sellerId: userId,
        title,
        description: description || '',
        price: parseFloat(price),
        discountPrice: discountPrice ? parseFloat(discountPrice) : null,
        discountPercent: discountPercent ? parseFloat(discountPercent) : null,
        category: category || '',
        tags: tags || '',
        images: JSON.stringify(images || []),
        videoUrl: videoUrl || '',
        quantity: parseInt(quantity) || 1,
        status: 'ACTIVE',
        discountStart: discountStart ? new Date(discountStart) : null,
        discountEnd: discountEnd ? new Date(discountEnd) : null,
      },
      include: {
        seller: { select: { id: true, name: true, avatar: true, businessProfile: { select: { businessName: true } } } },
      },
    })

    await db.auditLog.create({
      data: {
        userId,
        action: 'CREATE_PRODUCT',
        entity: 'Product',
        entityId: product.id,
        details: `Producto creado: ${title}`,
      },
    })

    return NextResponse.json({
      success: true,
      data: { ...product, images: JSON.parse(product.images), likeCount: 0, isLiked: false, isSaved: false },
    })
  } catch (error) {
    console.error('Create product error:', error)
    return NextResponse.json({ success: false, error: 'Error al crear producto' }, { status: 500 })
  }
}
