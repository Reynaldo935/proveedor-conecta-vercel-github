// ============================================================================
// ProveedorConecta Nicaragua — Database Client
// 🟢 Production: Turso Cloud (libSQL)
// 🟡 Development: Local SQLite
// ============================================================================

import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as { prisma?: PrismaClient }

function createPrismaClient(): PrismaClient {
  const isProduction = process.env.NODE_ENV === 'production'
  const isBuildPhase = !!(process.env.NEXT_PHASE?.includes('build'))
  const tursoUrl = process.env.TURSO_DATABASE_URL
  const tursoToken = process.env.TURSO_AUTH_TOKEN

  if (
    isProduction &&
    !isBuildPhase &&
    typeof tursoUrl === 'string' &&
    tursoUrl.startsWith('libsql://') &&
    typeof tursoToken === 'string' &&
    tursoToken.length > 0
  ) {
    try {
      const { PrismaLibSQL } = require('@prisma/adapter-libsql')
      // Clean URL: remove protocol, query params, and trailing slash
      let cleanUrl = tursoUrl
        .replace(/^libsql:\/\//, 'https://')
        .split('?')[0]
        .replace(/\/$/, '')
      const adapter = new PrismaLibSQL({ url: cleanUrl, authToken: tursoToken })
      console.log('[DB] ✅ Turso Cloud connected')
      return new PrismaClient({ adapter })
    } catch (err) {
      console.error('[DB] Turso failed, falling back:', (err as Error).message)
    }
  }

  return new PrismaClient({ datasourceUrl: process.env.DATABASE_URL ?? 'file:./db/custom.db' })
}

export const db: PrismaClient = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = db
}
