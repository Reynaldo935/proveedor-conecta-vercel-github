import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUserId, setAuthCookie } from '@/lib/auth'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ALLOWED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/svg+xml',
  'image/webp',
  'image/avif',
  'video/mp4',
  'video/webm',
  'application/pdf',
]

export async function POST(request: NextRequest) {
  try {
    const userId = await getAuthenticatedUserId(request)
    if (!userId) {
      return NextResponse.json({ success: false, error: 'No autenticado' }, { status: 401 })
    }
    await setAuthCookie(userId)

    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const subfolder = (formData.get('subfolder') as string) || 'general'

    if (!file) {
      return NextResponse.json({ success: false, error: 'No se proporcionó archivo' }, { status: 400 })
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, error: `Archivo demasiado grande. Máximo ${MAX_FILE_SIZE / 1024 / 1024}MB` },
        { status: 400 }
      )
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: `Tipo de archivo no permitido: ${file.type}` },
        { status: 400 }
      )
    }

    // Sanitize subfolder (prevent directory traversal)
    const safeSubfolder = subfolder.replace(/[^a-zA-Z0-9_-]/g, '')

    // Try Vercel Blob first if token is available
    if (process.env.BLOB_READ_WRITE_TOKEN) {
      try {
        const { put } = await import('@vercel/blob')
        const ext = path.extname(file.name) || mimeToExt(file.type)
        const blobPath = `uploads/${safeSubfolder}/${uuidv4()}${ext}`
        const blob = await put(blobPath, file, {
          access: 'public',
          addRandomSuffix: false,
        })
        return NextResponse.json({
          success: true,
          data: {
            url: blob.url,
            pathname: blob.pathname,
            size: blob.size,
            uploadedAt: blob.uploadedAt,
          },
        })
      } catch (blobError) {
        console.error('Vercel Blob upload failed, falling back to local:', blobError)
        // Fall through to local upload
      }
    }

    // Local file upload fallback
    const ext = path.extname(file.name) || mimeToExt(file.type)
    const fileName = `${Date.now()}-${uuidv4().slice(0, 8)}${ext}`
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', safeSubfolder)

    // Ensure directory exists
    await mkdir(uploadDir, { recursive: true })

    const filePath = path.join(uploadDir, fileName)
    const buffer = Buffer.from(await file.arrayBuffer())
    await writeFile(filePath, buffer)

    const fileUrl = `/uploads/${safeSubfolder}/${fileName}`

    return NextResponse.json({
      success: true,
      data: {
        url: fileUrl,
        pathname: `uploads/${safeSubfolder}/${fileName}`,
        size: file.size,
        uploadedAt: new Date().toISOString(),
      },
    })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json({ success: false, error: 'Error al subir archivo' }, { status: 500 })
  }
}

function mimeToExt(mime: string): string {
  const map: Record<string, string> = {
    'image/jpeg': '.jpg',
    'image/png': '.png',
    'image/gif': '.gif',
    'image/svg+xml': '.svg',
    'image/webp': '.webp',
    'image/avif': '.avif',
    'video/mp4': '.mp4',
    'video/webm': '.webm',
    'application/pdf': '.pdf',
  }
  return map[mime] || '.bin'
}
