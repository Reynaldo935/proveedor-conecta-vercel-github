/**
 * User Search API
 * ProveedorConecta Nicaragua
 * 
 * GET /api/users/search?q=nombre&type=all|buyers|sellers
 * Search users by name, email, or ID
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthenticatedUserId, setAuthCookie } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const userId = await getAuthenticatedUserId(request)
    if (!userId) {
      return NextResponse.json({ success: false, message: 'No autenticado' }, { status: 200 })
    }
    await setAuthCookie(userId)

    const { searchParams } = new URL(request.url)
    const q = (searchParams.get('q') || '').trim()
    const type = searchParams.get('type') || 'all'
    const limit = parseInt(searchParams.get('limit') || '20')

    if (!q || q.length < 1) {
      // Return suggested users (recently active)
      const recentUsers = await db.user.findMany({
        where: {
          id: { not: userId },
        },
        select: {
          id: true,
          name: true,
          email: true,
          avatar: true,
          role: true,
          department: true,
          isVerified: true,
          bio: true,
          businessProfile: {
            select: { businessName: true, logo: true, category: true },
          },
          _count: {
            select: { products: { where: { status: 'ACTIVE' } }, followers: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
      })

      return NextResponse.json({
        success: true,
        data: recentUsers.map(u => ({
          ...u,
          productCount: u._count.products,
          followerCount: u._count.followers,
          _count: undefined,
          displayName: u.businessProfile?.businessName || u.name,
          displayAvatar: u.businessProfile?.logo || u.avatar,
        })),
      })
    }

    // Search by name, email, or exact ID
    const whereClause: any = {
      id: { not: userId },
      OR: [
        { name: { contains: q } },
        { email: { contains: q } },
      ],
    }

    // Also try exact ID match
    if (q.length > 10) {
      whereClause.OR.push({ id: q })
    }

    // Filter by role type
    if (type === 'sellers') {
      whereClause.role = 'SELLER'
    } else if (type === 'buyers') {
      whereClause.role = 'BUYER'
    }

    const users = await db.user.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        role: true,
        department: true,
        isVerified: true,
        bio: true,
        phone: true,
        businessProfile: {
          select: { businessName: true, logo: true, category: true, description: true },
        },
        _count: {
          select: { products: { where: { status: 'ACTIVE' } }, followers: true, follows: true },
        },
      },
      take: limit,
    })

    return NextResponse.json({
      success: true,
      data: users.map(u => ({
        ...u,
        productCount: u._count.products,
        followerCount: u._count.followers,
        followingCount: u._count.follows,
        _count: undefined,
        displayName: u.businessProfile?.businessName || u.name,
        displayAvatar: u.businessProfile?.logo || u.avatar,
        businessCategory: u.businessProfile?.category || '',
      })),
    })
  } catch (error) {
    console.error('User search error:', error)
    return NextResponse.json({ success: false, message: 'Error al buscar usuarios' }, { status: 200 })
  }
}
