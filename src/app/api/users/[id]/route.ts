import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthenticatedUserId, setAuthCookie } from '@/lib/auth'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const currentUserId = await getAuthenticatedUserId(request)
    if (currentUserId) await setAuthCookie(currentUserId)

    const user = await db.user.findUnique({
      where: { id },
      include: {
        businessProfile: true,
        followers: { select: { followerId: true } },
        _count: {
          select: {
            products: { where: { status: 'ACTIVE' } },
            followers: true,
            follows: true,
          },
        },
      },
    })

    if (!user) return NextResponse.json({ success: false, error: 'Usuario no encontrado' }, { status: 200 })

    const { password: _, ...safeUser } = user
    const isFollowing = currentUserId ? user.followers.some(f => f.followerId === currentUserId) : false

    return NextResponse.json({
      success: true,
      data: {
        ...safeUser,
        isFollowing,
        followerCount: user._count.followers,
        followingCount: user._count.follows,
        productCount: user._count.products,
        followers: undefined,
        _count: undefined,
      },
    })
  } catch (error) {
    console.error('Get user error:', error)
    return NextResponse.json({ success: false, error: 'Error al obtener usuario' }, { status: 200 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const userId = await getAuthenticatedUserId(request)

    if (!userId || userId !== id) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 200 })
    }
    await setAuthCookie(userId)

    const body = await request.json()
    const { name, phone, address, bio, avatar } = body

    const user = await db.user.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(phone !== undefined && { phone }),
        ...(address !== undefined && { address }),
        ...(bio !== undefined && { bio }),
        ...(avatar !== undefined && { avatar }),
      },
      include: { businessProfile: true },
    })

    const { password: _, ...safeUser } = user
    return NextResponse.json({ success: true, data: safeUser })
  } catch (error) {
    console.error('Update user error:', error)
    return NextResponse.json({ success: false, error: 'Error al actualizar usuario' }, { status: 200 })
  }
}
