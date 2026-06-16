import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUserId } from '@/lib/auth'
import { safeApiHandler } from '@/lib/api-utils'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { randomUUID } from 'crypto'

// Allowed MIME types for security
const ALLOWED_TYPES = new Set([
  // Images
  'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml', 'image/bmp',
  // Videos
  'video/mp4', 'video/mpeg', 'video/quicktime', 'video/webm', 'video/x-msvideo',
  // Documents
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  // Text
  'text/plain', 'text/csv',
  // Archives
  'application/zip', 'application/x-rar-compressed',
  // Audio
  'audio/mpeg', 'audio/wav', 'audio/ogg',
])

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB per file
const MAX_FILES = 5

export async function POST(request: NextRequest) {
  return safeApiHandler(async () => {
    const userId = await getAuthenticatedUserId(request)
    if (!userId) {
      return NextResponse.json({ success: false, error: 'No autenticado' }, { status: 401 })
    }

    const formData = await request.formData()
    const files = formData.getAll('files')

    if (!files || files.length === 0) {
      return NextResponse.json({ success: false, error: 'No se enviaron archivos' }, { status: 400 })
    }

    if (files.length > MAX_FILES) {
      return NextResponse.json(
        { success: false, error: `Máximo ${MAX_FILES} archivos por vez` },
        { status: 400 }
      )
    }

    const uploadDir = join(process.cwd(), 'public', 'uploads')

    // Ensure upload directory exists
    try {
      await mkdir(uploadDir, { recursive: true })
    } catch {
      // Directory might already exist
    }

    const uploadedUrls: string[] = []
    const errors: string[] = []

    for (const file of files) {
      if (!(file instanceof File)) {
        errors.push('Archivo inválido')
        continue
      }

      // Check MIME type
      if (!ALLOWED_TYPES.has(file.type)) {
        errors.push(`${file.name}: Tipo no permitido (${file.type})`)
        continue
      }

      // Check file size
      if (file.size > MAX_FILE_SIZE) {
        errors.push(`${file.name}: Excede 10MB`)
        continue
      }

      try {
        // Generate unique filename
        const ext = file.name.split('.').pop() || 'bin'
        const uniqueName = `${randomUUID()}.${ext}`
        const filePath = join(uploadDir, uniqueName)

        // Write file
        const buffer = Buffer.from(await file.arrayBuffer())
        await writeFile(filePath, buffer)

        // Return the public URL path
        uploadedUrls.push(`/uploads/${uniqueName}`)
      } catch (err) {
        console.error('Upload error:', err)
        errors.push(`${file.name}: Error al guardar`)
      }
    }

    if (uploadedUrls.length === 0) {
      return NextResponse.json(
        { success: false, error: errors.join('; ') || 'No se pudo subir ningún archivo' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      data: uploadedUrls,
      warnings: errors.length > 0 ? errors : undefined,
    })
  })
}
