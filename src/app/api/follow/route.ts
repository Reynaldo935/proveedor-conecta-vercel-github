import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthenticatedUserId, setAuthCookie } from '@/lib/auth'

// GET /api/follow?userId=xxx&type=followers|following — list followers or following
export async function GET(request: NextRequest) {
  try {
    const currentUserId = await getAuthenticatedUserId(request)
    if (currentUserId) await setAuthCookie(currentUserId)

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId') || currentUserId
    const type = searchParams.get('type') || 'followers' // followers or following

    if (!userId) {
      return NextResponse.json({ success: false, error: 'userId requerido o iniciar sesión' }, { status: 200 })
    }

    if (type === 'following') {
      const following = await db.follow.findMany({
        where: { followerId: userId },
        include: {
          following: {
            select: {
              id: true, name: true, avatar: true,
              businessProfile: { select: { businessName: true, logo: true, category: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      })

      return NextResponse.json({
        success: true,
        data: following.map(f => ({
          id: f.id,
          userId: f.following.id,
          name: f.following.name,
          avatar: f.following.avatar,
          businessName: f.following.businessProfile?.businessName,
          logo: f.following.businessProfile?.logo,
          category: f.following.businessProfile?.category,
          createdAt: f.createdAt,
          isFollowing: true,
        })),
      })
    } else {
      const followers = await db.follow.findMany({
        where: { followingId: userId },
        include: {
          follower: {
            select: {
              id: true, name: true, avatar: true,
              businessProfile: { select: { businessName: true, logo: true, category: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      })

      // Check if current user follows back
      const currentFollowingIds = currentUserId
        ? (await db.follow.findMany({ where: { followerId: currentUserId }, select: { followingId: true } })).map(f => f.followingId)
        : []

      return NextResponse.json({
        success: true,
        data: followers.map(f => ({
          id: f.id,
          userId: f.follower.id,
          name: f.follower.name,
          avatar: f.follower.avatar,
          businessName: f.follower.businessProfile?.businessName,
          logo: f.follower.businessProfile?.logo,
          category: f.follower.businessProfile?.category,
          createdAt: f.createdAt,
          isFollowing: currentFollowingIds.includes(f.follower.id),
        })),
      })
    }
  } catch (error) {
    console.error('Get follow error:', error)
    return NextResponse.json({ success: false, error: 'Error al obtener seguidores' }, { status: 200 })
  }
}

// POST /api/follow — toggle follow/unfollow
export async function POST(request: NextRequest) {
  try {
    const userId = await getAuthenticatedUserId(request)
    if (!userId) return NextResponse.json({ success: false, error: 'No autenticado' }, { status: 200 })
    await setAuthCookie(userId)

    const body = await request.json()
    const { followingId } = body
    if (!followingId) return NextResponse.json({ success: false, error: 'followingId requerido' }, { status: 200 })

    if (followingId === userId) {
      return NextResponse.json({ success: false, error: 'No puedes seguirte a ti mismo' }, { status: 200 })
    }

    // Verify target user exists
    const targetUser = await db.user.findUnique({ where: { id: followingId } })
    if (!targetUser) {
      return NextResponse.json({ success: false, error: 'Usuario no encontrado' }, { status: 200 })
    }

    const existing = await db.follow.findUnique({
      where: { followerId_followingId: { followerId: userId, followingId } },
    })

    if (existing) {
      await db.follow.delete({ where: { id: existing.id } })
      return NextResponse.json({ success: true, data: { following: false } })
    } else {
      await db.follow.create({ data: { followerId: userId, followingId } })

      // Notify the followed user
      await db.notification.create({
        data: {
          userId: followingId,
          type: 'FOLLOW',
          title: 'Nuevo seguidor',
          message: `Alguien comenzó a seguirte`,
          link: `/users/${userId}`,
        },
      })

      return NextResponse.json({ success: true, data: { following: true } })
    }
  } catch (error) {
    console.error('Toggle follow error:', error)
    return NextResponse.json({ success: false, error: 'Error al seguir' }, { status: 200 })
  }
}
