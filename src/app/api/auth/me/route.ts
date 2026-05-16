import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { cookies } from 'next/headers'

export async function GET() {
  try {
    const cookieStore = await cookies()
    const userId = cookieStore.get('pc_user_id')?.value

    if (!userId) {
      return NextResponse.json({ success: false, error: 'No autenticado' }, { status: 401 })
    }

    const user = await db.user.findUnique({
      where: { id: userId },
      include: { businessProfile: true },
    })

    if (!user) {
      return NextResponse.json({ success: false, error: 'Usuario no encontrado' }, { status: 404 })
    }

    const { password: _, ...safeUser } = user
    return NextResponse.json({ success: true, data: safeUser })
  } catch (error) {
    console.error('Get current user error:', error)
    return NextResponse.json({ success: false, error: 'Error al obtener usuario' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const cookieStore = await cookies()
    const userId = cookieStore.get('pc_user_id')?.value

    if (!userId) {
      return NextResponse.json({ success: false, error: 'No autenticado' }, { status: 401 })
    }

    const body = await request.json()
    const { name, phone, address, bio, avatar } = body

    const user = await db.user.update({
      where: { id: userId },
      data: { name, phone, address, bio, avatar },
      include: { businessProfile: true },
    })

    const { password: _, ...safeUser } = user
    return NextResponse.json({ success: true, data: safeUser })
  } catch (error) {
    console.error('Update user error:', error)
    return NextResponse.json({ success: false, error: 'Error al actualizar usuario' }, { status: 500 })
  }
}
