import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthenticatedUser, setAuthCookie } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request)

    if (!user) {
      return NextResponse.json({ success: false, error: 'No autenticado' }, { status: 200 })
    }

    // Re-set the auth cookie to ensure it persists
    await setAuthCookie(user.id as string)

    return NextResponse.json({
      success: true,
      data: {
        ...user,
        phoneVerified: (user as Record<string, unknown>).phoneVerified,
      },
    })
  } catch (error) {
    console.error('Get current user error:', error)
    return NextResponse.json({ success: false, error: 'Error al obtener usuario' }, { status: 200 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request)

    if (!user) {
      return NextResponse.json({ success: false, error: 'No autenticado' }, { status: 200 })
    }

    const userId = user.id as string
    const body = await request.json()
    const { name, phone, department, address, bio, avatar, coverPhoto, website } = body

    const updateData: Record<string, unknown> = {}
    if (name !== undefined) updateData.name = name
    if (phone !== undefined) updateData.phone = phone
    if (department !== undefined) updateData.department = department
    if (address !== undefined) updateData.address = address
    if (bio !== undefined) updateData.bio = bio
    if (avatar !== undefined) updateData.avatar = avatar
    if (coverPhoto !== undefined) updateData.coverPhoto = coverPhoto
    if (website !== undefined) updateData.website = website

    const updatedUser = await db.user.update({
      where: { id: userId },
      data: updateData,
      include: { businessProfile: true },
    })

    // Re-set the auth cookie
    await setAuthCookie(userId)

    const { password: _, ...safeUser } = updatedUser
    return NextResponse.json({
      success: true,
      data: {
        ...safeUser,
        phoneVerified: updatedUser.phoneVerified,
      },
    })
  } catch (error) {
    console.error('Update user error:', error)
    return NextResponse.json({ success: false, error: 'Error al actualizar usuario' }, { status: 200 })
  }
}
