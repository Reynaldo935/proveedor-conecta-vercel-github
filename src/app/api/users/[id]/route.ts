import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const user = await db.user.findUnique({
      where: { id },
      include: { businessProfile: true },
    })

    if (!user) return NextResponse.json({ success: false, error: 'Usuario no encontrado' }, { status: 404 })

    const { password: _, ...safeUser } = user
    return NextResponse.json({ success: true, data: safeUser })
  } catch (error) {
    console.error('Get user error:', error)
    return NextResponse.json({ success: false, error: 'Error al obtener usuario' }, { status: 500 })
  }
}
