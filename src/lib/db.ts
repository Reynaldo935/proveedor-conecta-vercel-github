// ============================================================================
// ProveedorConecta Nicaragua — Database Client
// ============================================================================
// 🟢 Production (Vercel):  Turso Cloud (libSQL) via @prisma/adapter-libsql
// 🟡 Development:          Local SQLite file
// ⚪ Build phase:           Skips DB connection (static generation safe)
// ============================================================================
// All DB credentials come from environment variables — zero hardcoded config.
// Set TURSO_DATABASE_URL + TURSO_AUTH_TOKEN in Vercel dashboard.
// ============================================================================

import { PrismaClient } from '@prisma/client'

// Singleton reference for development hot-reload safety
const globalForPrisma = globalThis as { prisma?: PrismaClient }

function createPrismaClient(): PrismaClient {
  const isProduction = process.env.NODE_ENV === 'production'
  const isBuildPhase = !!(process.env.NEXT_PHASE?.includes('build'))
  const tursoUrl = process.env.TURSO_DATABASE_URL
  const tursoToken = process.env.TURSO_AUTH_TOKEN

  // ── Turso Cloud (production runtime only) ────────────────────────────
  if (
    isProduction &&
    !isBuildPhase &&
    typeof tursoUrl === 'string' &&
    tursoUrl.startsWith('libsql://') &&
    typeof tursoToken === 'string' &&
    tursoToken.length > 0
  ) {
    try {
      // Dynamic require: @prisma/adapter-libsql is ESM, works in Vercel Node runtime
      const { PrismaLibSql } = require('@prisma/adapter-libsql')
      const { createClient } = require('@libsql/client')

      const libsql = createClient({ url: tursoUrl, authToken: tursoToken })
      const adapter = new PrismaLibSql(libsql)
      console.log('[DB] ✅ Turso Cloud connected')
      return new PrismaClient({ adapter })
    } catch (err) {
      console.error('[DB] Turso adapter failed, using SQLite fallback:', err)
    }
  }

  // ── Local SQLite (development / build / fallback) ────────────────────
  const databaseUrl = process.env.DATABASE_URL ?? 'file:./db/custom.db'
  return new PrismaClient({ datasourceUrl: databaseUrl })
}

// Export singleton — dev reuses across hot reloads, prod creates fresh
export const db: PrismaClient = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = db
}
