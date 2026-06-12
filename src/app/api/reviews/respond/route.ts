import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthenticatedUserId, setAuthCookie } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const userId = await getAuthenticatedUserId(request)

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'No autenticado' },
        { status: 200 }
      )
    }

    await setAuthCookie(userId)

    const body = await request.json()
    const { reviewId, response } = body

    if (!reviewId || !response || typeof response !== 'string' || response.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'reviewId y response son requeridos' },
        { status: 200 }
      )
    }

    // Verify review exists
    const review = await db.review.findUnique({
      where: { id: reviewId },
    })

    if (!review) {
      return NextResponse.json(
        { success: false, error: 'Reseña no encontrada' },
        { status: 200 }
      )
    }

    // Only the target of the review can respond
    if (review.targetId !== userId) {
      return NextResponse.json(
        { success: false, error: 'Solo el destinatario de la reseña puede responder' },
        { status: 200 }
      )
    }

    // Can only respond once
    if (review.response && review.response.trim().length > 0) {
      return NextResponse.json(
        { success: false, error: 'Ya has respondido a esta reseña' },
        { status: 200 }
      )
    }

    // Update review with response
    const updatedReview = await db.review.update({
      where: { id: reviewId },
      data: { response: response.trim() },
    })

    return NextResponse.json({
      success: true,
      data: {
        id: updatedReview.id,
        response: updatedReview.response,
        updatedAt: updatedReview.updatedAt,
      },
    })
  } catch (error) {
    console.error('Respond to review error:', error)
    return NextResponse.json(
      { success: false, error: 'Error al responder reseña' },
      { status: 200 }
    )
  }
}
