import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUserId, setAuthCookie } from '@/lib/auth'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'

export async function POST(request: NextRequest) {
  try {
    const userId = await getAuthenticatedUserId(request)
    if (!userId) {
      return NextResponse.json({ success: false, error: 'No autenticado' }, { status: 401 })
    }

    // Re-set auth cookie
    await setAuthCookie(userId)

    const formData = await request.formData()
    const files = formData.getAll('files') as File[]
    const subfolder = (formData.get('subfolder') as string) || 'uploads'

    if (!files || files.length === 0) {
      return NextResponse.json({ success: false, error: 'No se enviaron archivos' }, { status: 400 })
    }

    if (files.length > 5) {
      return NextResponse.json({ success: false, error: 'Máximo 5 archivos' }, { status: 400 })
    }

    const uploadedUrls: string[] = []

    // Check if we're running on Vercel (have BLOB_READ_WRITE_TOKEN)
    const isVercelBlob = !!process.env.BLOB_READ_WRITE_TOKEN

    for (const file of files) {
      if (!file.type.startsWith('image/')) {
        continue // Skip non-image files silently
      }

      const bytes = await file.arrayBuffer()
      const buffer = Buffer.from(bytes)

      // Generate unique filename
      const ext = file.name.split('.').pop() || 'jpg'
      const uniqueName = `${subfolder}/${userId}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`

      if (isVercelBlob) {
        // ── Vercel Blob (production) ──
        try {
          const { put } = await import('@vercel/blob')
          const blob = await put(uniqueName, buffer, {
            access: 'public',
            contentType: file.type,
          })
          uploadedUrls.push(blob.url)
        } catch (blobError) {
          console.error('Vercel Blob upload failed:', blobError)
          return NextResponse.json({
            success: false,
            error: 'Error al subir archivo a almacenamiento en la nube. Verifica que Vercel Blob esté configurado.',
          }, { status: 500 })
        }
      } else {
        // ── Local filesystem (development only) ──
        try {
          const publicDir = path.join(process.cwd(), 'public', 'uploads', subfolder)
          await mkdir(publicDir, { recursive: true })

          const fileName = `${userId}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`
          const filePath = path.join(publicDir, fileName)
          await writeFile(filePath, buffer)

          uploadedUrls.push(`/uploads/${subfolder}/${fileName}`)
        } catch (fsError) {
          console.error('Local filesystem upload failed:', fsError)
          return NextResponse.json({
            success: false,
            error: 'Error al subir archivo. En producción, configura Vercel Blob Storage.',
          }, { status: 500 })
        }
      }
    }

    if (uploadedUrls.length === 0) {
      return NextResponse.json({ success: false, error: 'No se pudieron subir las imágenes' }, { status: 400 })
    }

    return NextResponse.json({ success: true, data: uploadedUrls })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json({ success: false, error: 'Error al subir archivos' }, { status: 500 })
  }
}
