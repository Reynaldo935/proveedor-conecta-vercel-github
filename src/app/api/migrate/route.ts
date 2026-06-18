import { NextResponse } from 'next/server'
import { execSync } from 'child_process'

export async function POST() {
  try {
    const tursoUrl = process.env.TURSO_DATABASE_URL
    const tursoToken = process.env.TURSO_AUTH_TOKEN

    if (!tursoUrl || !tursoToken) {
      return NextResponse.json({
        success: false,
        error: 'TURSO_DATABASE_URL and TURSO_AUTH_TOKEN must be set',
      }, { status: 200 })
    }

    // Use prisma db push with Turso URL set as DATABASE_URL
    // Prisma adapter handles the libsql:// → https:// conversion internally
    const output = execSync('npx prisma db push --skip-generate --accept-data-loss', {
      encoding: 'utf-8',
      timeout: 60000,
      env: {
        ...process.env,
        DATABASE_URL: tursoUrl,
      },
      stdio: ['pipe', 'pipe', 'pipe'],
    })

    return NextResponse.json({
      success: true,
      message: 'Schema pushed successfully.',
      output: output.substring(0, 500),
    })
  } catch (err) {
    const message = (err as Error).message
    return NextResponse.json({
      success: false,
      error: message.substring(0, 500),
    }, { status: 200 })
  }
}

export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'POST to /api/migrate to run prisma db push',
  })
}
