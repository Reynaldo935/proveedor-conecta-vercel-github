/**
 * GET /api/turso-test
 * 
 * Diagnóstico de conexión Turso — muestra exactamente qué está fallando.
 * Solo accesible en producción. No expone tokens completos.
 */

import { NextRequest, NextResponse } from 'next/server'

export async function GET(_request: NextRequest) {
  try {
    // Solo permitir en producción
    if (process.env.NODE_ENV !== 'production') {
      return NextResponse.json({
        success: true,
        message: 'Modo desarrollo — la conexión a Turso no se prueba en local.',
        hint: 'En local se usa SQLite. Sube a Vercel para probar Turso.',
      }, { status: 200 })
    }

    const tursoUrl = process.env.TURSO_DATABASE_URL
    const tursoToken = process.env.TURSO_AUTH_TOKEN

    const diagnostics: Record<string, unknown> = {
      nodeEnv: process.env.NODE_ENV,
      isBuildPhase: !!(process.env.NEXT_PHASE?.includes('build')),
    }

    // ── Check 1: ¿Existen las variables? ──────────────────────────────
    diagnostics.var_TURSO_DATABASE_URL_EXISTS = typeof tursoUrl === 'string'
    diagnostics.var_TURSO_AUTH_TOKEN_EXISTS = typeof tursoToken === 'string'

    if (typeof tursoUrl === 'string') {
      diagnostics.var_TURSO_DATABASE_URL_LENGTH = tursoUrl.length
      diagnostics.var_TURSO_DATABASE_URL_PREFIX = tursoUrl.substring(0, 15) + '...'
      diagnostics.var_TURSO_DATABASE_URL_STARTS_LIBSQL = tursoUrl.startsWith('libsql://')
      diagnostics.var_TURSO_DATABASE_URL_HAS_WHITESPACE = tursoUrl !== tursoUrl.trim()
    }

    if (typeof tursoToken === 'string') {
      diagnostics.var_TURSO_AUTH_TOKEN_LENGTH = tursoToken.length
      diagnostics.var_TURSO_AUTH_TOKEN_PREFIX = tursoToken.substring(0, 10) + '...'
      diagnostics.var_TURSO_AUTH_TOKEN_HAS_WHITESPACE = tursoToken !== tursoToken.trim()
      diagnostics.var_TURSO_AUTH_TOKEN_IS_EMPTY = tursoToken.length === 0
    }

    // ── Check 2: ¿Pasan las condiciones del código? ──────────────────
    const isProduction = process.env.NODE_ENV === 'production'
    const isBuildPhase = !!(process.env.NEXT_PHASE?.includes('build'))
    const urlValid = typeof tursoUrl === 'string' && tursoUrl.startsWith('libsql://')
    const tokenValid = typeof tursoToken === 'string' && tursoToken.length > 0

    diagnostics.condition_isProduction = isProduction
    diagnostics.condition_isBuildPhase = isBuildPhase
    diagnostics.condition_urlIsLibsql = urlValid
    diagnostics.condition_tokenNotEmpty = tokenValid
    diagnostics.condition_WILL_USE_TURSO = isProduction && !isBuildPhase && urlValid && tokenValid
    diagnostics.condition_WILL_FALLBACK_SQLITE = !diagnostics.condition_WILL_USE_TURSO

    // ── Check 3: Intentar conexión real ──────────────────────────────
    if (diagnostics.condition_WILL_USE_TURSO) {
      try {
        const { PrismaLibSql } = require('@prisma/adapter-libsql')
        const { createClient } = require('@libsql/client')

        const libsql = createClient({ 
          url: tursoUrl!.trim(), 
          authToken: tursoToken!.trim() 
        })
        const adapter = new PrismaLibSql(libsql)
        
        // Probar una consulta simple
        const result = await libsql.execute('SELECT 1 as test')
        diagnostics.connectionTest = 'OK'
        diagnostics.connectionResult = result.rows.length > 0 ? 'Query exitosa' : 'Query sin resultados'
        diagnostics.connectionRowsCount = result.rows.length
      } catch (connErr: unknown) {
        const err = connErr as Error & { code?: string; message?: string }
        diagnostics.connectionTest = 'FAILED'
        diagnostics.connectionError = err.message || String(connErr)
        diagnostics.connectionErrorCode = err.code || 'unknown'
        diagnostics.connectionErrorName = err.name || 'unknown'

        // Errores comunes de Turso y sus causas
        if (err.message?.includes('Unauthorized') || err.message?.includes('401') || err.message?.includes('unauthorized')) {
          diagnostics.rootCause = 'TOKEN_INVALIDO — El TURSO_AUTH_TOKEN no es válido o no corresponde a esta base de datos.'
          diagnostics.fix = '1. Ve a turso.tech/app → tu base de datos → "Show Credentials"\n2. Copia el token COMPLETO (sin espacios al inicio ni al final)\n3. Pégalo en Vercel → Settings → Environment Variables → TURSO_AUTH_TOKEN\n4. Haz Redeploy'
        } else if (err.message?.includes('not found') || err.message?.includes('404') || err.message?.includes('ENOTFOUND')) {
          diagnostics.rootCause = 'URL_INVALIDA — El TURSO_DATABASE_URL no apunta a una base de datos existente.'
          diagnostics.fix = 'Verifica que la URL en TURSO_DATABASE_URL coincida exactamente con la de turso.tech/app'
        } else if (err.message?.includes('timeout') || err.message?.includes('ETIMEDOUT')) {
          diagnostics.rootCause = 'TIMEOUT — No se pudo conectar a Turso. Puede ser un problema de red o la región de la BD.'
          diagnostics.fix = 'Verifica que la base de datos esté en una región cercana y que no esté pausada.'
        }
      }
    } else {
      diagnostics.connectionTest = 'SKIPPED'
      diagnostics.skipReason = !isProduction ? 'No estamos en producción' 
        : isBuildPhase ? 'Estamos en fase de build' 
        : !urlValid ? 'TURSO_DATABASE_URL no empieza con libsql://' 
        : !tokenValid ? 'TURSO_AUTH_TOKEN está vacío' 
        : 'Condición no cumplida'
    }

    return NextResponse.json({
      success: true,
      diagnostics,
    }, { status: 200 })

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Error en diagnóstico',
      hint: 'Revisa que TURSO_DATABASE_URL y TURSO_AUTH_TOKEN estén configurados en Vercel',
    }, { status: 200 })
  }
}
