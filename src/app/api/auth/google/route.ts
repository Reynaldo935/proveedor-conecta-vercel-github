import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { cookies } from 'next/headers'
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
      // Update Google ID and any provided fields, but do NOT auto-verify email
      const updateData: Record<string, unknown> = {
        googleId: googleId || user.googleId,
        avatar: avatar || user.avatar,
        name: name || user.name,
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
      // Create new user from Google — email NOT verified by default
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
          emailVerified: false, // Must verify even for Google users
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

    // If email not verified, generate verification token
    let verificationLink: string | undefined
    let verificationToken: string | undefined

    if (!user!.emailVerified) {
      // Delete existing tokens for this email
      await db.verificationToken.deleteMany({ where: { email } })

      const token = crypto.randomUUID()
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000)

      await db.verificationToken.create({
        data: { email, token, expiresAt },
      })

      verificationLink = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/auth/verify?token=${token}`
      verificationToken = token

      console.log(`[EMAIL SIMULATION] Google auth verification email for ${email}`)
      console.log(`[EMAIL SIMULATION] Link: ${verificationLink}`)
    }

    const cookieStore = await cookies()
    cookieStore.set('pc_user_id', user!.id, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30,
      path: '/',
    })

    const { password: _, ...safeUser } = user!
    return NextResponse.json({
      success: true,
      data: {
        ...safeUser,
        verificationLink,
        verificationToken,
        requiresVerification: !user!.emailVerified,
      },
    })
  } catch (error) {
    console.error('Google auth error:', error)
    return NextResponse.json({ success: false, error: 'Error al autenticar con Google' }, { status: 500 })
  }
}
