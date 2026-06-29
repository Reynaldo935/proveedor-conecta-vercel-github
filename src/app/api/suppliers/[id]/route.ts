/**
 * GET /api/suppliers/[id] — Single supplier with full product catalog
 */

import { NextRequest, NextResponse } from 'next/server'
import { NICARAGUAN_SUPPLIERS } from '@/data/nicaraguan-suppliers'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supplier = NICARAGUAN_SUPPLIERS.find(s => s.id === id)

    if (!supplier) {
      return NextResponse.json({ success: false, message: 'Proveedor no encontrado' }, { status: 200 })
    }

    return NextResponse.json({
      success: true,
      data: supplier,
    })
  } catch (error) {
    console.error('Supplier detail error:', error)
    return NextResponse.json({ success: false, message: 'Error al obtener proveedor' }, { status: 200 })
  }
}
