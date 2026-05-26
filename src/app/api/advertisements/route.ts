import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUserId, setAuthCookie } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const userId = await getAuthenticatedUserId(request)

    if (!userId) {
      return NextResponse.json({ success: false, error: 'No autenticado' }, { status: 401 })
    }
    await setAuthCookie(userId)

    const user = await db.user.findUnique({ where: { id: userId } })
    if (!user || user.email !== 'rey7214935@gmail.com') {
      return NextResponse.json({ success: false, error: 'Acceso denegado' }, { status: 403 })
    }

    const ads = await db.advertisement.findMany({
      include: {
        seller: {
          select: { name: true, email: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ success: true, data: ads })
  } catch (error) {
    console.error('Advertisements error:', error)
    return NextResponse.json({ success: false, error: 'Error al obtener anuncios' }, { status: 500 })
  }
}
