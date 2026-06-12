import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const { postId } = await params
    if (!postId) return NextResponse.json({ success: false, error: 'postId requerido' }, { status: 200 })

    const comments = await db.postComment.findMany({
      where: { postId },
      include: { user: { select: { id: true, name: true, avatar: true } } },
      orderBy: { createdAt: 'asc' },
    })

    return NextResponse.json({ success: true, data: comments })
  } catch (error) {
    console.error('Get wall comments error:', error)
    return NextResponse.json({ success: false, error: 'Error al obtener comentarios' }, { status: 200 })
  }
}
