import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import { headers as nextHeaders } from 'next/headers';
import { db } from './db';

const SALT_ROUNDS = 4; // Reduced for hackathon/demo performance (was 12)

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Get the authenticated user ID from either cookie or X-User-Id header.
 * This dual approach ensures auth works even when cookies don't persist
 * (common in sandbox/iframe environments).
 */
export async function getAuthenticatedUserId(request?: Request): Promise<string | null> {
  // Method 1: Check cookie
  try {
    const cookieStore = await cookies();
    const cookieUserId = cookieStore.get('pc_user_id')?.value;
    if (cookieUserId) {
      // Verify user exists in database
      const user = await db.user.findUnique({ where: { id: cookieUserId } });
      if (user) return cookieUserId;
    }
  } catch {
    // Cookie reading failed
  }

  // Method 2: Check X-User-Id header (fallback for when cookies don't persist)
  if (request) {
    const headerUserId = request.headers.get('X-User-Id');
    if (headerUserId) {
      const user = await db.user.findUnique({ where: { id: headerUserId } });
      if (user) return headerUserId;
    }
  } else {
    // Try to read from next/headers
    try {
      const headersList = await nextHeaders();
      const headerUserId = headersList.get('X-User-Id');
      if (headerUserId) {
        const user = await db.user.findUnique({ where: { id: headerUserId } });
        if (user) return headerUserId;
      }
    } catch {
      // Header reading failed
    }
  }

  return null;
}

/**
 * Get the full authenticated user object (without password).
 * Checks both cookie and X-User-Id header.
 */
export async function getAuthenticatedUser(request?: Request) {
  const userId = await getAuthenticatedUserId(request);
  if (!userId) return null;

  const user = await db.user.findUnique({
    where: { id: userId },
    include: { businessProfile: true },
  });

  if (!user) return null;

  const { password: _, ...userWithoutPassword } = user;
  return userWithoutPassword;
}

export async function setAuthCookie(userId: string) {
  const cookieStore = await cookies();
  const isProduction = process.env.NODE_ENV === 'production';
  cookieStore.set('pc_user_id', userId, {
    httpOnly: true,
    secure: isProduction, // True on Vercel (HTTPS), false locally
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });
}

export async function clearAuthCookie() {
  const cookieStore = await cookies();
  cookieStore.delete('pc_user_id');
}
