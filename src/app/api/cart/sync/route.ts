/**
 * Cart API — Server-side cart sync
 * ProveedorConecta Nicaragua
 * 
 * Syncs cart state between localStorage and server when user is logged in.
 * POST /api/cart/sync — Sync cart items to server
 * GET  /api/cart/sync — Get synced cart from server
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

    // Try to get synced cart from localStorage-based approach
    // For now, return empty — the real sync is client-side via localStorage
    return NextResponse.json({
      success: true,
      data: { items: [], message: 'Cart sync ready' },
    })
  } catch (error) {
    console.error('Cart GET error:', error)
    return NextResponse.json({ success: false, message: 'Error al obtener carrito' }, { status: 200 })
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
    const { items } = body

    if (!Array.isArray(items)) {
      return NextResponse.json({ success: false, message: 'Formato de carrito inválido' }, { status: 200 })
    }

    // Validate all products exist and are available
    const validatedItems: Array<{
      productId: string
      title: string
      price: number
      discountPrice: number | null
      quantity: number
      image: string
      sellerName: string
      maxQuantity: number
    }> = []
    for (const item of items) {
      const product = await db.product.findUnique({
        where: { id: item.productId },
        select: { id: true, title: true, price: true, discountPrice: true, quantity: true, status: true, images: true, seller: { select: { name: true } } },
      })

      if (product && product.status === 'ACTIVE' && product.quantity > 0) {
        const imgs: string[] = (() => { try { return JSON.parse(product.images || '[]') } catch { return [] } })()
        validatedItems.push({
          productId: product.id,
          title: product.title,
          price: product.price,
          discountPrice: product.discountPrice,
          quantity: Math.min(item.quantity, product.quantity),
          image: imgs[0] || '',
          sellerName: product.seller.name,
          maxQuantity: product.quantity,
        })
      }
    }

    return NextResponse.json({
      success: true,
      data: { items: validatedItems, count: validatedItems.length },
    })
  } catch (error) {
    console.error('Cart POST error:', error)
    return NextResponse.json({ success: false, message: 'Error al sincronizar carrito' }, { status: 200 })
  }
}
