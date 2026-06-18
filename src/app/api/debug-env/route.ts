import { NextRequest, NextResponse } from 'next/server'

export async function GET(_request: NextRequest) {
  return NextResponse.json({
    TURSO_DATABASE_URL_EXISTS: typeof process.env.TURSO_DATABASE_URL === 'string',
    TURSO_DATABASE_URL_LENGTH: process.env.TURSO_DATABASE_URL?.length ?? 0,
    TURSO_DATABASE_URL_FIRST_15: process.env.TURSO_DATABASE_URL?.substring(0, 15) ?? 'undefined',
    TURSO_AUTH_TOKEN_EXISTS: typeof process.env.TURSO_AUTH_TOKEN === 'string',
    TURSO_AUTH_TOKEN_LENGTH: process.env.TURSO_AUTH_TOKEN?.length ?? 0,
    DATABASE_URL_EXISTS: typeof process.env.DATABASE_URL === 'string',
    NODE_ENV: process.env.NODE_ENV,
  })
}
