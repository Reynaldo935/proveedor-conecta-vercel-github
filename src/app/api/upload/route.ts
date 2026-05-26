import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUserId, setAuthCookie } from '@/lib/auth'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'

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
    const subfolder = (formData.get('subfolder') as string) || 'misc'

    const ALLOWED_SUBFOLDERS = ["avatars", "covers", "products", "wall", "chat", "misc"]
    if (subfolder && !ALLOWED_SUBFOLDERS.includes(subfolder)) {
      return NextResponse.json({ success: false, error: "Subfolder no válido" }, { status: 400 })
    }

    if (!files || files.length === 0) {
      return NextResponse.json({ success: false, error: 'No se recibieron archivos' }, { status: 400 })
    }

    // Validate file count (max 5 at once)
    if (files.length > 5) {
      return NextResponse.json({ success: false, error: 'Máximo 5 archivos a la vez' }, { status: 400 })
    }

    const uploadDir = path.join(process.cwd(), 'public', 'uploads', subfolder)

    // Ensure directory exists
    try {
      await mkdir(uploadDir, { recursive: true })
    } catch {
      // Directory already exists
    }

    const urls: string[] = []

    for (const file of files) {
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        return NextResponse.json(
          { success: false, error: `Archivo ${file.name} excede 10MB` },
          { status: 400 }
        )
      }

      // Validate file type
      const allowedTypes = [
        'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
        'video/mp4', 'video/webm', 'video/quicktime',
      ]
      if (!allowedTypes.includes(file.type)) {
        return NextResponse.json(
          { success: false, error: `Tipo de archivo no permitido: ${file.type}` },
          { status: 400 }
        )
      }

      // Generate unique filename
      const ext = path.extname(file.name) || '.png'
      const filename = `${uuidv4()}${ext}`
      const filepath = path.join(uploadDir, filename)

      // Write file
      const buffer = Buffer.from(await file.arrayBuffer())
      await writeFile(filepath, buffer)

      // Return the public URL path
      const url = `/uploads/${subfolder}/${filename}`
      urls.push(url)
    }

    return NextResponse.json({
      success: true,
      data: urls,
    })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { success: false, error: 'Error al subir archivo' },
      { status: 500 }
    )
  }
}
