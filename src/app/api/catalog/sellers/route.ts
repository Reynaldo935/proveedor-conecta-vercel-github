/**
 * GET /api/catalog/sellers — Registered sellers with their products
 * 
 * Fetches all SELLER users with their BusinessProfile and active products.
 * Used by the supplier catalogs view to show registered vendors
 * alongside official Nicaraguan suppliers.
 */
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category') || ''
    const department = searchParams.get('department') || ''
    const search = searchParams.get('search') || ''

    // Fetch sellers with their business profiles and products
    const sellers = await db.user.findMany({
      where: {
        role: 'SELLER',
        businessProfile: { isNot: null },
      },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        phone: true,
        department: true,
        address: true,
        bio: true,
        website: true,
        isVerified: true,
        createdAt: true,
        businessProfile: {
          select: {
            businessName: true,
            description: true,
            category: true,
            address: true,
            phone: true,
            logo: true,
            coverImage: true,
            hours: true,
            paymentMethods: true,
          },
        },
        products: {
          where: { status: 'ACTIVE' },
          select: {
            id: true,
            title: true,
            description: true,
            price: true,
            discountPrice: true,
            discountPercent: true,
            category: true,
            images: true,
            tags: true,
            quantity: true,
            publishedAt: true,
          },
          orderBy: { publishedAt: 'desc' },
          take: 20,
        },
        _count: {
          select: { products: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    // Transform to SupplierCatalog-compatible format
    let catalogSellers = sellers.map((seller) => ({
      id: `seller-${seller.id}`,
      name: seller.businessProfile?.businessName || seller.name || 'Vendedor',
      description: seller.businessProfile?.description || seller.bio || 'Vendedor registrado en ProveedorConecta',
      logo: seller.businessProfile?.logo || seller.avatar || '',
      websiteUrl: seller.website || '',
      category: seller.businessProfile?.category || 'Otros',
      department: seller.department || 'Nicaragua',
      city: seller.department || '',
      address: seller.businessProfile?.address || seller.address || '',
      phone: seller.businessProfile?.phone || seller.phone || '',
      email: seller.email || '',
      schedule: seller.businessProfile?.hours || 'Consultar horario',
      productCategories: [...new Set(seller.products.map((p) => p.category).filter(Boolean))],
      detailedProducts: seller.products.map((p) => ({
        name: p.title,
        priceRange: p.discountPrice ? `C$${p.discountPrice.toFixed(2)}` : `C$${p.price.toFixed(2)}`,
        unit: p.quantity > 1 ? `${p.quantity} disponibles` : '1 disponible',
        description: p.description?.substring(0, 100) || '',
      })),
      featured: seller.isVerified,
      tags: seller.products.flatMap((p) => (p.tags ? p.tags.split(',').map((t) => t.trim()) : [])).slice(0, 5),
      isRegisteredSeller: true,
      sellerId: seller.id,
      productCount: seller._count.products,
      verified: seller.isVerified,
      joinedAt: seller.createdAt,
    }))

    // Apply filters
    if (category) {
      catalogSellers = catalogSellers.filter((s) => s.category === category)
    }
    if (department) {
      catalogSellers = catalogSellers.filter(
        (s) => s.department.toLowerCase() === department.toLowerCase()
      )
    }
    if (search) {
      const q = search.toLowerCase()
      catalogSellers = catalogSellers.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.description.toLowerCase().includes(q) ||
          s.productCategories.some((c) => c.toLowerCase().includes(q)) ||
          s.detailedProducts.some((p) => p.name.toLowerCase().includes(q)) ||
          s.tags.some((t) => t.toLowerCase().includes(q))
      )
    }

    return NextResponse.json({
      success: true,
      data: catalogSellers,
      total: catalogSellers.length,
      meta: {
        type: 'registered-sellers',
        lastUpdated: new Date().toISOString(),
      },
    })
  } catch (error) {
    console.error('Registered sellers catalog error:', error)
    return NextResponse.json(
      { success: true, data: [], total: 0, meta: { type: 'registered-sellers', error: 'DB unavailable' } },
      { status: 200 }
    )
  }
}
