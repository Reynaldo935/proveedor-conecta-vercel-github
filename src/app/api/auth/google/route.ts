import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import crypto from 'crypto'
import { validateEmail, validatePhoneNicaragua, NICARAGUA_DEPARTMENTS } from '@/lib/validators'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, name, googleId, avatar, role, phone, department, address } = body

    if (!email) {
      return NextResponse.json({ success: false, error: 'Email es requerido' }, { status: 400 })
    }

    // Validate email format and reject disposable domains
    const emailValidation = validateEmail(email)
    if (!emailValidation.valid) {
      return NextResponse.json({ success: false, error: 'Correo inválido: ' + emailValidation.message }, { status: 400 })
    }

    // Validate phone if provided
    if (phone) {
      const phoneValidation = validatePhoneNicaragua(phone)
      if (!phoneValidation.valid) {
        return NextResponse.json({ success: false, error: phoneValidation.message }, { status: 400 })
      }
    }

    // Validate department if provided
    if (department) {
      const validDepartments = NICARAGUA_DEPARTMENTS as readonly string[]
      if (!validDepartments.includes(department)) {
        return NextResponse.json({ success: false, error: 'Departamento inválido' }, { status: 400 })
      }
    }

    // Normalize phone if provided
    const cleanedPhone = phone ? phone.replace(/[\s\-\(\)]/g, '') : undefined

    let user = await db.user.findUnique({
      where: { email },
      include: { businessProfile: true },
    })

    if (user) {
      // Update Google ID and any provided fields, auto-verify email for demo
      const updateData: Record<string, unknown> = {
        googleId: googleId || user.googleId,
        avatar: avatar || user.avatar,
        name: name || user.name,
        emailVerified: true, // Auto-verify for demo/hackathon
      }
      // Only update phone/department/address if provided (don't overwrite existing with empty)
      if (cleanedPhone) updateData.phone = cleanedPhone
      if (department) updateData.department = department
      if (address) updateData.address = address

      user = await db.user.update({
        where: { id: user.id },
        data: updateData,
        include: { businessProfile: true },
      })
    } else {
      // Create new user from Google — auto-verify email for demo
      const userRole = role === 'SELLER' ? 'SELLER' : 'BUYER'
      user = await db.user.create({
        data: {
          email,
          name: name || email.split('@')[0],
          googleId: googleId || '',
          avatar: avatar || '',
          role: userRole,
          phone: cleanedPhone || '',
          department: department || '',
          address: address || '',
          isVerified: false,
          emailVerified: true, // Auto-verify for demo/hackathon
          phoneVerified: false,
        },
        include: { businessProfile: true },
      })

      if (userRole === 'SELLER') {
        await db.businessProfile.create({ data: { userId: user.id } })
        user = await db.user.findUnique({
          where: { id: user.id },
          include: { businessProfile: true },
        })
      }
    }

    // Email is auto-verified for demo/hackathon
    const { password: _, ...safeUser } = user!
    const response = NextResponse.json({
      success: true,
      data: {
        ...safeUser,
        requiresVerification: false,
      },
    })
    response.cookies.set('pc_user_id', user!.id, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30,
      path: '/',
    })
    return response
  } catch (error) {
    console.error('Google auth error:', error)
    return NextResponse.json({ success: false, error: 'Error al autenticar con Google' }, { status: 500 })
  }
}
