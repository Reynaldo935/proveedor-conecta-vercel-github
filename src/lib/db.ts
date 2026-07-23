// ============================================================================
// ProveedorConecta Nicaragua — Database Client
// 🟢 Production: Turso Cloud (libSQL)
// 🟡 Development: Local SQLite
// ============================================================================

import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as { prisma?: PrismaClient }

// Dynamically import adapter to avoid build-time require() errors
let PrismaLibSQL: any = null
async function getLibSQLAdapter() {
  if (PrismaLibSQL) return PrismaLibSQL
  try {
    const mod = await import('@prisma/adapter-libsql')
    PrismaLibSQL = mod.PrismaLibSQL
    return PrismaLibSQL
  } catch {
    return null
  }
}

function createPrismaClient(): PrismaClient {
  const tursoUrl = process.env.TURSO_DATABASE_URL
  const tursoToken = process.env.TURSO_AUTH_TOKEN

  // During build phase, skip Turso and use local SQLite
  if (process.env.NEXT_PHASE?.includes('build')) {
    return new PrismaClient({
      datasourceUrl: process.env.DATABASE_URL ?? 'file:./db/custom.db',
    })
  }

  // In production with valid Turso credentials, use sync require (runtime only)
  if (
    typeof tursoUrl === 'string' &&
    tursoUrl.startsWith('libsql://') &&
    typeof tursoToken === 'string' &&
    tursoToken.length > 0
  ) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { PrismaLibSQL: Adapter } = require('@prisma/adapter-libsql')
      const adapter = new Adapter({ url: tursoUrl, authToken: tursoToken })
      console.log('[DB] ✅ Turso Cloud connected')
      return new PrismaClient({ adapter })
    } catch (err) {
      console.error('[DB] Turso failed, falling back:', (err as Error).message)
    }
  }

  return new PrismaClient({
    datasourceUrl: process.env.DATABASE_URL ?? 'file:./db/custom.db',
  })
}

export const db: PrismaClient = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = db
}
