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

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const userId = cookieStore.get('pc_user_id')?.value;

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
  cookieStore.set('pc_user_id', userId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });
}

export async function clearAuthCookie() {
  const cookieStore = await cookies();
  cookieStore.delete('pc_user_id');
}
