import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { validatePhoneNicaragua } from '@/lib/validators'

/**
 * Asegura que la tabla PhoneVerification exista en la base de datos.
 * Útil cuando se despliega en Turso sin migraciones previas.
 */
async function ensurePhoneVerificationTable() {
  try {
    await db.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS PhoneVerification (
        id TEXT PRIMARY KEY,
        phone TEXT NOT NULL,
        code TEXT NOT NULL,
        verified INTEGER NOT NULL DEFAULT 0,
        expiresAt DATETIME NOT NULL,
        createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `)
  } catch (err) {
    console.error('[PhoneVerify] Failed to create table:', err)
  }
}

// POST /api/auth/phone-verify
// Send verification code: { phone: string }
// Verify code: { phone: string, code: string, action: "verify" }
export async function POST(request: NextRequest) {
  try {
    // Asegurar que la tabla existe (primera llamada en producción)
    await ensurePhoneVerificationTable()

    const body = await request.json()
    const { phone, code, action } = body

    if (!phone) {
      return NextResponse.json(
        { success: false, error: 'Teléfono es requerido' },
        { status: 200 }
      )
    }

    // Validate phone format
    const phoneValidation = validatePhoneNicaragua(phone)
    if (!phoneValidation.valid) {
      return NextResponse.json(
        { success: false, error: phoneValidation.message },
        { status: 200 }
      )
    }

    // Normalize phone for storage
    const cleanedPhone = phone.replace(/[\s\-\(\)]/g, '')

    // Action: verify code
    if (action === 'verify') {
      if (!code) {
        return NextResponse.json(
          { success: false, error: 'Código de verificación es requerido' },
          { status: 200 }
        )
      }

      const record = await db.phoneVerification.findFirst({
        where: { phone: cleanedPhone },
        orderBy: { createdAt: 'desc' },
      })

      if (!record) {
        return NextResponse.json(
          { success: false, error: 'No se encontró código de verificación para este teléfono' },
          { status: 200 }
        )
      }

      // Check if already verified
      if (record.verified) {
        return NextResponse.json(
          { success: false, error: 'Este teléfono ya fue verificado' },
          { status: 200 }
        )
      }

      // Check expiry
      if (record.expiresAt < new Date()) {
        await db.phoneVerification.delete({ where: { id: record.id } })
        return NextResponse.json(
          { success: false, error: 'El código ha expirado. Solicita uno nuevo.', expired: true },
          { status: 200 }
        )
      }

      // Check code match
      if (record.code !== code) {
        return NextResponse.json(
          { success: false, error: 'Código de verificación incorrecto' },
          { status: 200 }
        )
      }

      // Mark as verified
      await db.phoneVerification.update({
        where: { id: record.id },
        data: { verified: true },
      })

      // Update user phoneVerified if a user exists with this phone
      const user = await db.user.findFirst({
        where: { phone: cleanedPhone },
      })
      if (user) {
        await db.user.update({
          where: { id: user.id },
          data: { phoneVerified: true },
        })
      }

      return NextResponse.json({
        success: true,
        data: { phone: cleanedPhone, verified: true },
      })
    }

    // Action: send verification code (default)
    // Delete any existing codes for this phone
    await db.phoneVerification.deleteMany({
      where: { phone: cleanedPhone },
    })

    // Generate 6-digit code
    const verifyCode = Math.floor(100000 + Math.random() * 900000).toString()
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes

    await db.phoneVerification.create({
      data: {
        phone: cleanedPhone,
        code: verifyCode,
        verified: false,
        expiresAt,
      },
    })

    // Simulate SMS sending
    console.log(`[SMS SIMULATION] Verification code for ${cleanedPhone}: ${verifyCode}`)

    return NextResponse.json({
      success: true,
      data: {
        phone: cleanedPhone,
        code: verifyCode, // Return code for demo purposes (no real SMS)
        expiresIn: 600, // 10 minutes in seconds
      },
    })
  } catch (error) {
    console.error('Phone verification error:', error)
    return NextResponse.json(
      { success: false, error: 'Error en la verificación de teléfono' },
      { status: 200 }
    )
  }
}
