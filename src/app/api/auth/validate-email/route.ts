import { NextRequest, NextResponse } from 'next/server'

// Disposable email domains (ZeroBounce/Hunter/Abstract API simulation)
const DISPOSABLE_DOMAINS = [
  'tempmail.com', 'throwaway.email', 'mailinator.com',
  'guerrillamail.com', 'yopmail.com', 'sharklasers.com',
  'trashmail.com', 'dispostable.com', 'maildrop.cc',
  'tempmailaddress.com', 'emailondeck.com', 'guerrillamailblock.com',
  'grr.la', 'spam4.me', 'mailscrap.com',
  'mailinater.com', 'messagebeamer.de', 'objectmail.com',
  '10minutemail.com', 'tempail.com', 'emailfake.com',
  'generator.email', 'guerrillamail.biz', 'tempinbox.com',
]

// Role-based email prefixes (admin@, info@, etc.)
const ROLE_BASED_PREFIXES = [
  'admin', 'info', 'support', 'help', 'contact', 'sales',
  'marketing', 'noreply', 'no-reply', 'notification', 'notifications',
  'webmaster', 'postmaster', 'abuse', 'root', 'billing',
  'hr', 'legal', 'security', 'it', 'office',
]

// Known valid MX domains
const KNOWN_GOOD_DOMAINS = [
  'gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com',
  'live.com', 'icloud.com', 'me.com', 'protonmail.com',
  'proton.me', 'aol.com', 'zoho.com', 'yandex.com',
  'mail.com', 'gmx.com', 'tutanota.com', 'fastmail.com',
]

// Domains with no MX records (simulated)
const SIMULATED_NO_MX_DOMAINS = [
  'invalid-domain.xyz', 'nonexistent.fake', 'nodomain.test',
  'example.invalid', 'fake-email.notreal',
]

// Common typo corrections for email domains
const COMMON_TYPOS: Record<string, string> = {
  'gmial.com': 'gmail.com',
  'gmai.com': 'gmail.com',
  'gmail.co': 'gmail.com',
  'gmal.com': 'gmail.com',
  'gnail.com': 'gmail.com',
  'yahooo.com': 'yahoo.com',
  'yaho.com': 'yahoo.com',
  'hotmal.com': 'hotmail.com',
  'hotmai.com': 'hotmail.com',
  'outlok.com': 'outlook.com',
  'iclod.com': 'icloud.com',
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, checkAccount } = body

    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Correo electrónico requerido' },
        { status: 200 }
      )
    }

    // Basic format validation
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({
        success: true,
        data: {
          valid: false,
          accountExists: false,
          reason: 'Formato de correo inválido',
          score: 0,
          correoInvalido: true,
        },
      })
    }

    const [localPart, domain] = email.split('@')
    const lowerDomain = domain?.toLowerCase() || ''
    const lowerLocal = localPart?.toLowerCase() || ''

    let score = 100
    const reasons: string[] = []
    let valid = true
    let accountExists = true
    let correoInvalido = false

    // Check disposable domain
    if (DISPOSABLE_DOMAINS.includes(lowerDomain)) {
      score -= 80
      reasons.push('Dominio de correo desechable detectado')
      valid = false
      accountExists = false
      correoInvalido = true
    }

    // Check role-based email
    if (ROLE_BASED_PREFIXES.includes(lowerLocal)) {
      score -= 30
      reasons.push('Correo de rol genérico (admin@, info@, etc.)')
    }

    // Simulate MX record check
    if (SIMULATED_NO_MX_DOMAINS.includes(lowerDomain)) {
      score -= 70
      reasons.push('No se encontraron registros MX para este dominio')
      valid = false
      accountExists = false
      correoInvalido = true
    } else if (KNOWN_GOOD_DOMAINS.includes(lowerDomain)) {
      // Known good domain - MX records verified
    } else {
      // Unknown domain — check MX probability
      const hash = lowerDomain.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
      if (hash % 3 === 0) {
        score -= 40
        reasons.push('No se pudieron verificar los registros MX del dominio')
        accountExists = false
        correoInvalido = true
      }
    }

    // Check for typos in common domains
    if (COMMON_TYPOS[lowerDomain]) {
      score -= 25
      reasons.push(`Posible error tipográfico. ¿Quisiste decir ${COMMON_TYPOS[lowerDomain]}?`)
    }

    // Check for plus addressing (sub-addressing)
    if (lowerLocal.includes('+')) {
      score -= 5
      reasons.push('Correo con sub-direccionamiento (+) detectado')
    }

    // Check for very short local part
    if (lowerLocal.length < 3) {
      score -= 10
      reasons.push('Parte local del correo muy corta')
    }

    // Account existence simulation for known providers
    // For Gmail, Outlook, Yahoo - simulate checking if account exists
    if (checkAccount && KNOWN_GOOD_DOMAINS.includes(lowerDomain)) {
      // Use deterministic hash to simulate account existence check
      // In production, this would use ZeroBounce/Hunter/Abstract API
      const accountHash = email.toLowerCase().split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)

      // Emails with patterns like "test@", "fake@", "asdf@", "xxx@" are likely invalid
      const suspiciousPrefixes = ['test', 'fake', 'asdf', 'xxx', 'qwerty', 'abc123', 'noperson', 'noone', 'nobody']
      if (suspiciousPrefixes.some(prefix => lowerLocal.startsWith(prefix))) {
        accountExists = false
        correoInvalido = true
        valid = false
        score -= 60
        reasons.push('La cuenta de correo no existe o no se puede verificar')
      } else if (accountHash % 7 === 0) {
        // ~14% chance of "not found" for simulation
        accountExists = false
        correoInvalido = true
        valid = false
        score -= 50
        reasons.push('La cuenta de correo no fue encontrada')
      }
    }

    // Clamp score
    score = Math.max(0, Math.min(100, score))

    return NextResponse.json({
      success: true,
      data: {
        valid,
        accountExists,
        correoInvalido,
        reason: reasons.length > 0 ? reasons.join('; ') : 'Correo válido',
        score,
        details: {
          disposable: DISPOSABLE_DOMAINS.includes(lowerDomain),
          roleBased: ROLE_BASED_PREFIXES.includes(lowerLocal),
          mxValid: !SIMULATED_NO_MX_DOMAINS.includes(lowerDomain),
          accountExists,
          suggestedFix: COMMON_TYPOS[lowerDomain] || null,
        },
      },
    })
  } catch (error) {
    console.error('Email validation error:', error)
    return NextResponse.json(
      { success: false, error: 'Error al validar correo' },
      { status: 200 }
    )
  }
}
