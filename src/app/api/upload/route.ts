import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const userId = cookieStore.get('pc_user_id')?.value

    if (!userId) {
      return NextResponse.json({ success: false, error: 'No autenticado' }, { status: 401 })
    }

    const formData = await request.formData()
    const files = formData.getAll('files') as File[]
    
    if (!files || files.length === 0) {
      return NextResponse.json({ success: false, error: 'No se recibieron archivos' }, { status: 400 })
    }

    const uploadDir = path.join(process.cwd(), 'public', 'uploads')
    await mkdir(uploadDir, { recursive: true })

    const urls: string[] = []
    
    for (const file of files) {
      const bytes = await file.arrayBuffer()
      const buffer = Buffer.from(bytes)
      
      const ext = path.extname(file.name) || '.jpg'
      const filename = `${userId}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`
      const filepath = path.join(uploadDir, filename)
      
      await writeFile(filepath, buffer)
      urls.push(`/uploads/${filename}`)
    }

    return NextResponse.json({ success: true, data: urls })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json({ success: false, error: 'Error al subir archivos' }, { status: 500 })
  }
}
