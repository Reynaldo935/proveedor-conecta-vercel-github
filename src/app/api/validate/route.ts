/**
 * Validation API Route
 * POST /api/validate
 *
 * Consolidates all validation logic from @/lib/validators into an API route.
 * Supports validation types: cedula, card, phone, bank, email, billetera, expiry, cvv
 */

import { NextRequest, NextResponse } from 'next/server'
import {
  validateCedula,
  validateCardNumber,
  validatePhoneNicaragua,
  validateBankAccount,
  validateBankAccountByBank,
  validateEmail,
  validateBilleteraMovil,
  validateCardExpiry,
  validateCVV,
  identifyCardType,
} from '@/lib/validators'

type ValidationType = 'cedula' | 'card' | 'phone' | 'bank' | 'email' | 'billetera' | 'expiry' | 'cvv'

interface ValidateRequestBody {
  type: ValidationType
  value: string
  bank?: string
}

const VALID_TYPES: ValidationType[] = ['cedula', 'card', 'phone', 'bank', 'email', 'billetera', 'expiry', 'cvv']

export async function POST(request: NextRequest) {
  try {
    const body: ValidateRequestBody = await request.json()

    // Validate required fields
    if (!body.type || !body.value) {
      return NextResponse.json(
        { success: false, valid: false, message: 'Se requiere "type" y "value"' },
        { status: 400 }
      )
    }

    // Validate type
    if (!VALID_TYPES.includes(body.type)) {
      return NextResponse.json(
        {
          success: false,
          valid: false,
          message: `Tipo de validación inválido. Tipos válidos: ${VALID_TYPES.join(', ')}`,
        },
        { status: 400 }
      )
    }

    let result: { valid: boolean; message: string }
    let details: Record<string, unknown> | undefined

    switch (body.type) {
      case 'cedula':
        result = validateCedula(body.value)
        break

      case 'card':
        result = validateCardNumber(body.value)
        if (result.valid) {
          const cardType = identifyCardType(body.value)
          details = { cardType: cardType.type, brand: cardType.brand }
        }
        break

      case 'phone':
        result = validatePhoneNicaragua(body.value)
        break

      case 'bank':
        if (body.bank) {
          result = validateBankAccountByBank(body.value, body.bank)
          details = { bank: body.bank }
        } else {
          result = validateBankAccount(body.value)
        }
        break

      case 'email':
        result = validateEmail(body.value)
        break

      case 'billetera':
        result = validateBilleteraMovil(body.value)
        break

      case 'expiry':
        result = validateCardExpiry(body.value)
        break

      case 'cvv':
        result = validateCVV(body.value)
        break
    }

    return NextResponse.json({
      success: true,
      valid: result.valid,
      message: result.message,
      ...(details ? { details } : {}),
    })
  } catch (error) {
    console.error('[Validate API] Error:', error)
    return NextResponse.json(
      {
        success: false,
        valid: false,
        message: 'Error interno de validación',
      },
      { status: 500 }
    )
  }
}
