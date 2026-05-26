import { NextRequest, NextResponse } from 'next/server'

/**
 * Wrap API handlers to catch all errors and prevent server crashes.
 * Adds a 15-second timeout to prevent hung outbound requests or
 * heavy operations from killing the server process.
 *
 * Usage:
 *   export const GET = safeApiHandler(async (request) => { ... })
 *   export const POST = safeApiHandler(async (request) => { ... })
 */
export function safeApiHandler(
  handler: (request: NextRequest, context?: any) => Promise<NextResponse>
) {
  return async (request: NextRequest, context?: any) => {
    try {
      // Race the handler against a 15-second timeout
      const result = await Promise.race([
        handler(request, context),
        new Promise<NextResponse>((_, reject) =>
          setTimeout(() => reject(new Error('API timeout – la operación tardó demasiado')), 15000)
        ),
      ])
      return result
    } catch (error) {
      // Log the error but never crash the server
      const message = error instanceof Error ? error.message : 'Error interno del servidor'
      console.error('[safeApiHandler]', message)
      return NextResponse.json(
        { success: false, error: message },
        { status: 500 }
      )
    }
  }
}
