import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import { validatePhoneNicaragua, validateEmail, NICARAGUA_DEPARTMENTS } from '@/lib/validators'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, name, role, phone, department, address } = body

    // Validate name
    if (!name || name.trim().length === 0) {
      return NextResponse.json({ success: false, error: 'El nombre es requerido' }, { status: 400 })
    }

    // Validate email
    if (!email) {
      return NextResponse.json({ success: false, error: 'El correo electrónico es requerido' }, { status: 400 })
    }
    const emailValidation = validateEmail(email)
    if (!emailValidation.valid) {
      return NextResponse.json({ success: false, error: emailValidation.message }, { status: 400 })
    }

    // Validate password
    if (!password) {
      return NextResponse.json({ success: false, error: 'La contraseña es requerida' }, { status: 400 })
    }
    if (password.length < 6) {
      return NextResponse.json({ success: false, error: 'La contraseña debe tener al menos 6 caracteres' }, { status: 400 })
    }

    // Validate phone
    if (!phone) {
      return NextResponse.json({ success: false, error: 'El teléfono es requerido' }, { status: 400 })
    }
    const phoneValidation = validatePhoneNicaragua(phone)
    if (!phoneValidation.valid) {
      return NextResponse.json({ success: false, error: phoneValidation.message }, { status: 400 })
    }

    // Validate department
    if (!department) {
      return NextResponse.json({ success: false, error: 'El departamento es requerido' }, { status: 400 })
    }
    const validDepartments = NICARAGUA_DEPARTMENTS as readonly string[]
    if (!validDepartments.includes(department)) {
      return NextResponse.json({ success: false, error: 'Departamento inválido. Seleccione un departamento de Nicaragua válido' }, { status: 400 })
    }

    // Validate address
    if (!address || address.trim().length === 0) {
      return NextResponse.json({ success: false, error: 'La dirección es requerida' }, { status: 400 })
    }

    const existing = await db.user.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json({ success: false, error: 'El correo ya está registrado' }, { status: 400 })
    }

    const hashedPassword = await bcrypt.hash(password, 4)
    const userRole = role === 'SELLER' ? 'SELLER' : 'BUYER'

    // Normalize phone: strip spaces/dashes/parens for storage
    const cleanedPhone = phone.replace(/[\s\-\(\)]/g, '')

    const user = await db.user.create({
      data: {
        email,
        name: name.trim(),
        password: hashedPassword,
        role: userRole,
        phone: cleanedPhone,
        department,
        address: address.trim(),
        isVerified: false,
        emailVerified: true, // Auto-verify for demo/hackathon
        phoneVerified: false,
      },
    })

    if (userRole === 'SELLER') {
      await db.businessProfile.create({
        data: { userId: user.id },
      })
    }

    // Auto-verified for demo/hackathon - still generate token for audit
    const token = crypto.randomUUID()
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

    await db.verificationToken.create({
      data: {
        email,
        token,
        expiresAt,
      },
    })

    const { password: _, ...safeUser } = user
    const response = NextResponse.json({
      success: true,
      data: {
        ...safeUser,
        requiresVerification: false,
      },
    })
    response.cookies.set('pc_user_id', user.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: '/',
    })
    return response
  } catch (error) {
    console.error('Register error:', error)
    return NextResponse.json({ success: false, error: 'Error al registrar usuario' }, { status: 500 })
  }
}
