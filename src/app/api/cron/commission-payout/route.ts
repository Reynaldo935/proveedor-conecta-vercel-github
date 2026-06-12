import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

/**
 * Cron Job: Commission Payout Processor
 *
 * Runs daily to process pending commission payouts.
 * Protected with CRON_SECRET env var check.
 *
 * GET /api/cron/commission-payout
 * 1. Find all PENDING commission logs older than 24 hours
 * 2. Mark them as PAID (in production, this would trigger bank transfers)
 * 3. Create audit log entries
 * 4. Return summary
 */
export async function GET(request: NextRequest) {
  try {
    // Verify cron secret to prevent unauthorized access
    const cronSecret = process.env.CRON_SECRET
    const authHeader = request.headers.get('authorization')
    const urlSecret = new URL(request.url).searchParams.get('secret')

    if (cronSecret) {
      const providedSecret = authHeader?.replace('Bearer ', '') || urlSecret
      if (providedSecret !== cronSecret) {
        return NextResponse.json(
          { success: false, error: 'Unauthorized: invalid cron secret' },
          { status: 401 }
        )
      }
    } else {
      // In development (no CRON_SECRET set), allow access but log warning
      console.warn('[Cron] CRON_SECRET not set — allowing unauthenticated cron access (development only)')
    }

    // Calculate the cutoff: 24 hours ago
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)

    // Find all PENDING commission logs older than 24 hours
    const pendingCommissions = await db.commissionLog.findMany({
      where: {
        status: 'PENDING',
        createdAt: {
          lt: twentyFourHoursAgo,
        },
      },
    })

    if (pendingCommissions.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          message: 'No pending commissions to process',
          processed: 0,
          totalAmount: 0,
        },
      })
    }

    // Process each commission: mark as PAID
    let totalAmount = 0
    const processedIds: string[] = []
    const errors: string[] = []

    for (const commission of pendingCommissions) {
      try {
        await db.commissionLog.update({
          where: { id: commission.id },
          data: {
            status: 'PAID',
            updatedAt: new Date(),
          },
        })

        totalAmount += commission.amount
        processedIds.push(commission.id)
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        errors.push(`Commission ${commission.id}: ${msg}`)
        console.error(`[Cron] Failed to process commission ${commission.id}:`, msg)
      }
    }

    // Create audit log entry for the batch payout
    try {
      await db.auditLog.create({
        data: {
          action: 'CRON_COMMISSION_PAYOUT',
          entity: 'CommissionLog',
          entityId: 'batch',
          details: JSON.stringify({
            processedCount: processedIds.length,
            totalAmount,
            failedCount: errors.length,
            errors: errors.length > 0 ? errors.slice(0, 10) : undefined,
            processedAt: new Date().toISOString(),
          }),
        },
      })
    } catch {
      // Audit log failure shouldn't fail the cron job
      console.error('[Cron] Failed to create audit log for commission payout')
    }

    return NextResponse.json({
      success: true,
      data: {
        message: `Processed ${processedIds.length} commission payouts`,
        processed: processedIds.length,
        totalAmount,
        failedCount: errors.length,
        errors: errors.length > 0 ? errors.slice(0, 10) : undefined,
      },
    })
  } catch (error) {
    console.error('[Cron] Commission payout error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to process commission payouts',
      },
      { status: 500 }
    )
  }
}
