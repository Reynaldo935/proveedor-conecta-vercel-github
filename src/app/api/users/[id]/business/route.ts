import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { cookies } from 'next/headers'

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const cookieStore = await cookies()
    const currentUserId = cookieStore.get('pc_user_id')?.value

    const profile = await db.businessProfile.findUnique({
      where: { userId: id },
      include: {
        wallPosts: { orderBy: { createdAt: 'desc' }, take: 20 },
        user: {
          select: {
            id: true, name: true, avatar: true,
            followers: { select: { followerId: true } },
            _count: { select: { products: { where: { status: 'ACTIVE' } } } },
          },
        },
      },
    })

    if (!profile) return NextResponse.json({ success: false, error: 'Perfil no encontrado' }, { status: 404 })

    const isFollowing = currentUserId ? profile.user.followers.some(f => f.followerId === currentUserId) : false

    return NextResponse.json({
      success: true,
      data: {
        ...profile,
        user: {
          ...profile.user,
          isFollowing,
          followerCount: profile.user.followers.length,
          productCount: profile.user._count.products,
          followers: undefined,
          _count: undefined,
        },
      },
    })
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
      create: {
        userId: id,
        businessName: businessName || '',
        description: description || '',
        category: category || '',
        address: address || '',
        latitude,
        longitude,
        phone: phone || '',
        coverImage: coverImage || '',
        logo: logo || '',
        hours: hours || '',
        paymentMethods: paymentMethods ? JSON.stringify(paymentMethods) : '',
      },
      update: {
        ...(businessName !== undefined && { businessName }),
        ...(description !== undefined && { description }),
        ...(category !== undefined && { category }),
        ...(address !== undefined && { address }),
        ...(latitude !== undefined && { latitude }),
        ...(longitude !== undefined && { longitude }),
        ...(phone !== undefined && { phone }),
        ...(coverImage !== undefined && { coverImage }),
        ...(logo !== undefined && { logo }),
        ...(hours !== undefined && { hours }),
        ...(paymentMethods !== undefined && { paymentMethods: JSON.stringify(paymentMethods) }),
      },
    })

    await db.auditLog.create({
      data: {
        userId,
        action: 'UPDATE_BUSINESS_PROFILE',
        entity: 'BusinessProfile',
        entityId: profile.id,
        details: `Perfil de negocio actualizado: ${businessName || profile.businessName}`,
      },
    })

    return NextResponse.json({ success: true, data: profile })
  } catch (error) {
    console.error('Update business profile error:', error)
    return NextResponse.json({ success: false, error: 'Error al actualizar perfil de negocio' }, { status: 500 })
  }
}
