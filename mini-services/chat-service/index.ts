import { createServer } from 'http'
import { Server } from 'socket.io'
import { PrismaClient } from '../../node_modules/.prisma/client'

// Set DATABASE_URL if not already set (for bun --hot compatibility)
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = 'file:/home/z/my-project/db/custom.db'
}

const PORT = 3003

// Initialize PrismaClient with the same database
const db = new PrismaClient()

const httpServer = createServer()
const io = new Server(httpServer, {
  // DO NOT change the path, it is used by Caddy to forward the request to the correct port
  path: '/',
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
  pingTimeout: 60000,
  pingInterval: 25000,
})

// Track connected users: socketId -> { userId, rooms }
const connectedUsers = new Map<string, { userId: string; rooms: Set<string> }>()

// Track which rooms have which users typing
const typingUsers = new Map<string, Set<string>>() // roomId -> Set<userId>

io.on('connection', (socket) => {
  console.log(`[ChatService] Client connected: ${socket.id}`)

  // --- Join Room ---
  socket.on('join-room', async (data: { roomId: string; userId: string }) => {
    const { roomId, userId } = data

    if (!roomId || !userId) {
      socket.emit('error', { message: 'roomId and userId are required' })
      return
    }

    // Verify user is part of this chat room
    try {
      const room = await db.chatRoom.findFirst({
        where: {
          id: roomId,
          OR: [{ buyerId: userId }, { sellerId: userId }],
        },
      })

      if (!room) {
        socket.emit('error', { message: 'No tienes acceso a este chat' })
        return
      }

      // Track user connection
      const existing = connectedUsers.get(socket.id)
      if (existing) {
        existing.rooms.add(roomId)
      } else {
        connectedUsers.set(socket.id, { userId, rooms: new Set([roomId]) })
      }

      // Join the Socket.IO room
      socket.join(roomId)

      // Mark messages as read
      await db.message.updateMany({
        where: {
          chatRoomId: roomId,
          isRead: false,
          senderId: { not: userId },
        },
        data: { isRead: true },
      })

      // Notify room that user is online
      socket.to(roomId).emit('user-online', { roomId, userId })

      // Send read receipt to other user
      socket.to(roomId).emit('messages-read', { roomId, userId })

      console.log(`[ChatService] User ${userId} joined room ${roomId}`)
    } catch (error) {
      console.error('[ChatService] Join room error:', error)
      socket.emit('error', { message: 'Error al unirse al chat' })
    }
  })

  // --- Leave Room ---
  socket.on('leave-room', (data: { roomId: string; userId: string }) => {
    const { roomId, userId } = data

    if (!roomId) return

    socket.leave(roomId)

    // Remove from tracking
    const existing = connectedUsers.get(socket.id)
    if (existing) {
      existing.rooms.delete(roomId)
      // Remove typing status
      const roomTyping = typingUsers.get(roomId)
      if (roomTyping) {
        roomTyping.delete(userId)
        if (roomTyping.size === 0) {
          typingUsers.delete(roomId)
        }
      }
    }

    // Notify room
    socket.to(roomId).emit('user-offline', { roomId, userId })

    console.log(`[ChatService] User ${userId} left room ${roomId}`)
  })

  // --- Send Message ---
  socket.on('send-message', async (data: { roomId: string; senderId: string; content?: string; imageUrl?: string; messageType?: string; mediaUrl?: string; locationLat?: number; locationLng?: number; locationName?: string }) => {
    const { roomId, senderId, content, imageUrl, messageType, mediaUrl, locationLat, locationLng, locationName } = data

    if (!roomId || !senderId) {
      socket.emit('error', { message: 'roomId and senderId are required' })
      return
    }

    if (!content && !imageUrl && !mediaUrl && !locationLat) {
      socket.emit('error', { message: 'Mensaje, imagen o ubicación requerido' })
      return
    }

    try {
      // Verify user is part of this chat room
      const room = await db.chatRoom.findFirst({
        where: {
          id: roomId,
          OR: [{ buyerId: senderId }, { sellerId: senderId }],
        },
      })

      if (!room) {
        socket.emit('error', { message: 'No tienes acceso a este chat' })
        return
      }

      const msgType = messageType || (imageUrl ? 'image' : 'text')

      // Save message to database
      const message = await db.message.create({
        data: {
          chatRoomId: roomId,
          senderId,
          content: content || '',
          imageUrl: imageUrl || mediaUrl || '',
          messageType: msgType,
          mediaUrl: mediaUrl || '',
          locationLat: locationLat || null,
          locationLng: locationLng || null,
          locationName: locationName || '',
        },
      })

      // Determine display text for last message
      let lastMsgDisplay = content || ''
      if (msgType === 'image' && !content) lastMsgDisplay = '📷 Imagen'
      else if (msgType === 'video') lastMsgDisplay = content || '🎥 Video'
      else if (msgType === 'audio') lastMsgDisplay = content || '🎵 Audio'
      else if (msgType === 'location') lastMsgDisplay = content || '📍 Ubicación'

      // Update chat room's last message
      await db.chatRoom.update({
        where: { id: roomId },
        data: {
          lastMessage: lastMsgDisplay,
          lastMessageAt: new Date(),
        },
      })

      // Fetch sender info for the broadcast
      const sender = await db.user.findUnique({
        where: { id: senderId },
        select: { id: true, name: true, avatar: true },
      })

      // Clear typing status for this user in this room
      const roomTyping = typingUsers.get(roomId)
      if (roomTyping) {
        roomTyping.delete(senderId)
        if (roomTyping.size === 0) {
          typingUsers.delete(roomId)
        }
        socket.to(roomId).emit('typing', { roomId, users: Array.from(roomTyping) })
      }

      // Broadcast message to everyone in the room (including sender for consistency)
      const messageData = {
        ...message,
        sender,
      }

      io.to(roomId).emit('new-message', messageData)

      // Also notify users not in the room via their other connections
      const otherUserId = room.buyerId === senderId ? room.sellerId : room.buyerId
      // Emit a room-updated event for chat list updates
      io.emit('room-updated', {
        roomId,
        lastMessage: lastMsgDisplay,
        lastMessageAt: new Date().toISOString(),
        senderId,
        otherUserId,
      })

      console.log(`[ChatService] ${msgType} message in room ${roomId} from user ${senderId}`)
    } catch (error) {
      console.error('[ChatService] Send message error:', error)
      socket.emit('error', { message: 'Error al enviar mensaje' })
    }
  })

  // --- Typing Indicator ---
  socket.on('typing', (data: { roomId: string; userId: string; isTyping: boolean }) => {
    const { roomId, userId, isTyping } = data

    if (!roomId || !userId) return

    let roomTyping = typingUsers.get(roomId)
    if (!roomTyping) {
      roomTyping = new Set()
      typingUsers.set(roomId, roomTyping)
    }

    if (isTyping) {
      roomTyping.add(userId)
    } else {
      roomTyping.delete(userId)
    }

    // Broadcast typing status to others in the room
    socket.to(roomId).emit('typing', { roomId, users: Array.from(roomTyping) })
  })

  // --- Mark Read ---
  socket.on('mark-read', async (data: { roomId: string; userId: string }) => {
    const { roomId, userId } = data

    if (!roomId || !userId) return

    try {
      await db.message.updateMany({
        where: {
          chatRoomId: roomId,
          isRead: false,
          senderId: { not: userId },
        },
        data: { isRead: true },
      })

      // Notify the other user that messages have been read
      socket.to(roomId).emit('messages-read', { roomId, userId })

      console.log(`[ChatService] User ${userId} marked messages as read in room ${roomId}`)
    } catch (error) {
      console.error('[ChatService] Mark read error:', error)
    }
  })

  // --- Disconnect ---
  socket.on('disconnect', () => {
    const userInfo = connectedUsers.get(socket.id)

    if (userInfo) {
      const { userId, rooms } = userInfo

      // Notify all rooms that user is offline
      rooms.forEach((roomId) => {
        socket.to(roomId).emit('user-offline', { roomId, userId })

        // Clear typing status
        const roomTyping = typingUsers.get(roomId)
        if (roomTyping) {
          roomTyping.delete(userId)
          if (roomTyping.size === 0) {
            typingUsers.delete(roomId)
          } else {
            socket.to(roomId).emit('typing', { roomId, users: Array.from(roomTyping) })
          }
        }
      })

      connectedUsers.delete(socket.id)
      console.log(`[ChatService] User ${userId} disconnected from ${rooms.size} room(s)`)
    } else {
      console.log(`[ChatService] Client disconnected: ${socket.id}`)
    }
  })

  // --- Error ---
  socket.on('error', (error) => {
    console.error(`[ChatService] Socket error (${socket.id}):`, error)
  })
})

httpServer.listen(PORT, () => {
  console.log(`[ChatService] WebSocket chat service running on port ${PORT}`)
})

// Graceful shutdown
const shutdown = () => {
  console.log('[ChatService] Shutting down...')
  io.disconnectSockets()
  httpServer.close(() => {
    db.$disconnect()
    console.log('[ChatService] Server closed')
    process.exit(0)
  })
}

process.on('SIGTERM', shutdown)
process.on('SIGINT', shutdown)
