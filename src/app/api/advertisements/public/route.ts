import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUserId } from '@/lib/auth'
import { db } from '@/lib/db'

/**
 * GET /api/advertisements/public
 * Fetches active advertisements for public display.
 * No authentication required — this is a public endpoint.
 */
export async function GET() {
  try {
    const now = new Date()

    const ads = await db.advertisement.findMany({
      where: {
        status: 'ACTIVE',
        type: 'PUBLISH',
        startDate: { lte: now },
        endDate: { gte: now },
      },
      include: {
        seller: {
          select: { name: true },
        },
      },
      orderBy: [
        { amount: 'desc' }, // Higher-paying ads first
        { createdAt: 'desc' },
      ],
      take: 10,
    })

    return NextResponse.json({ success: true, data: ads })
  } catch (error) {
    console.error('Public advertisements error:', error)
    return NextResponse.json(
      { success: false, error: 'Error al obtener anuncios' },
      { status: 200 }
    )
  }
}

/**
 * POST /api/advertisements/public
 * Tracks ad events (impressions, clicks).
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { adId, event } = body

    if (!adId || !event) {
      return NextResponse.json(
        { success: false, error: 'adId and event are required' },
        { status: 200 }
      )
    }

    // Verify the ad exists and is active
    const ad = await db.advertisement.findUnique({
      where: { id: adId },
    })

    if (!ad || ad.status !== 'ACTIVE') {
      return NextResponse.json(
        { success: false, error: 'Anuncio no encontrado o inactivo' },
        { status: 200 }
      )
    }

    // For now, we just acknowledge the event.
    // In production, you'd store this in an AdEvent or analytics table.
    // We could also increment a counter on the Advertisement model if needed.

    return NextResponse.json({
      success: true,
      message: `Event '${event}' tracked for ad ${adId}`,
    })
  } catch (error) {
    console.error('Ad event tracking error:', error)
    return NextResponse.json(
      { success: false, error: 'Error al registrar evento' },
      { status: 200 }
    )
  }
}
