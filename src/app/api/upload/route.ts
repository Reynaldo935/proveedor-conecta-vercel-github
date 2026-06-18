/**
 * File Upload API Route
 * POST /api/upload
 *
 * Handles file uploads using Vercel Blob storage.
 * Supports images, videos, audio, documents, and any file type.
 * Enforces 10MB size limit per file.
 * Validates MIME types.
 *
 * Only authenticated users can upload.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUserId } from '@/lib/auth'
import { put } from '@vercel/blob'

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ALLOWED_MIME_TYPES = [
  // Images
  'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
  // Videos
  'video/mp4', 'video/webm', 'video/ogg', 'video/quicktime',
  // Audio
  'audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/webm', 'audio/aac',
  // Documents
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/csv', 'text/plain',
  // Archives
  'application/zip', 'application/x-rar-compressed',
]

export async function POST(request: NextRequest) {
  try {
    // Authenticate
    const userId = await getAuthenticatedUserId(request)
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'No autenticado. Inicia sesión para subir archivos.' },
        { status: 200 }
      )
    }

    const formData = await request.formData()
    const files = formData.getAll('files') as File[]
    const subfolder = (formData.get('subfolder') as string) || 'general'

    if (!files || files.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No se proporcionaron archivos' },
        { status: 200 }
      )
    }

    const uploadedUrls: string[] = []
    const errors: string[] = []

    for (const file of files) {
      // Validate file size
      if (file.size > MAX_FILE_SIZE) {
        errors.push(`${file.name}: excede el límite de 10MB`)
        continue
      }

      // Validate MIME type (allow any type, but warn about unrecognized)
      if (!ALLOWED_MIME_TYPES.includes(file.type)) {
        console.warn(`[Upload] Unrecognized MIME type: ${file.type} for ${file.name} — allowing upload`)
        // We still allow the upload for any file type, just log it
      }

      try {
        // Generate a unique filename
        const timestamp = Date.now()
        const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
        const uniqueName = `${subfolder}/${timestamp}-${safeName}`

        // Upload to Vercel Blob
        const blob = await put(uniqueName, file, {
          access: 'public',
          contentType: file.type,
        })

        uploadedUrls.push(blob.url)
      } catch (uploadError) {
        console.error(`[Upload] Failed to upload ${file.name}:`, uploadError)
        errors.push(`${file.name}: error al subir`)
      }
    }

    if (uploadedUrls.length === 0) {
      return NextResponse.json(
        { success: false, error: errors.join('; ') || 'No se pudo subir ningún archivo' },
        { status: 200 }
      )
    }

    // Return the uploaded URLs
    return NextResponse.json({
      success: true,
      data: uploadedUrls,
      ...(errors.length > 0 ? { warnings: errors } : {}),
    })
  } catch (error) {
    console.error('[Upload API] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Error al procesar la subida de archivos' },
      { status: 200 }
    )
  }
}
