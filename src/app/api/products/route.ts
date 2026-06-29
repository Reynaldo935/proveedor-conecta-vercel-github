import { NextRequest, NextResponse } from 'next/server'
import { MEGA_CATALOG } from '@/data/mega-catalog'
import { getAuthenticatedUserId, setAuthCookie } from '@/lib/auth'

// DB import is dynamic in GET, but static for POST
let _db: any = null
async function getDb() {
  if (!_db) {
    const { db } = await import('@/lib/db')
    _db = db
  }
  return _db
}

// Helper: safely parse images JSON string to array
function parseImages(raw: unknown): string[] {
  if (Array.isArray(raw)) return raw
  if (typeof raw === 'string' && raw.length > 0) {
    try { const parsed = JSON.parse(raw); return Array.isArray(parsed) ? parsed : [] } catch { return [] }
  }
  return []
}

// Static product catalog — always available, zero dependencies
const STATIC_PRODUCTS = MEGA_CATALOG.map(p => ({
  id: p.id,
  title: p.title,
  description: p.description,
  price: p.price,
  discountPrice: p.discountPrice ?? null,
  discountPercent: p.discountPercent ?? null,
  category: p.category,
  tags: p.tags,
  images: parseImages(p.images),
  quantity: p.quantity,
  status: 'ACTIVE' as const,
  isFeatured: p.featured ?? false,
  sellerId: p.id + '-seller',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  seller: {
    id: p.id + '-seller',
    name: p.seller?.name || 'Proveedor',
    avatar: '',
    address: p.seller?.department || 'Nicaragua',
  },
  likes: [],
  savedBy: [],
  likeCount: Math.floor(Math.random() * 50) + 5,
}))

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category') || ''
    const search = searchParams.get('search') || ''
    const minPrice = parseFloat(searchParams.get('minPrice') || '0') || 0
    const maxPrice = parseFloat(searchParams.get('maxPrice') || '99999999') || 99999999
    const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '20') || 20, 1), 100)

    // Always start with static catalog — guaranteed to work
    let products = [...STATIC_PRODUCTS]

    // Try to enrich with DB data, but never fail if DB is down
    try {
      const db = await getDb()
      const dbProducts = await db.product.findMany({
        where: { status: 'ACTIVE' },
        include: {
          seller: { select: { id: true, name: true, avatar: true, address: true } },
          likes: { select: { id: true } },
        },
        orderBy: { isFeatured: 'desc' },
        take: limit,
      })

      if (dbProducts.length > 0) {
        // Merge DB products with static catalog (DB products take priority)
        const dbIds = new Set(dbProducts.map(p => p.id))
        const dbMapped = dbProducts.map((p: any) => ({
          id: p.id,
          title: p.title,
          description: p.description,
          price: p.price,
          discountPrice: p.discountPrice ?? null,
          discountPercent: p.discountPercent ?? (p.discountPrice && p.price ? Math.round((1 - p.discountPrice / p.price) * 100) : null),
          category: p.category,
          tags: p.tags,
          images: parseImages(p.images),
          quantity: p.quantity,
          status: p.status,
          isFeatured: p.isFeatured,
          sellerId: p.sellerId,
          createdAt: p.createdAt?.toISOString?.() || p.createdAt,
          updatedAt: p.updatedAt?.toISOString?.() || p.updatedAt,
          seller: {
            id: p.seller?.id || p.sellerId,
            name: p.seller?.name || 'Vendedor',
            avatar: p.seller?.avatar || '',
            address: p.seller?.address || '',
          },
          likes: p.likes || [],
          savedBy: [],
          likeCount: p.likes?.length || 0,
        }))
        // DB products first, then static ones not in DB
        products = [...dbMapped, ...products.filter(p => !dbIds.has(p.id))]
      }
    } catch (dbError) {
      // Database unavailable — static catalog is sufficient
      console.warn('[Products API] DB unavailable, using static catalog:', (dbError as Error).message)
    }

    // Apply filters
    if (category) {
      products = products.filter(p => p.category === category)
    }
    if (search) {
      const s = search.toLowerCase()
      products = products.filter(p =>
        p.title.toLowerCase().includes(s) ||
        p.description.toLowerCase().includes(s) ||
        p.tags.toLowerCase().includes(s)
      )
    }
    if (minPrice > 0) {
      products = products.filter(p => p.price >= minPrice)
    }
    if (maxPrice < 99999999) {
      products = products.filter(p => p.price <= maxPrice)
    }

    // Apply limit
    const total = products.length
    products = products.slice(0, limit)

    return NextResponse.json({
      success: true,
      data: products,
      total,
      hasMore: total > limit,
    })
  } catch (error) {
    console.error('Products error:', error)
    // Last-resort fallback: return raw static catalog
    return NextResponse.json({
      success: true,
      data: STATIC_PRODUCTS.slice(0, 20),
      total: STATIC_PRODUCTS.length,
      hasMore: STATIC_PRODUCTS.length > 20,
    })
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getAuthenticatedUserId(request)

    if (!userId) {
      return NextResponse.json({ success: false, error: 'No autenticado' }, { status: 200 })
    }

    // Re-set auth cookie
    await setAuthCookie(userId)

    const db = await getDb()

    const user = await db.user.findUnique({ where: { id: userId } })
    if (!user || user.role !== 'SELLER') {
      return NextResponse.json({ success: false, error: 'Solo vendedores pueden publicar productos' }, { status: 200 })
    }

    const body = await request.json()
    const { title, description, price, discountPrice, discountPercent, category, tags, images, videoUrl, quantity, discountStart, discountEnd, quantityDiscounts } = body

    if (!title || !price) {
      return NextResponse.json({ success: false, error: 'Título y precio son requeridos' }, { status: 200 })
    }

    if (parseFloat(price) <= 0) {
      return NextResponse.json({ success: false, error: 'El precio debe ser mayor que 0' }, { status: 200 })
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
        quantityDiscounts: {
          create: Array.isArray(quantityDiscounts)
            ? quantityDiscounts
                .filter((qd: { minQty: number; discountPercent: number }) => qd.minQty > 0 && qd.discountPercent > 0)
                .map((qd: { minQty: number; discountPercent: number }) => ({
                  minQty: qd.minQty,
                  discountPercent: qd.discountPercent,
                }))
            : [],
        },
      },
      include: {
        seller: { select: { id: true, name: true, avatar: true, businessProfile: { select: { businessName: true } } } },
        quantityDiscounts: true,
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
      data: { ...product, images: (() => { try { return JSON.parse(product.images) } catch { return [] } })(), likeCount: 0, isLiked: false, isSaved: false },
    })
  } catch (error) {
    console.error('Create product error:', error)
    return NextResponse.json({ success: false, error: 'Error al crear producto' }, { status: 200 })
  }
}
