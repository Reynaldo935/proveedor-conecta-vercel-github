/**
 * Cloudinary REST API Client
 *
 * Serverless-compatible Cloudinary client for image/video upload, deletion,
 * and optimised URL generation. No SDK required — all operations use `fetch()`
 * and the Node.js `crypto` module for signature generation.
 *
 * Required environment variables:
 * - CLOUDINARY_CLOUD_NAME
 * - CLOUDINARY_API_KEY
 * - CLOUDINARY_API_SECRET
 *
 * All functions gracefully return fallback values when Cloudinary is not
 * configured and never throw — safe to use as drop-in enhancements.
 */

import { createHash, createHmac } from "node:crypto";

// ---------------------------------------------------------------------------
// Configuration helpers
// ---------------------------------------------------------------------------

const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME ?? "";
const API_KEY = process.env.CLOUDINARY_API_KEY ?? "";
const API_SECRET = process.env.CLOUDINARY_API_SECRET ?? "";

/**
 * Check whether all three Cloudinary environment variables are set.
 */
export function isCloudinaryConfigured(): boolean {
  return CLOUD_NAME.length > 0 && API_KEY.length > 0 && API_SECRET.length > 0;
}

// ---------------------------------------------------------------------------
// Signature generation
// ---------------------------------------------------------------------------

/**
 * Generate an SHA-1 signature for Cloudinary API requests.
 *
 * The signature is computed over the sorted key-value parameters plus the
 * API secret, exactly as described in the Cloudinary docs:
 *
 * 1. Sort parameter keys alphabetically.
 * 2. Concatenate `key=value` pairs.
 * 3. Append the API secret.
 * 4. SHA-1 hash the resulting string.
 *
 * @see https://cloudinary.com/documentation/upload_images#generating_authentication_signatures
 */
export function generateUploadSignature(
  paramsToSign: Record<string, string>,
): string {
  const sorted = Object.keys(paramsToSign)
    .sort()
    .map((k) => `${k}=${paramsToSign[k]}`)
    .join("&");

  return createHash("sha1")
    .update(sorted + API_SECRET)
    .digest("hex");
}

// ---------------------------------------------------------------------------
// Allowed file types
// ---------------------------------------------------------------------------

const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/svg+xml",
  "image/avif",
  "image/tiff",
  "image/bmp",
]);

const ALLOWED_VIDEO_TYPES = new Set([
  "video/mp4",
  "video/webm",
  "video/ogg",
  "video/quicktime",
  "video/x-msvideo",
  "video/x-matroska",
]);

const ALLOWED_RAW_TYPES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/plain",
]);

function isAllowedMimeType(
  mimeType: string,
  resourceType: "image" | "video" | "raw",
): boolean {
  switch (resourceType) {
    case "image":
      return ALLOWED_IMAGE_TYPES.has(mimeType);
    case "video":
      return ALLOWED_VIDEO_TYPES.has(mimeType);
    case "raw":
      return ALLOWED_RAW_TYPES.has(mimeType);
    default:
      return false;
  }
}

// ---------------------------------------------------------------------------
// Upload
// ---------------------------------------------------------------------------

export interface CloudinaryUploadResult {
  success: boolean;
  url?: string;
  publicId?: string;
  error?: string;
}

export interface CloudinaryUploadOptions {
  /** File content as a Buffer or a remote URL string. */
  file: Buffer | string;
  /** Target folder in Cloudinary (e.g. "products", "profiles"). */
  folder?: string;
  /** Custom public ID (without folder). Cloudinary generates one if omitted. */
  publicId?: string;
  /** Inline transformation string (e.g. "w_500,h_500,c_fill"). */
  transformation?: string;
  /** Resource type — determines the upload endpoint and allowed file types. */
  resourceType?: "image" | "video" | "raw";
}

