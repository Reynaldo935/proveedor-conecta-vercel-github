/**
 * File Upload API Route — ProveedorConecta Nicaragua
 *
 * Handles multipart/form-data file uploads via POST.
 * Saves files to /public/uploads/{subfolder}/ with unique filenames.
 *
 * Supported file types: images, videos, audio, documents.
 * Maximum file size: 50 MB per file.
 *
 * Form fields:
 *   - files:   One or more file entries (FormData append)
 *   - subfolder: Target subdirectory (avatars, products, covers, chat, documents, ads, wall, team)
 *
 * Query parameters:
 *   - folder:  Alternative way to specify subdirectory (takes lower priority than form field)
 *
 * Response (success):
 *   {
 *     success: true,
 *     data: ["/uploads/products/1710000000000-a1b2c3.jpg", ...],
 *     files: [{ url, filename, size, mimetype }, ...]
 *   }
 */

import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "node:fs/promises";
import { join, extname } from "node:path";
import { randomBytes } from "node:crypto";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB

const UPLOAD_ROOT = join(process.cwd(), "public", "uploads");

/** Valid subdirectories — anything else falls back to "documents" */
const VALID_FOLDERS = new Set([
  "products",
  "avatars",
  "covers",
  "chat",
  "documents",
  "ads",
  "wall",
  "team",
]);

const DEFAULT_FOLDER = "documents";

// ---------------------------------------------------------------------------
// Allowed MIME types
// ---------------------------------------------------------------------------

const ALLOWED_MIME_TYPES = new Set([
  // Images
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/svg+xml",
  "image/avif",
  "image/tiff",
  "image/bmp",

  // Videos
  "video/mp4",
  "video/webm",
  "video/quicktime",
  "video/ogg",
  "video/x-msvideo",
  "video/x-matroska",

  // Audio
  "audio/mpeg",
  "audio/wav",
  "audio/ogg",
  "audio/aac",
  "audio/flac",
  "audio/webm",

  // Documents
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "text/plain",
  "text/csv",
]);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Generate a unique filename using timestamp + random hex suffix,
 * preserving the original file extension.
 */
function generateUniqueFilename(originalName: string): string {
  const timestamp = Date.now();
  const randomSuffix = randomBytes(6).toString("hex");
  const ext = extname(originalName).toLowerCase() || ".bin";
  return `${timestamp}-${randomSuffix}${ext}`;
}

/**
 * Resolve and sanitise the target subfolder.
 * Accepts the value from the form field or query parameter.
 * Falls back to DEFAULT_FOLDER for invalid/missing values.
 */
function resolveFolder(raw: string | null): string {
  if (!raw) return DEFAULT_FOLDER;
  const normalised = raw.trim().toLowerCase();
  if (VALID_FOLDERS.has(normalised)) return normalised;
  // Allow the raw value if it looks like a safe directory name
  if (/^[a-z0-9_-]+$/i.test(normalised)) return normalised;
  return DEFAULT_FOLDER;
}

// ---------------------------------------------------------------------------
// POST handler
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  try {
    // -- Determine subfolder ------------------------------------------------
    const url = new URL(request.url);
    const queryFolder = url.searchParams.get("folder");

    // Parse form data (may throw if body is not valid multipart)
    const formData = await request.formData();

    // Form field "subfolder" takes priority over query param "folder"
    const subfolderField = formData.get("subfolder");
    const rawFolder =
      (typeof subfolderField === "string" && subfolderField) || queryFolder;
    const folder = resolveFolder(rawFolder);

    // -- Collect files from form data ---------------------------------------
    const files: File[] = [];
    formData.forEach((value) => {
      if (value instanceof File) {
        files.push(value);
      }
    });

    if (files.length === 0) {
      return NextResponse.json(
        { success: false, error: "No se proporcionó ningún archivo." },
        { status: 200 },
      );
    }

    // -- Ensure target directory exists -------------------------------------
    const targetDir = join(UPLOAD_ROOT, folder);
    await mkdir(targetDir, { recursive: true });

    // -- Process each file --------------------------------------------------
    const uploadedUrls: string[] = [];
    const uploadedFiles: Array<{
      url: string;
      filename: string;
      size: number;
      mimetype: string;
    }> = [];

    for (const file of files) {
      // Validate MIME type
      if (!ALLOWED_MIME_TYPES.has(file.type)) {
        return NextResponse.json(
          {
            success: false,
            error: `Tipo de archivo no permitido: "${file.type}". Archivo: ${file.name}`,
          },
          { status: 200 },
        );
      }

      // Validate file size
      if (file.size > MAX_FILE_SIZE) {
        const maxMB = Math.round(MAX_FILE_SIZE / (1024 * 1024));
        const fileMB = (file.size / (1024 * 1024)).toFixed(2);
        return NextResponse.json(
          {
            success: false,
            error: `El archivo "${file.name}" excede el tamaño máximo de ${maxMB}MB (${fileMB}MB).`,
          },
          { status: 200 },
        );
      }

      // Generate unique filename
      const uniqueName = generateUniqueFilename(file.name);
      const filePath = join(targetDir, uniqueName);

      // Read file content and write to disk
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      await writeFile(filePath, buffer);

      // Build URL path (relative to public/)
      const urlPath = `/uploads/${folder}/${uniqueName}`;

      uploadedUrls.push(urlPath);
      uploadedFiles.push({
        url: urlPath,
        filename: uniqueName,
        size: file.size,
        mimetype: file.type,
      });
    }

    return NextResponse.json({
      success: true,
      data: uploadedUrls,
      files: uploadedFiles,
    });
  } catch (error: unknown) {
    console.error("[Upload API] Error:", error);

    const message =
      error instanceof Error ? error.message : "Error interno del servidor.";

    return NextResponse.json(
      { success: false, error: message },
      { status: 200 },
    );
  }
}
