import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'

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
      return NextResponse.json({ success: false, error: 'No se enviaron archivos' }, { status: 400 })
    }

    if (files.length > 5) {
      return NextResponse.json({ success: false, error: 'Máximo 5 archivos por subida' }, { status: 400 })
    }

    const uploadedUrls: string[] = []
    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml', 'image/bmp',
      'video/mp4', 'video/webm', 'video/quicktime',
      'audio/mpeg', 'audio/ogg', 'audio/wav', 'audio/webm',
    ]
    const maxFileSize = 10 * 1024 * 1024 // 10MB

    for (const file of files) {
      if (!allowedTypes.includes(file.type)) {
        return NextResponse.json({
          success: false,
          error: `Tipo de archivo no permitido: ${file.type}. Permitidos: JPG, PNG, GIF, WebP, SVG, BMP, MP4, WebM, MOV, MP3, OGG, WAV`,
        }, { status: 400 })
      }

      if (file.size > maxFileSize) {
        return NextResponse.json({
          success: false,
          error: `Archivo demasiado grande: ${file.name}. Máximo 10MB`,
        }, { status: 400 })
      }

      // Determine subfolder based on file type and Referer header
      let subfolder = 'products'
      const referer = request.headers.get('referer') || ''
      if (referer.includes('/profile') || referer.includes('/settings')) {
        subfolder = 'avatars'
      } else if (file.type.startsWith('video/')) {
        subfolder = 'chat'
      } else if (file.type.startsWith('audio/')) {
        subfolder = 'chat'
      }

      const buffer = Buffer.from(await file.arrayBuffer())
      const ext = file.name.split('.').pop() || 'bin'
      const uniqueName = `${uuidv4()}.${ext}`

      const uploadDir = path.join(process.cwd(), 'public', 'uploads', subfolder)
      await mkdir(uploadDir, { recursive: true })

      const filePath = path.join(uploadDir, uniqueName)
      await writeFile(filePath, buffer)

      uploadedUrls.push(`/uploads/${subfolder}/${uniqueName}`)
    }

    return NextResponse.json({
      success: true,
      data: uploadedUrls,
    })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json({ success: false, error: 'Error al subir archivo' }, { status: 500 })
  }
}
