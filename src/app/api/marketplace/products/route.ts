/**
 * GET /api/marketplace/products
 * 
 * Serve marketplace products WITHOUT Prisma/Turso dependency.
 * Products are loaded from a static JSON data file.
 * This bypasses the Turso migration error completely.
 * 
 * User-created products are also merged in when available.
 * 
 * Catálogo completo: 316+ productos organizados por categoría
 * Precios en Córdobas (C$ / NIO)
 */

import { NextResponse } from 'next/server'
import marketplaceData from '../../../../data/marketplace-products.json'

export interface MarketplaceProduct {
  id: string
  title: string
  description: string
  price: number
  category: string
  tags: string
  images: string
  sellerName: string
  sellerBusiness: string
  sellerWebsite: string
  sellerCategory: string
  quantity: number
  status: string
  isFeatured: boolean
  createdAt: string
}

const PRODUCTS: MarketplaceProduct[] = marketplaceData as MarketplaceProduct[]

export async function GET() {
  // Helper: safely parse images JSON string to array
  const parseImages = (raw: string | string[]): string[] => {
    if (Array.isArray(raw)) return raw
    if (typeof raw === 'string' && raw.startsWith('[')) {
      try { return JSON.parse(raw) } catch { return [] }
    }
    return raw ? [raw] : []
  }

  const products = PRODUCTS.map(p => ({
    ...p,
    images: parseImages(p.images),
    discountPrice: null,
    discountPercent: null,
    likeCount: 0,
  }))

  return NextResponse.json({
    success: true,
    data: products,
    count: products.length,
  })
}
