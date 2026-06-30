/**
 * PATCH /api/auth/role — Upgrade user role (BUYER → SELLER)
 * 
 * Allows authenticated users to upgrade from BUYER to SELLER.
 * Admin can set any role.
 */
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthenticatedUser } from '@/lib/auth'

export async function PATCH(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser()
    if (!user) {
      return NextResponse.json({ success: false, error: 'No autenticado' }, { status: 200 })
    }

    const body = await request.json()
    const { role, targetUserId } = body

    // Admin can change anyone's role
    if (user.role === 'ADMIN' && targetUserId) {
      const validRoles = ['BUYER', 'SELLER', 'ADMIN']
      if (!validRoles.includes(role)) {
        return NextResponse.json({ success: false, error: 'Rol inválido' }, { status: 200 })
      }

      await db.user.update({
        where: { id: targetUserId },
        data: { role },
      })

      return NextResponse.json({ success: true, message: `Rol actualizado a ${role}` })
    }

    // Regular user can only upgrade themselves from BUYER to SELLER
    if (user.role === 'BUYER' && role === 'SELLER' && (!targetUserId || targetUserId === user.id)) {
      // Create BusinessProfile if not exists
      const existingBP = await db.businessProfile.findUnique({
        where: { userId: user.id as string },
      })

      if (!existingBP) {
        await db.businessProfile.create({
          data: {
            userId: user.id as string,
            businessName: user.name || 'Mi Negocio',
            category: 'Otros',
            phone: user.phone || '',
            address: user.address || '',
          },
        })
      }

      await db.user.update({
        where: { id: user.id as string },
        data: { role: 'SELLER' },
      })

      return NextResponse.json({ success: true, message: '¡Ahora eres Vendedor! Completa tu perfil de negocio.' })
    }

    return NextResponse.json({ success: false, error: 'No tienes permiso para este cambio' }, { status: 200 })
  } catch (error) {
    console.error('Role update error:', error)
    return NextResponse.json({ success: false, error: 'Error al actualizar rol' }, { status: 200 })
  }
}