/**
 * Upload a file to Cloudinary from a Buffer or URL.
 *
 * For Buffer uploads the file is sent as `multipart/form-data` via `fetch`.
 * For URL uploads the `file` parameter is sent as a plain string and
 * Cloudinary fetches the remote asset.
 *
 * @returns `{ success, url, publicId }` on success, `{ success: false, error }` on failure.
 */
export async function cloudinaryUpload(
  options: CloudinaryUploadOptions,
): Promise<CloudinaryUploadResult> {
  if (!isCloudinaryConfigured()) {
    return {
      success: false,
      error: "Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET.",
    };
  }

  const {
    file,
    folder = "",
    publicId,
    transformation,
    resourceType = "image",
  } = options;

  // -- Validate MIME type when we have a Buffer (can't validate a URL) ------
  if (Buffer.isBuffer(file)) {
    // Infer MIME type from magic bytes (lightweight check).
    const mime = guessMimeTypeFromBuffer(file);
    if (mime && !isAllowedMimeType(mime, resourceType)) {
      return {
        success: false,
        error: `File type "${mime}" is not allowed for resource type "${resourceType}".`,
      };
    }
  }

  // -- Build signature parameters -------------------------------------------
  const timestamp = String(Math.floor(Date.now() / 1000));
  const paramsToSign: Record<string, string> = { timestamp };

  if (folder) paramsToSign.folder = folder;
  if (publicId) paramsToSign.public_id = publicId;
  if (transformation) paramsToSign.transformation = transformation;

  const signature = generateUploadSignature(paramsToSign);

  // -- Build request body ---------------------------------------------------
  const endpoint = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/${resourceType}/upload`;

  try {
    let response: Response;

    if (typeof file === "string") {
      // Remote URL — send as form field
      const body = new FormData();
      body.append("file", file);
      body.append("api_key", API_KEY);
      body.append("timestamp", timestamp);
      body.append("signature", signature);
      if (folder) body.append("folder", folder);
      if (publicId) body.append("public_id", publicId);
      if (transformation) body.append("transformation", transformation);

      response = await fetch(endpoint, { method: "POST", body });
    } else {
      // Buffer — send as multipart/form-data
      const body = new FormData();
      const blob = new Blob([file]);
      body.append("file", blob, `upload.${extensionForResourceType(resourceType)}`);
      body.append("api_key", API_KEY);
      body.append("timestamp", timestamp);
      body.append("signature", signature);
      if (folder) body.append("folder", folder);
      if (publicId) body.append("public_id", publicId);
      if (transformation) body.append("transformation", transformation);

      response = await fetch(endpoint, { method: "POST", body });
    }

    if (!response.ok) {
      const text = await response.text();
      console.error(`[Cloudinary] Upload failed (${response.status}): ${text}`);
      return {
        success: false,
        error: `Upload failed with status ${response.status}`,
      };
    }

    const data = await response.json();

    return {
      success: true,
      url: data.secure_url as string,
      publicId: data.public_id as string,
    };
  } catch (err) {
    console.error("[Cloudinary] Upload error:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Unknown upload error",
    };
  }
}

// ---------------------------------------------------------------------------
// Delete
// ---------------------------------------------------------------------------

/**
 * Delete a resource from Cloudinary by its public ID.
 *
 * Uses the Admin API (requires the API secret, server-side only).
 *
 * @returns `true` when the delete succeeded, `false` otherwise.
 */
export async function cloudinaryDelete(publicId: string): Promise<boolean> {
  if (!isCloudinaryConfigured()) {
    return false;
  }

  const timestamp = String(Math.floor(Date.now() / 1000));

  // Admin API uses HMAC-SHA256 for the signature.
  const signature = createHmac("sha256", API_SECRET)
    .update(`public_id=${publicId}&timestamp=${timestamp}`)
    .digest("hex");

  const endpoint = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/destroy`;

  try {
    const body = new URLSearchParams({
      public_id: publicId,
      api_key: API_KEY,
      timestamp,
      signature,
      invalidate: "true",
    });

    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error(`[Cloudinary] Delete failed (${response.status}): ${text}`);
      return false;
    }

    const data = await response.json();
    return data.result === "ok";
  } catch (err) {
    console.error("[Cloudinary] Delete error:", err);
    return false;
  }
}

