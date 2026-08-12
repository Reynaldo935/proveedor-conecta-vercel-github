/**
 * GET /api/admin/users — List all registered users (Admin only)
 * 
 * Returns full user list with role, email, products count, join date.
 * Admin can filter by role and search by email/name.
 */
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthenticatedUser } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser()
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Acceso denegado' }, { status: 200 })
    }

    const { searchParams } = new URL(request.url)
    const role = searchParams.get('role') || ''
    const search = searchParams.get('search') || ''
    const limit = parseInt(searchParams.get('limit') || '100')
    const page = parseInt(searchParams.get('page') || '1')
    const skip = (page - 1) * limit

    const where: any = {}
    if (role && ['BUYER', 'SELLER', 'ADMIN'].includes(role)) {
      where.role = role
    }
    if (search) {
      where.OR = [
        { email: { contains: search } },
        { name: { contains: search } },
      ]
    }

    const [users, total] = await Promise.all([
      db.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          avatar: true,
          phone: true,
          department: true,
          isVerified: true,
          emailVerified: true,
          createdAt: true,
          updatedAt: true,
          _count: { select: { products: true } },
          businessProfile: {
            select: { businessName: true, category: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      db.user.count({ where }),
    ])

    return NextResponse.json({
      success: true,
      data: users,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      meta: {
        totalUsers: total,
        filters: { role: role || 'all', search: search || '' },
      },
    })
  } catch (error) {
    console.error('Admin users list error:', error)
    return NextResponse.json({ success: true, data: [], total: 0 }, { status: 200 })
  }
}

/**
 * PUT /api/admin/users — Cambiar rol de usuario (Admin only)
 * Body: { targetUserId, newRole }
 * newRole debe ser: BUYER, SELLER, o ADMIN
 */
export async function PUT(request: NextRequest) {
  try {
    const admin = await getAuthenticatedUser()
    if (!admin || admin.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Acceso denegado' }, { status: 200 })
    }

    const { targetUserId, newRole } = await request.json()

    if (!targetUserId) {
      return NextResponse.json({ success: false, error: 'targetUserId es requerido' }, { status: 200 })
    }

    if (!newRole || !['BUYER', 'SELLER', 'ADMIN'].includes(newRole)) {
      return NextResponse.json({ success: false, error: 'Rol inválido. Debe ser: BUYER, SELLER o ADMIN' }, { status: 200 })
    }

    // No permitir que el admin se quite su propio rol
    if (targetUserId === admin.id) {
      return NextResponse.json({ success: false, error: 'No puedes cambiar tu propio rol' }, { status: 200 })
    }

    const updated = await db.user.update({
      where: { id: targetUserId },
      data: { role: newRole },
      select: { id: true, email: true, name: true, role: true },
    })

    await db.auditLog.create({
      data: {
        userId: admin.id,
        action: 'CHANGE_ROLE',
        entity: 'User',
        entityId: targetUserId,
        details: `Rol cambiado a ${newRole} para ${updated.email}`,
      },
    })

    return NextResponse.json({ success: true, data: updated })
  } catch (error) {
    console.error('Admin role change error:', error)
    return NextResponse.json({ success: false, error: 'Error al cambiar rol' }, { status: 200 })
  }
}
