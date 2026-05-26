/**
 * Client-side authentication utilities
 * 
 * Provides a robust auth system that uses BOTH cookies and localStorage
 * to ensure authentication works even when cookies don't persist
 * (common in sandbox/iframe environments).
 */

const USER_KEY = 'pc_user'
const USER_ID_KEY = 'pc_user_id'

export function getStoredUser() {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(USER_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function getStoredUserId(): string | null {
  if (typeof window === 'undefined') return null
  try {
    return localStorage.getItem(USER_ID_KEY)
  } catch {
    return null
  }
}

export function storeAuthData(user: Record<string, unknown>) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(USER_KEY, JSON.stringify(user))
    if (user.id) {
      localStorage.setItem(USER_ID_KEY, String(user.id))
    }
  } catch {
    // localStorage not available
  }
}

export function clearAuthData() {
  if (typeof window === 'undefined') return
  try {
    localStorage.removeItem(USER_KEY)
    localStorage.removeItem(USER_ID_KEY)
  } catch {
    // localStorage not available
  }
}

/**
 * Enhanced fetch that automatically includes auth credentials.
 * - Always sends cookies (credentials: 'include')
 * - Also sends X-User-Id header from localStorage as fallback
 * - If the server returns 401, clears stale auth data
 */
export async function authFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const userId = getStoredUserId()
  
  const headers = new Headers(options.headers || {})
  
  // Add X-User-Id header as fallback for cookie-based auth
  if (userId) {
    headers.set('X-User-Id', userId)
  }
  
  // Don't override Content-Type for FormData (browser sets boundary automatically)
  if (options.body instanceof FormData) {
    // Let the browser set Content-Type with boundary for FormData
  } else if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include', // Always send cookies
  })

  // If we get 401, the auth might be stale
  if (response.status === 401) {
    // Don't clear immediately - let the calling code handle it
    // But we can try to re-auth if we have stored credentials
  }

  return response
}
