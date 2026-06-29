/**
 * POST /api/webhooks/clerk
 *
 * Clerk Webhook endpoint for server-side user events.
 * Receives user.created, user.updated, user.deleted events from Clerk.
 * Syncs users to our Prisma/Supabase database without client intervention.
 *
 * @see https://clerk.com/docs/webhooks/overview
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { Webhook } from 'svix'

// Types for Clerk webhook events
interface ClerkUserEvent {
  data: {
    id: string
    email_addresses: Array<{ email_address: string }>
    first_name: string | null
    last_name: string | null
    image_url: string
    created_at: number
    updated_at: number
  }
  type: 'user.created' | 'user.updated' | 'user.deleted'
}

export async function POST(request: NextRequest) {
  const payload = await request.text()
  const svixId = request.headers.get('svix-id')
  const svixTimestamp = request.headers.get('svix-timestamp')
  const svixSignature = request.headers.get('svix-signature')

  // If webhook secret is not configured, skip verification (development only)
  const webhookSecret = process.env.CLERK_WEBHOOK_SECRET

  if (webhookSecret && svixId && svixTimestamp && svixSignature) {
    try {
      const wh = new Webhook(webhookSecret)
      wh.verify(payload, {
        'svix-id': svixId,
        'svix-timestamp': svixTimestamp,
        'svix-signature': svixSignature,
      })
    } catch {
      return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 401 })
    }
  }

  const event = JSON.parse(payload) as ClerkUserEvent
  const { id: clerkId, email_addresses, first_name, last_name, image_url } = event.data
  const primaryEmail = email_addresses[0]?.email_address
  const name = [first_name, last_name].filter(Boolean).join(' ') || primaryEmail || 'Usuario'

  try {
    switch (event.type) {
      case 'user.created':
      case 'user.updated': {
        if (!primaryEmail) break

        const existing = await db.user.findFirst({
          where: { OR: [{ clerkId }, { email: primaryEmail }] },
        })

        if (existing) {
          await db.user.update({
            where: { id: existing.id },
            data: {
              clerkId,
              email: primaryEmail,
              name,
              avatar: image_url || existing.avatar,
              emailVerified: true,
            },
          })
        } else {
          await db.user.create({
            data: {
              clerkId,
              email: primaryEmail,
              name,
              avatar: image_url || '',
              role: 'BUYER',
              emailVerified: true,
            },
          })
        }
        console.log(`[Clerk Webhook] ${event.type}: ${clerkId} (${primaryEmail})`)
        break
      }

      case 'user.deleted': {
        const user = await db.user.findUnique({ where: { clerkId } })
        if (user) {
          await db.user.delete({ where: { id: user.id } })
          console.log(`[Clerk Webhook] user.deleted: ${clerkId}`)
        }
        break
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[Clerk Webhook] Error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
