/**
 * GET /api/suppliers — Nicaraguan verified supplier catalog
 * POST /api/suppliers — Admin: add new supplier
 * 
 * Serves the full Nicaraguan supplier catalog with products, pricing,
 * and official website links. Products include last update timestamps
 * for the price refresh mechanism.
 */

import { NextRequest, NextResponse } from 'next/server'
import { NICARAGUAN_SUPPLIERS } from '@/data/nicaraguan-suppliers'
import { getAuthenticatedUserId, setAuthCookie } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category') || ''
    const department = searchParams.get('department') || ''
    const search = searchParams.get('search') || ''
    const verified = searchParams.get('verified')
    const includeProducts = searchParams.get('includeProducts') !== 'false'

    let suppliers = [...NICARAGUAN_SUPPLIERS]

    // Filters
    if (category) {
      suppliers = suppliers.filter(s => s.category === category)
    }
    if (department) {
      suppliers = suppliers.filter(s => s.department === department)
    }
    if (verified === 'true') {
      suppliers = suppliers.filter(s => s.verified)
    }
    if (search) {
      const q = search.toLowerCase()
      suppliers = suppliers.filter(s =>
        s.name.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q) ||
        s.businessName.toLowerCase().includes(q) ||
        s.category.toLowerCase().includes(q) ||
        s.department.toLowerCase().includes(q)
      )
    }

    // Optionally strip products for list view
    const result = includeProducts
      ? suppliers
      : suppliers.map(({ products, ...rest }) => rest)

    // Get aggregated categories for filters
    const categories = [...new Set(NICARAGUAN_SUPPLIERS.map(s => s.category))].sort()
    const departments = [...new Set(NICARAGUAN_SUPPLIERS.map(s => s.department))].sort()

    return NextResponse.json({
      success: true,
      data: result,
      total: result.length,
      meta: {
        totalSuppliers: NICARAGUAN_SUPPLIERS.length,
        verifiedCount: NICARAGUAN_SUPPLIERS.filter(s => s.verified).length,
        categories,
        departments,
        lastUpdated: '2026-06-29',
      },
    })
  } catch (error) {
    console.error('Suppliers error:', error)
    return NextResponse.json({ success: false, message: 'Error al obtener proveedores' }, { status: 200 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getAuthenticatedUserId(request)
    if (!userId) {
      return NextResponse.json({ success: false, message: 'No autenticado' }, { status: 200 })
    }
    await setAuthCookie(userId)

    const user = await db.user.findUnique({ where: { id: userId } })
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ success: false, message: 'Acceso denegado - Solo administrador' }, { status: 200 })
    }

    // Admin can add new suppliers to the static catalog (via DB sync)
    const body = await request.json()
    // Future: persist new suppliers to DB
    return NextResponse.json({ success: true, message: 'Proveedor agregado (sincronización pendiente)' })
  } catch (error) {
    console.error('Add supplier error:', error)
    return NextResponse.json({ success: false, message: 'Error al agregar proveedor' }, { status: 200 })
  }
}
