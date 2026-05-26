import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthenticatedUserId, setAuthCookie } from '@/lib/auth'

function getTrustBadge(totalReviews: number, avgRating: number): string | null {
  if (totalReviews >= 100 && avgRating >= 4.5) return 'GOLD'
  if (totalReviews >= 50 && avgRating >= 4.0) return 'SILVER'
  if (totalReviews >= 10 && avgRating >= 3.5) return 'BRONZE'
  return null
}

export async function GET(request: NextRequest) {
  try {
    const userId = await getAuthenticatedUserId(request)

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'No autenticado' },
        { status: 401 }
      )
    }

    await setAuthCookie(userId)

    const { searchParams } = new URL(request.url)
    const targetId = searchParams.get('targetId')
    const sort = searchParams.get('sort') || 'recent'

    if (!targetId) {
      return NextResponse.json(
        { success: false, error: 'targetId es requerido' },
        { status: 400 }
      )
    }

    // Build sort order
    let orderBy: Record<string, string>
    switch (sort) {
      case 'highest':
        orderBy = { rating: 'desc' }
        break
      case 'lowest':
        orderBy = { rating: 'asc' }
        break
      case 'helpful':
        orderBy = { helpfulYes: 'desc' }
        break
      default:
        orderBy = { createdAt: 'desc' }
    }

    const reviews = await db.review.findMany({
      where: { targetId },
      include: {
        reviewer: {
          select: { id: true, name: true, avatar: true },
        },
        votes: true,
      },
      orderBy,
    })

    // Calculate average rating
    const totalReviews = reviews.length
    const averageRating = totalReviews > 0
      ? Math.round((reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews) * 10) / 10
      : 0

    // Determine trust badge
    const trustBadge = getTrustBadge(totalReviews, averageRating)

    // Format reviews for response
    const formattedReviews = reviews.map((r) => {
      const userVote = r.votes.find((v) => v.userId === userId)
      return {
        id: r.id,
        reviewerId: r.reviewerId,
        reviewerName: r.reviewer.name,
        reviewerAvatar: r.reviewer.avatar,
        transactionId: r.transactionId,
        rating: r.rating,
        comment: r.comment,
        reviewType: r.reviewType,
        response: r.response,
        helpfulYes: r.helpfulYes,
        helpfulNo: r.helpfulNo,
        userVote: userVote ? userVote.isHelpful : null,
        createdAt: r.createdAt,
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        reviews: formattedReviews,
        averageRating,
        totalReviews,
        trustBadge,
      },
    })
  } catch (error) {
    console.error('Get reviews error:', error)
    return NextResponse.json(
      { success: false, error: 'Error al obtener reseñas' },
      { status: 400 }
    )
  }
}

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
    const { targetId, transactionId, rating, comment, reviewType } = body

    // Validate required fields
    if (!targetId || !transactionId || !rating || !reviewType) {
      return NextResponse.json(
        { success: false, error: 'Todos los campos son requeridos' },
        { status: 400 }
      )
    }

    // Validate rating
    if (typeof rating !== 'number' || rating < 1 || rating > 5) {
      return NextResponse.json(
        { success: false, error: 'La calificación debe ser entre 1 y 5' },
        { status: 400 }
      )
    }

    // Validate reviewType
    if (!['SELLER_REVIEW', 'BUYER_REVIEW'].includes(reviewType)) {
      return NextResponse.json(
        { success: false, error: 'Tipo de reseña inválido' },
        { status: 400 }
      )
    }

    // Verify transaction exists and is COMPLETED
    const transaction = await db.transaction.findUnique({
      where: { id: transactionId },
    })

    if (!transaction) {
      return NextResponse.json(
        { success: false, error: 'Transacción no encontrada' },
        { status: 404 }
      )
    }

    if (transaction.status !== 'COMPLETED') {
      return NextResponse.json(
        { success: false, error: 'Solo se pueden reseñar transacciones completadas' },
        { status: 400 }
      )
    }

    // Verify the reviewer is the correct party
    if (reviewType === 'SELLER_REVIEW') {
      // Buyer reviews the seller
      if (transaction.buyerId !== userId) {
        return NextResponse.json(
          { success: false, error: 'Solo el comprador puede reseñar al vendedor' },
          { status: 400 }
        )
      }
      if (transaction.sellerId !== targetId) {
        return NextResponse.json(
          { success: false, error: 'El objetivo no es el vendedor de esta transacción' },
          { status: 400 }
        )
      }
    } else {
      // Seller reviews the buyer
      if (transaction.sellerId !== userId) {
        return NextResponse.json(
          { success: false, error: 'Solo el vendedor puede reseñar al comprador' },
          { status: 400 }
        )
      }
      if (transaction.buyerId !== targetId) {
        return NextResponse.json(
          { success: false, error: 'El objetivo no es el comprador de esta transacción' },
          { status: 400 }
        )
      }
    }

    // Verify no existing review for same transaction+type
    const existingReview = await db.review.findUnique({
      where: {
        reviewerId_transactionId_reviewType: {
          reviewerId: userId,
          transactionId,
          reviewType,
        },
      },
    })

    if (existingReview) {
      return NextResponse.json(
        { success: false, error: 'Ya has reseñado esta transacción' },
        { status: 400 }
      )
    }

    // Create the review
    const review = await db.review.create({
      data: {
        reviewerId: userId,
        targetId,
        transactionId,
        rating,
        comment: comment || '',
        reviewType,
      },
      include: {
        reviewer: {
          select: { id: true, name: true, avatar: true },
        },
      },
    })

    // Award loyalty points to the reviewer (5 points per review)
    try {
      const reviewBonus = 5
      const existingPoints = await db.loyaltyPoint.findUnique({
        where: { userId },
      })

      if (existingPoints) {
        await db.loyaltyPoint.update({
          where: { userId },
          data: {
            balance: { increment: reviewBonus },
            totalEarned: { increment: reviewBonus },
            expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
          },
        })
      } else {
        await db.loyaltyPoint.create({
          data: {
            userId,
            balance: reviewBonus,
            totalEarned: reviewBonus,
            expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
          },
        })
      }

      await db.pointHistory.create({
        data: {
          userId,
          type: 'BONUS',
          amount: reviewBonus,
          reason: 'Bono por escribir reseña',
        },
      })
    } catch (loyaltyError) {
      console.error('Loyalty points for review error (non-blocking):', loyaltyError)
    }

    return NextResponse.json({
      success: true,
      data: {
        id: review.id,
        rating: review.rating,
        comment: review.comment,
        reviewType: review.reviewType,
        reviewerName: review.reviewer.name,
        createdAt: review.createdAt,
        loyaltyAwarded: 5,
      },
    }, { status: 201 })
  } catch (error) {
    console.error('Create review error:', error)
    return NextResponse.json(
      { success: false, error: 'Error al crear reseña' },
      { status: 400 }
    )
  }
}
