import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const businessProfileId = searchParams.get('businessProfileId')
    if (!businessProfileId) return NextResponse.json({ success: false, error: 'businessProfileId requerido' }, { status: 400 })

    const posts = await db.wallPost.findMany({
      where: { businessProfileId },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ success: true, data: posts })
  } catch (error) {
    console.error('Get wall posts error:', error)
    return NextResponse.json({ success: false, error: 'Error al obtener publicaciones' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const userId = cookieStore.get('pc_user_id')?.value
    if (!userId) return NextResponse.json({ success: false, error: 'No autenticado' }, { status: 401 })

    const body = await request.json()
    const { content, imageUrl } = body

    const profile = await db.businessProfile.findUnique({ where: { userId } })
    if (!profile) return NextResponse.json({ success: false, error: 'Perfil de negocio no encontrado' }, { status: 404 })

    const post = await db.wallPost.create({
      data: { businessProfileId: profile.id, content: content || '', imageUrl: imageUrl || '' },
    })

    return NextResponse.json({ success: true, data: post })
  } catch (error) {
    console.error('Create wall post error:', error)
    return NextResponse.json({ success: false, error: 'Error al crear publicación' }, { status: 500 })
  }
}
