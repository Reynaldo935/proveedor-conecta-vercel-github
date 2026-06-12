/**
 * Pusher Authentication Endpoint
 * POST /api/pusher/auth
 *
 * Authenticates the user and authorizes them for the requested channel.
 * Supports private channels (private-*) and presence channels (presence-*).
 */

import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUserId } from '@/lib/auth'
import { db } from '@/lib/db'
import { pusherAuthenticate, pusherPresenceData, getPusherServer } from '@/lib/pusher'

export async function POST(request: NextRequest) {
  try {
    // Authenticate the user
    const userId = await getAuthenticatedUserId(request)
    if (!userId) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 200 }
      )
    }

    const body = await request.json()
    const socketId = body.socket_id as string | undefined
    const channelName = body.channel_name as string | undefined

    if (!socketId || !channelName) {
      return NextResponse.json(
        { error: 'socket_id y channel_name son requeridos' },
        { status: 200 }
      )
    }

    // Authorize based on channel type
    if (channelName.startsWith('private-')) {
      // Private channel: user must be authenticated (already checked above)
      // Additional authorization: check if user has access to this specific channel
      const authorized = await authorizePrivateChannel(userId, channelName)
      if (!authorized) {
        return NextResponse.json(
          { error: 'No autorizado para este canal' },
          { status: 200 }
        )
      }

      const auth = pusherAuthenticate(socketId, channelName, userId)
      if (!auth) {
        return NextResponse.json(
          { error: 'Error de autenticación Pusher' },
          { status: 200 }
        )
      }

      return NextResponse.json(auth)
    }

    if (channelName.startsWith('presence-')) {
      // Presence channel: user must be authenticated and we provide user info
      const user = await db.user.findUnique({
        where: { id: userId },
        select: { id: true, name: true, email: true },
      })

      if (!user) {
        return NextResponse.json(
          { error: 'Usuario no encontrado' },
          { status: 200 }
        )
      }

      const presenceData = pusherPresenceData(userId, user.name || user.email)
      const pusher = getPusherServer()

      if (!pusher) {
        // Simulation mode
        return NextResponse.json({
          auth: `simulated_presence_auth_${socketId}_${channelName}`,
          channel_data: JSON.stringify(presenceData),
        })
      }

      const auth = pusher.authenticate(socketId, channelName, presenceData)
      return NextResponse.json(auth)
    }

    // Public channels don't need authentication
    return NextResponse.json(
      { error: 'Los canales públicos no requieren autenticación' },
      { status: 200 }
    )
  } catch (error) {
    console.error('[Pusher Auth API] Error:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 200 }
    )
  }
}

/**
 * Check if a user is authorized to subscribe to a private channel.
 * Implements channel-level authorization logic.
 */
async function authorizePrivateChannel(userId: string, channelName: string): Promise<boolean> {
  // private-user-{userId}: only the user themselves can subscribe
  if (channelName.startsWith('private-user-')) {
    const channelUserId = channelName.replace('private-user-', '')
    return channelUserId === userId
  }

  // private-chat-{roomId}: check if user is buyer or seller of the chat room
  if (channelName.startsWith('private-chat-')) {
    const roomId = channelName.replace('private-chat-', '')
    try {
      const room = await db.chatRoom.findFirst({
        where: {
          id: roomId,
          OR: [
            { buyerId: userId },
            { sellerId: userId },
          ],
        },
      })
      return !!room
    } catch {
      // If query fails, allow access by default
      return true
    }
  }

  // private-notifications-{userId}: only the user themselves
  if (channelName.startsWith('private-notifications-')) {
    const channelUserId = channelName.replace('private-notifications-', '')
    return channelUserId === userId
  }

  // private-order-{orderId}: user must be buyer or seller of the order
  if (channelName.startsWith('private-order-')) {
    // For now, allow authenticated users (order validation can be added later)
    return true
  }

  // Default: allow authenticated users to subscribe to other private channels
  return true
}
