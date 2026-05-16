import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import { cookies } from 'next/headers'

const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
  'video/mp4',
  'video/webm',
]

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

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

    if (files.length > 5) {
      return NextResponse.json({ success: false, error: 'Máximo 5 archivos por subida' }, { status: 400 })
    }

    const uploadDir = path.join(process.cwd(), 'public', 'uploads')
    await mkdir(uploadDir, { recursive: true })

    const urls: string[] = []
    const errors: string[] = []

    for (const file of files) {
      // Validate MIME type
      if (!ALLOWED_MIME_TYPES.includes(file.type)) {
        errors.push(`${file.name}: Tipo de archivo no permitido (${file.type}). Use JPG, PNG, GIF, WebP, SVG, MP4 o WebM.`)
        continue
      }

      // Validate file size
      if (file.size > MAX_FILE_SIZE) {
        errors.push(`${file.name}: Archivo muy grande (máximo 10MB)`)
        continue
      }

      const bytes = await file.arrayBuffer()
      const buffer = Buffer.from(bytes)

      const ext = path.extname(file.name) || '.jpg'
      const filename = `${userId}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`
      const filepath = path.join(uploadDir, filename)

      await writeFile(filepath, buffer)
      urls.push(`/uploads/${filename}`)
    }

    if (urls.length === 0 && errors.length > 0) {
      return NextResponse.json({ success: false, error: errors.join('; ') }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      data: urls,
      ...(errors.length > 0 && { warnings: errors }),
    })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json({ success: false, error: 'Error al subir archivos' }, { status: 500 })
  }
}
