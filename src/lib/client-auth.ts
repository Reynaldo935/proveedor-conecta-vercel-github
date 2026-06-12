/**
 * Client-side authentication utilities
 * 
 * Provides a robust auth system that uses BOTH cookies and localStorage
 * to ensure authentication works even when cookies don't persist
 * (common in sandbox/iframe environments).
 */

const USER_KEY = 'pc_user'
const USER_ID_KEY = 'pc_user_id'

// Module-level fallback: set by auth store, read by authFetch
// This ensures auth works even if localStorage is blocked/unavailable
let _currentUserId: string | null = null

/**
 * Register the current user ID in memory.
 * Called by the auth store whenever the user changes.
 */
export function setCurrentUserId(userId: string | null) {
  _currentUserId = userId
}

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
  // Priority 1: module-level variable (most reliable, always in sync with auth store)
  if (_currentUserId) return _currentUserId

  // Priority 2: localStorage dedicated key
  if (typeof window !== 'undefined') {
    try {
      const id = localStorage.getItem(USER_ID_KEY)
      if (id) return id
    } catch {
      // localStorage not available
    }

    // Priority 3: extract from stored user object (fallback if pc_user_id key wasn't set)
    try {
      const raw = localStorage.getItem(USER_KEY)
      if (raw) {
        const parsed = JSON.parse(raw)
        if (parsed?.id) {
          // Repair the missing key
          localStorage.setItem(USER_ID_KEY, String(parsed.id))
          return String(parsed.id)
        }
      }
    } catch {
      // localStorage not available
    }
  }

  return null
}

export function storeAuthData(user: Record<string, unknown>) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(USER_KEY, JSON.stringify(user))
    if (user.id) {
      const id = String(user.id)
      localStorage.setItem(USER_ID_KEY, id)
      // Keep module-level variable in sync
      _currentUserId = id
    }
  } catch {
    // localStorage not available — still set module-level variable
    if (user.id) {
      _currentUserId = String(user.id)
    }
  }
}

export function clearAuthData() {
  _currentUserId = null
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
 * - If the server returns 401, attempts one retry after re-verifying auth
 */
export async function authFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const userId = getStoredUserId()
  
  const headers = new Headers(options.headers || {})
  
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

  // If we get 401 and we think we have a user, try to re-verify once
  if (response.status === 401 && userId) {
    try {
      const verifyRes = await fetch('/api/auth/me', {
        credentials: 'include',
      })
      const verifyData = await verifyRes.json()
      if (verifyData.success && verifyData.data?.id) {
        // Auth is still valid — retry the original request
        storeAuthData(verifyData.data)
        const retryHeaders = new Headers(options.headers || {})
        if (!(options.body instanceof FormData) && !retryHeaders.has('Content-Type')) {
          retryHeaders.set('Content-Type', 'application/json')
        }
        return fetch(url, {
          ...options,
          headers: retryHeaders,
          credentials: 'include',
        })
      } else {
        // Server says not authenticated — clear stale data
        clearAuthData()
      }
    } catch {
      // Verification failed — don't retry
    }
  }

  return response
}
