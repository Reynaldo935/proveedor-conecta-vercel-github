/**
 * GET /api/export/my-data
 * 
 * Export the authenticated user's personal data in JSON/CSV format.
 * Includes: profile, products, transactions, messages, saved products.
 * 
 * Query params:
 *   format=json (default) | csv
 *   scope=all | profile | products | transactions
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthenticatedUserId, setAuthCookie } from '@/lib/auth'

function jsonToCsv(data: Record<string, unknown>[]): string {
  if (data.length === 0) return ''
  const headers = Object.keys(data[0])
  const rows = data.map(row =>
    headers.map(h => {
      const val = row[h]
      if (val === null || val === undefined) return ''
      const str = typeof val === 'object' ? JSON.stringify(val) : String(val)
      return str.includes(',') || str.includes('"') || str.includes('\n')
        ? `"${str.replace(/"/g, '""')}"`
        : str
    }).join(',')
  )
  return [headers.join(','), ...rows].join('\n')
}

export async function GET(request: NextRequest) {
  try {
    const userId = await getAuthenticatedUserId(request)
    if (!userId) {
      return NextResponse.json({ success: false, message: 'No autenticado' }, { status: 200 })
    }
    await setAuthCookie(userId)

    const { searchParams } = new URL(request.url)
    const format = searchParams.get('format') || 'json'
    const scope = searchParams.get('scope') || 'all'

    // Fetch user profile
    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true, email: true, name: true, phone: true, department: true,
        address: true, bio: true, role: true, avatar: true,
        emailVerified: true, phoneVerified: true,
        createdAt: true, updatedAt: true,
      },
    })

    if (!user) {
      return NextResponse.json({ success: false, message: 'Usuario no encontrado' }, { status: 200 })
    }

    const exportData: Record<string, unknown> = {}

    // Profile data
    if (scope === 'all' || scope === 'profile') {
      const businessProfile = await db.businessProfile.findUnique({ where: { userId } })
      exportData.profile = { ...user, businessProfile }
    }

    // Products data
    if (scope === 'all' || scope === 'products') {
      const products = await db.product.findMany({
        where: { sellerId: userId },
        select: {
          id: true, title: true, description: true, price: true,
          discountPrice: true, category: true, tags: true, images: true,
          quantity: true, status: true, createdAt: true, updatedAt: true,
        },
      })
      exportData.products = products.map(p => ({
        ...p,
        images: (() => { try { return JSON.parse(p.images || '[]') } catch { return [] } })(),
      }))
    }

    // Transactions data
    if (scope === 'all' || scope === 'transactions') {
      const purchases = await db.transaction.findMany({
        where: { buyerId: userId },
        select: {
          id: true, productId: true, amount: true, commission: true,
          status: true, paymentMethod: true, createdAt: true,
        },
      })
      const sales = await db.transaction.findMany({
        where: { sellerId: userId },
        select: {
          id: true, productId: true, amount: true, commission: true,
          sellerPayout: true, status: true, paymentMethod: true, createdAt: true,
        },
      })
      exportData.transactions = { purchases, sales }
    }

    // Saved products
    if (scope === 'all') {
      const saved = await db.savedProduct.findMany({
        where: { userId },
        include: {
          product: {
            select: { id: true, title: true, price: true, category: true },
          },
        },
      })
      exportData.savedProducts = saved.map(s => s.product)
    }

    // Follows
    if (scope === 'all') {
      const following = await db.follow.findMany({
        where: { followerId: userId },
        include: {
          following: { select: { id: true, name: true, email: true } },
        },
      })
      exportData.following = following.map(f => f.following)
    }

    if (format === 'csv') {
      // Simple CSV: flatten to one table per section
      const csvParts: string[] = []
      for (const [key, value] of Object.entries(exportData)) {
        if (Array.isArray(value) && value.length > 0) {
          csvParts.push(`# ${key.toUpperCase()}\n${jsonToCsv(value as Record<string, unknown>[])}`)
        } else if (value && !Array.isArray(value)) {
          csvParts.push(`# ${key.toUpperCase()}\n${jsonToCsv([value as Record<string, unknown>])}`)
        }
      }
      return new NextResponse(csvParts.join('\n\n'), {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="proveedorconecta-export-${userId}-${new Date().toISOString().split('T')[0]}.csv"`,
        },
      })
    }

    // Default: JSON
    return NextResponse.json({
      success: true,
      data: {
        exportedAt: new Date().toISOString(),
        userId,
        ...exportData,
      },
    })
  } catch (error) {
    console.error('Export data error:', error)
    return NextResponse.json({ success: false, message: 'Error al exportar datos' }, { status: 200 })
  }
}
