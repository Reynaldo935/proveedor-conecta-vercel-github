import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import { db } from './db';

const SALT_ROUNDS = 12;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Get the authenticated user ID from the cookie.
 * Only cookie-based auth is supported — header-based auth is a security risk.
 */
export async function getAuthenticatedUserId(_request?: Request): Promise<string | null> {
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

  return null;
}

/**
 * Get the full authenticated user object (without password).
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
    secure: isProduction,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });
}

export async function clearAuthCookie() {
  const cookieStore = await cookies();
  cookieStore.delete('pc_user_id');
}
