import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthenticatedUserId, setAuthCookie } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const userId = await getAuthenticatedUserId(request)
    if (!userId) return NextResponse.json({ success: false, error: 'No autenticado' }, { status: 200 })
    await setAuthCookie(userId)

    const { searchParams } = new URL(request.url)
    const role = searchParams.get('role') || 'buyer'
    const status = searchParams.get('status') || ''

    let where: Record<string, unknown>

    if (role === 'seller') {
      // Seller sees cotizaciones that they have responded to OR open ones in their category
      where = {
        responses: { some: { sellerId: userId } },
      }
    } else {
      // Buyer sees their own cotizaciones
      where = { buyerId: userId }
    }

    if (status) where.status = status

    const cotizaciones = await db.cotizacion.findMany({
      where,
      include: {
        buyer: { select: { id: true, name: true, avatar: true } },
        responses: {
          include: {
            seller: { select: { id: true, name: true, avatar: true, businessProfile: { select: { businessName: true, logo: true } } } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    // Also get open cotizaciones that the seller hasn't responded to yet (for seller view)
    if (role === 'seller') {
      const sellerProfile = await db.businessProfile.findUnique({ where: { userId } })
      const openCotizaciones = await db.cotizacion.findMany({
        where: {
          status: 'OPEN',
          responses: { none: { sellerId: userId } },
          ...(sellerProfile?.category ? { category: { contains: sellerProfile.category } } : {}),
        },
        include: {
          buyer: { select: { id: true, name: true, avatar: true } },
          responses: {
            include: {
              seller: { select: { id: true, name: true, avatar: true, businessProfile: { select: { businessName: true } } } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      })

      // Merge and deduplicate
      const existingIds = new Set(cotizaciones.map(c => c.id))
      const merged = [...cotizaciones, ...openCotizaciones.filter(c => !existingIds.has(c.id))]
      merged.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())

      return NextResponse.json({ success: true, data: merged })
    }

    return NextResponse.json({ success: true, data: cotizaciones })
  } catch (error) {
    console.error('Get cotizaciones error:', error)
    return NextResponse.json({ success: false, error: 'Error al obtener cotizaciones' }, { status: 200 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getAuthenticatedUserId(request)
    if (!userId) return NextResponse.json({ success: false, error: 'No autenticado' }, { status: 200 })
    await setAuthCookie(userId)

    const body = await request.json()
    const { title, description, category } = body

    if (!title) return NextResponse.json({ success: false, error: 'Título es requerido' }, { status: 200 })
    if (title.length < 5) return NextResponse.json({ success: false, error: 'El título debe tener al menos 5 caracteres' }, { status: 200 })

    const cotizacion = await db.cotizacion.create({
      data: { buyerId: userId, title, description: description || '', category: category || '', status: 'OPEN' },
      include: {
        buyer: { select: { id: true, name: true, avatar: true } },
      },
    })

    return NextResponse.json({ success: true, data: cotizacion })
  } catch (error) {
    console.error('Create cotizacion error:', error)
    return NextResponse.json({ success: false, error: 'Error al crear cotización' }, { status: 200 })
  }
}
