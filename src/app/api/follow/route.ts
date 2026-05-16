import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const userId = cookieStore.get('pc_user_id')?.value
    if (!userId) return NextResponse.json({ success: false, error: 'No autenticado' }, { status: 401 })

    const body = await request.json()
    const { followingId } = body
    if (!followingId) return NextResponse.json({ success: false, error: 'followingId requerido' }, { status: 400 })

    const existing = await db.follow.findUnique({
      where: { followerId_followingId: { followerId: userId, followingId } },
    })

    if (existing) {
      await db.follow.delete({ where: { id: existing.id } })
      return NextResponse.json({ success: true, data: { following: false } })
    } else {
      await db.follow.create({ data: { followerId: userId, followingId } })
      return NextResponse.json({ success: true, data: { following: true } })
    }
  } catch (error) {
    console.error('Toggle follow error:', error)
    return NextResponse.json({ success: false, error: 'Error al seguir' }, { status: 500 })
  }
}
