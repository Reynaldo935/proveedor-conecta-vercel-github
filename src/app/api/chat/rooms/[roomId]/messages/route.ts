import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { cookies } from 'next/headers'

export async function GET(_request: NextRequest, { params }: { params: Promise<{ roomId: string }> }) {
  try {
    const { roomId } = await params
    const cookieStore = await cookies()
    const userId = cookieStore.get('pc_user_id')?.value

    if (!userId) {
      return NextResponse.json({ success: false, error: 'No autenticado' }, { status: 401 })
    }

    const messages = await db.message.findMany({
      where: { chatRoomId: roomId },
      orderBy: { createdAt: 'asc' },
    })

    await db.message.updateMany({
      where: { chatRoomId: roomId, isRead: false, senderId: { not: userId } },
      data: { isRead: true },
    })

    return NextResponse.json({ success: true, data: messages })
  } catch (error) {
    console.error('Get messages error:', error)
    return NextResponse.json({ success: false, error: 'Error al obtener mensajes' }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ roomId: string }> }) {
  try {
    const { roomId } = await params
    const cookieStore = await cookies()
    const userId = cookieStore.get('pc_user_id')?.value

    if (!userId) {
      return NextResponse.json({ success: false, error: 'No autenticado' }, { status: 401 })
    }

    const body = await request.json()
    const { content, imageUrl } = body

    if (!content && !imageUrl) {
      return NextResponse.json({ success: false, error: 'Mensaje o imagen requerido' }, { status: 400 })
    }

    const message = await db.message.create({
      data: { chatRoomId: roomId, senderId: userId, content: content || '', imageUrl: imageUrl || '' },
    })

    await db.chatRoom.update({
      where: { id: roomId },
      data: { lastMessage: content || '📷 Imagen', lastMessageAt: new Date() },
    })

    return NextResponse.json({ success: true, data: message })
  } catch (error) {
    console.error('Send message error:', error)
    return NextResponse.json({ success: false, error: 'Error al enviar mensaje' }, { status: 500 })
  }
}
