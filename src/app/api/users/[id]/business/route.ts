import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { cookies } from 'next/headers'

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const profile = await db.businessProfile.findUnique({
      where: { userId: id },
      include: {
        wallPosts: { orderBy: { createdAt: 'desc' }, take: 20 },
        user: { select: { id: true, name: true, avatar: true, followers: true } },
      },
    })

    if (!profile) return NextResponse.json({ success: false, error: 'Perfil no encontrado' }, { status: 404 })

    return NextResponse.json({ success: true, data: profile })
  } catch (error) {
    console.error('Get business profile error:', error)
    return NextResponse.json({ success: false, error: 'Error al obtener perfil de negocio' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const cookieStore = await cookies()
    const userId = cookieStore.get('pc_user_id')?.value

    if (!userId || userId !== id) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 403 })
    }

    const body = await request.json()
    const { businessName, description, category, address, latitude, longitude, phone, coverImage, logo, hours, paymentMethods } = body

    const profile = await db.businessProfile.upsert({
      where: { userId: id },
      create: { userId: id, businessName: businessName || '', description: description || '', category: category || '', address: address || '', latitude, longitude, phone: phone || '', coverImage: coverImage || '', logo: logo || '', hours: hours || '', paymentMethods: paymentMethods ? JSON.stringify(paymentMethods) : '' },
      update: {
        businessName: businessName !== undefined ? businessName : undefined,
        description: description !== undefined ? description : undefined,
        category: category !== undefined ? category : undefined,
        address: address !== undefined ? address : undefined,
        latitude: latitude !== undefined ? latitude : undefined,
        longitude: longitude !== undefined ? longitude : undefined,
        phone: phone !== undefined ? phone : undefined,
        coverImage: coverImage !== undefined ? coverImage : undefined,
        logo: logo !== undefined ? logo : undefined,
        hours: hours !== undefined ? hours : undefined,
        paymentMethods: paymentMethods !== undefined ? JSON.stringify(paymentMethods) : undefined,
      },
    })

    return NextResponse.json({ success: true, data: profile })
  } catch (error) {
    console.error('Update business profile error:', error)
    return NextResponse.json({ success: false, error: 'Error al actualizar perfil de negocio' }, { status: 500 })
  }
}
