import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createPrismaClient(): PrismaClient {
  // In production (Vercel): use Turso Cloud adapter if env vars are set
  // In development: use local SQLite (no Turso needed)
  const isProduction = process.env.NODE_ENV === 'production'
  const tursoUrl = process.env.TURSO_DATABASE_URL
  const tursoToken = process.env.TURSO_AUTH_TOKEN

  if (isProduction && tursoUrl && tursoToken && tursoUrl.startsWith('libsql://')) {
    try {
      // Dynamic imports for Turso adapter - only in production
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { PrismaLibSql } = require('@prisma/adapter-libsql')
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { createClient } = require('@libsql/client')

      const libsql = createClient({
        url: tursoUrl,
        authToken: tursoToken,
      })
      const adapter = new PrismaLibSql(libsql)
      console.log('☁️ Using Turso Cloud database')
      return new PrismaClient({ adapter })
    } catch (err) {
      console.error('⚠️ Turso adapter failed, falling back to local SQLite:', err)
    }
  }

  // Development / fallback: local SQLite
  return new PrismaClient()
}

// Use global singleton in development to avoid hot-reload issues
export const db = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = db
}
