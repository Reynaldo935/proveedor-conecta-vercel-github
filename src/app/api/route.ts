import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({ success: true, data: { message: 'ProveedorConecta Nicaragua API v1' } })
}
