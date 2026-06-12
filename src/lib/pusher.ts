/**
 * Pusher Server Client
 * ProveedorConecta Nicaragua
 *
 * Provides server-side Pusher functionality for real-time features
 * (notifications, chat, live updates).
 *
 * Falls back to null/logging when Pusher env vars are not configured.
 * Vercel serverless compatible — singleton pattern with lazy init.
 */

import Pusher from 'pusher'

let _pusherInstance: Pusher | null = null

/**
 * Initialize and return the Pusher server instance (singleton).
 * Returns null if Pusher env vars are not configured.
 */
export function getPusherServer(): Pusher | null {
  if (_pusherInstance) return _pusherInstance

  const appId = process.env.PUSHER_APP_ID
  const key = process.env.PUSHER_KEY
  const secret = process.env.PUSHER_SECRET
  const cluster = process.env.PUSHER_CLUSTER

  if (!appId || !key || !secret || !cluster) {
    console.log('[Pusher] Not configured (missing PUSHER_APP_ID, PUSHER_KEY, PUSHER_SECRET, or PUSHER_CLUSTER)')
    return null
  }

  _pusherInstance = new Pusher({
    appId,
    key,
    secret,
    cluster,
    useTLS: true,
  })

  return _pusherInstance
}

/**
 * Trigger an event on a channel.
 * Returns true if the event was triggered successfully, false otherwise.
 */
export async function pusherTrigger(
  channel: string,
  event: string,
  data: unknown
): Promise<boolean> {
  const pusher = getPusherServer()

  if (!pusher) {
    console.log(`[Pusher] Simulation: trigger("${channel}", "${event}")`, JSON.stringify(data).slice(0, 200))
    return true // Simulate success
  }

  try {
    await pusher.trigger(channel, event, data)
    return true
  } catch (error) {
    console.error('[Pusher] Trigger error:', error)
    return false
  }
}

/**
 * Authenticate a private channel.
 * Returns the auth signature object or null if Pusher is not configured.
 */
export function pusherAuthenticate(
  socketId: string,
  channel: string,
  userId: string
): { auth: string } | null {
  const pusher = getPusherServer()

  if (!pusher) {
    // Simulated auth for development
    console.log(`[Pusher] Simulation: authenticate(socketId="${socketId}", channel="${channel}", userId="${userId}")`)
    return {
      auth: `simulated_auth_${socketId}_${channel}_${userId}`,
    }
  }

  try {
    const auth = pusher.authorizeChannel(socketId, channel)
    return auth
  } catch (error) {
    console.error('[Pusher] Authenticate error:', error)
    return null
  }
}

/**
 * Generate presence channel data for a user.
 */
export function pusherPresenceData(
  userId: string,
  userName: string
): { user_id: string; user_info: { name: string } } {
  return {
    user_id: userId,
    user_info: {
      name: userName,
    },
  }
}
