import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import { getAuthenticatedUser } from '@/lib/auth'

// Allowed MIME types
const ALLOWED_TYPES: Record<string, string[]> = {
  image: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'],
  video: ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime'],
  audio: ['audio/mpeg', 'audio/ogg', 'audio/wav', 'audio/webm', 'audio/aac'],
}

const ALL_ALLOWED = [...ALLOWED_TYPES.image, ...ALLOWED_TYPES.video, ...ALLOWED_TYPES.audio]

// Max file size: 50MB
const MAX_FILE_SIZE = 50 * 1024 * 1024

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req)
    if (!user) {
      return NextResponse.json({ success: false, error: 'No autenticado' }, { status: 401 })
    }

    const formData = await req.formData()
    const files = formData.getAll('files') as File[]
    const subfolder = (formData.get('subfolder') as string) || 'general'

    if (!files || files.length === 0) {
      return NextResponse.json({ success: false, error: 'No se proporcionaron archivos' }, { status: 400 })
    }

    const uploadedUrls: string[] = []

    for (const file of files) {
      if (!ALL_ALLOWED.includes(file.type)) {
        return NextResponse.json(
          { success: false, error: `Tipo de archivo no permitido: ${file.type}` },
          { status: 400 }
        )
      }

      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          { success: false, error: `Archivo demasiado grande: ${file.name}. Máximo 50MB` },
          { status: 400 }
        )
      }

      // Generate unique filename
      const ext = path.extname(file.name) || '.bin'
      const uniqueName = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}${ext}`

      // Ensure upload directory exists
      const uploadDir = path.join(process.cwd(), 'public', 'uploads', subfolder)
      await mkdir(uploadDir, { recursive: true })

      const filePath = path.join(uploadDir, uniqueName)
      const bytes = await file.arrayBuffer()
      await writeFile(filePath, Buffer.from(bytes))

      // Return the public URL
      const publicUrl = `/uploads/${subfolder}/${uniqueName}`
      uploadedUrls.push(publicUrl)
    }

    return NextResponse.json({
      success: true,
      data: uploadedUrls,
      message: `${uploadedUrls.length} archivo(s) subido(s) exitosamente`,
    })
  } catch (error) {
    console.error('[Upload API] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Error al subir archivo(s)' },
      { status: 500 }
    )
  }
}
