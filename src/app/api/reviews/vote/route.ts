import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthenticatedUserId, setAuthCookie } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const userId = await getAuthenticatedUserId(request)

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'No autenticado' },
        { status: 401 }
      )
    }

    await setAuthCookie(userId)

    const body = await request.json()
    const { reviewId, isHelpful } = body

    if (!reviewId || typeof isHelpful !== 'boolean') {
      return NextResponse.json(
        { success: false, error: 'reviewId e isHelpful son requeridos' },
        { status: 400 }
      )
    }

    // Verify review exists
    const review = await db.review.findUnique({
      where: { id: reviewId },
    })

    if (!review) {
      return NextResponse.json(
        { success: false, error: 'Reseña no encontrada' },
        { status: 404 }
      )
    }

    // Check if user already voted
    const existingVote = await db.reviewVote.findUnique({
      where: {
        userId_reviewId: { userId, reviewId },
      },
    })

    if (existingVote) {
      // If same vote, toggle off (remove the vote)
      if (existingVote.isHelpful === isHelpful) {
        await db.reviewVote.delete({
          where: { id: existingVote.id },
        })

        // Decrement the counter
        await db.review.update({
          where: { id: reviewId },
          data: {
            helpfulYes: isHelpful ? { decrement: 1 } : undefined,
            helpfulNo: !isHelpful ? { decrement: 1 } : undefined,
          },
        })

        const updatedReview = await db.review.findUnique({
          where: { id: reviewId },
        })

        return NextResponse.json({
          success: true,
          data: {
            voted: false,
            helpfulYes: updatedReview?.helpfulYes || 0,
            helpfulNo: updatedReview?.helpfulNo || 0,
          },
        })
      }

      // If different vote, update the vote
      await db.reviewVote.update({
        where: { id: existingVote.id },
        data: { isHelpful },
      })

      // Update counters: decrement old, increment new
      await db.review.update({
        where: { id: reviewId },
        data: {
          helpfulYes: isHelpful ? { increment: 1 } : { decrement: 1 },
          helpfulNo: !isHelpful ? { increment: 1 } : { decrement: 1 },
        },
      })

      const updatedReview = await db.review.findUnique({
        where: { id: reviewId },
      })

      return NextResponse.json({
        success: true,
        data: {
          voted: true,
          isHelpful,
          helpfulYes: updatedReview?.helpfulYes || 0,
          helpfulNo: updatedReview?.helpfulNo || 0,
        },
      })
    }

    // Create new vote
    await db.reviewVote.create({
      data: {
        userId,
        reviewId,
        isHelpful,
      },
    })

    // Increment the appropriate counter
    await db.review.update({
      where: { id: reviewId },
      data: {
        helpfulYes: isHelpful ? { increment: 1 } : undefined,
        helpfulNo: !isHelpful ? { increment: 1 } : undefined,
      },
    })

    const updatedReview = await db.review.findUnique({
      where: { id: reviewId },
    })

    return NextResponse.json({
      success: true,
      data: {
        voted: true,
        isHelpful,
        helpfulYes: updatedReview?.helpfulYes || 0,
        helpfulNo: updatedReview?.helpfulNo || 0,
      },
    })
  } catch (error) {
    console.error('Vote review error:', error)
    return NextResponse.json(
      { success: false, error: 'Error al votar reseña' },
      { status: 500 }
    )
  }
}