// ---------------------------------------------------------------------------
// Optimised URL generation
// ---------------------------------------------------------------------------

export interface CloudinaryUrlOptions {
  width?: number;
  height?: number;
  crop?: string;
  quality?: string | number;
  format?: string;
}

/**
 * Build an optimised Cloudinary delivery URL for a given public ID.
 *
 * Does **not** require the API secret — this is a purely client-side
 * transformation URL.
 *
 * @example
 * ```ts
 * getCloudinaryUrl("products/shoes", { width: 400, height: 400, crop: "fill", quality: "auto", format: "webp" })
 * // → https://res.cloudinary.com/{cloud}/image/upload/c_fill,f_webp,h_400,q_auto,w_400/products/shoes
 * ```
 */
export function getCloudinaryUrl(
  publicId: string,
  options: CloudinaryUrlOptions = {},
): string {
  if (!CLOUD_NAME) {
    // Return a placeholder when not configured.
    return `https://placehold.co/400x400?text=No+Image`;
  }

  const transforms: string[] = [];

  if (options.width) transforms.push(`w_${options.width}`);
  if (options.height) transforms.push(`h_${options.height}`);
  if (options.crop) transforms.push(`c_${options.crop}`);
  if (options.quality) transforms.push(`q_${options.quality}`);
  if (options.format) transforms.push(`f_${options.format}`);

  const transformStr = transforms.length > 0 ? transforms.join(",") + "/" : "";

  return `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/${transformStr}${publicId}`;
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Lightweight MIME-type detection from file magic bytes.
 *
 * Only checks common image/video formats. Returns `undefined` for unknown
 * patterns, which means the type check is skipped (permissive fallback).
 */
function guessMimeTypeFromBuffer(buffer: Buffer): string | undefined {
  if (buffer.length < 12) return undefined;

  // JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return "image/jpeg";
  }
  // PNG: 89 50 4E 47
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47
  ) {
    return "image/png";
  }
  // GIF: 47 49 46 38
  if (
    buffer[0] === 0x47 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x38
  ) {
    return "image/gif";
  }
  // WebP: 52 49 46 46 ... 57 45 42 50
  if (
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50
  ) {
    return "image/webp";
  }
  // AVIF: starts with \x00\x00\x00 (ftyp box) + "avif" at offset 4–8
  if (
    buffer[4] === 0x61 &&
    buffer[5] === 0x76 &&
    buffer[6] === 0x69 &&
    buffer[7] === 0x66
  ) {
    return "image/avif";
  }
  // SVG (text-based): starts with "<svg" or "<?xml"
  const header = buffer.subarray(0, 100).toString("utf-8").trimStart();
  if (header.startsWith("<svg") || header.startsWith("<?xml")) {
    return "image/svg+xml";
  }
  // PDF: 25 50 44 46
  if (
    buffer[0] === 0x25 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x44 &&
    buffer[3] === 0x46
  ) {
    return "application/pdf";
  }
  // MP4: ftyp box at offset 4
  if (
    buffer[4] === 0x66 &&
    buffer[5] === 0x74 &&
    buffer[6] === 0x79 &&
    buffer[7] === 0x70
  ) {
    return "video/mp4";
  }

  return undefined;
}

/**
 * Default file extension for multipart upload based on resource type.
 */
function extensionForResourceType(
  resourceType: "image" | "video" | "raw",
): string {
  switch (resourceType) {
    case "image":
      return "jpg";
    case "video":
      return "mp4";
    case "raw":
      return "pdf";
    default:
      return "bin";
  }
}
