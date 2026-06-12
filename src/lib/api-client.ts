/**
 * Robust API client with retry logic, timeout handling, and offline detection.
 * All frontend API calls should use this instead of raw fetch().
 */

const MAX_RETRIES = 2
const RETRY_DELAY = 1000
const API_TIMEOUT = 15000

let isOffline = false
let offlineCallbacks: Array<(offline: boolean) => void> = []

export function onOfflineChange(cb: (offline: boolean) => void) {
  offlineCallbacks.push(cb)
  return () => { offlineCallbacks = offlineCallbacks.filter(c => c !== cb) }
}

export function getIsOffline() { return isOffline }

function setOffline(val: boolean) {
  if (isOffline !== val) {
    isOffline = val
    offlineCallbacks.forEach(cb => cb(val))
  }
}

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export interface ApiOptions {
  method?: string
  body?: unknown
  headers?: Record<string, string>
  retries?: number
  timeout?: number
  credentials?: RequestCredentials
}

/**
 * Make a resilient API call with retry logic, timeout, and offline detection.
 * Uses relative URLs which work from any origin (localhost, VS Code, Vercel, etc.)
 */
export async function apiCall<T = unknown>(
  path: string,
  options: ApiOptions = {}
): Promise<{ success: boolean; data?: T; error?: string }> {
  const {
    method = 'GET',
    body,
    headers = {},
    retries = MAX_RETRIES,
    timeout = API_TIMEOUT,
    credentials = 'include',
  } = options

  // Ensure path starts with /api/
  const url = path.startsWith('/') ? path : `/api/${path}`

  // Add auth header from localStorage — only used client-side for reference, not sent as X-User-Id

  if (body && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json'
  }

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), timeout)

      const fetchOptions: RequestInit = {
        method,
        headers,
        credentials,
        signal: controller.signal,
      }

      if (body && method !== 'GET') {
        fetchOptions.body = JSON.stringify(body)
      }

      const res = await fetch(url, fetchOptions)
      clearTimeout(timeoutId)

      setOffline(false)

      const data = await res.json()

      if (!res.ok) {
        return { success: false, error: data.error || `Error ${res.status}` }
      }

      return data
    } catch (err: unknown) {
      const isAbort = err instanceof DOMException && err.name === 'AbortError'
      const isNetwork = err instanceof TypeError && err.message.includes('fetch')

      // If this is the last attempt, return error
      if (attempt === retries) {
        setOffline(true)
        const msg = isAbort
          ? 'La conexión tardó demasiado. Intenta de nuevo.'
          : isNetwork || err instanceof TypeError
            ? 'No se pudo conectar al servidor. Verifica tu conexión.'
            : 'Error de conexión. Intenta de nuevo.'
        return { success: false, error: msg }
      }

      // Wait before retrying (with exponential backoff)
      await sleep(RETRY_DELAY * (attempt + 1))
    }
  }

  return { success: false, error: 'Error de conexión. Intenta de nuevo.' }
}

/** Convenience methods */
export const api = {
  get: <T = unknown>(path: string, opts?: Omit<ApiOptions, 'method' | 'body'>) =>
    apiCall<T>(path, { ...opts, method: 'GET' }),

  post: <T = unknown>(path: string, body?: unknown, opts?: Omit<ApiOptions, 'method' | 'body'>) =>
    apiCall<T>(path, { ...opts, method: 'POST', body }),

  put: <T = unknown>(path: string, body?: unknown, opts?: Omit<ApiOptions, 'method' | 'body'>) =>
    apiCall<T>(path, { ...opts, method: 'PUT', body }),

  patch: <T = unknown>(path: string, body?: unknown, opts?: Omit<ApiOptions, 'method' | 'body'>) =>
    apiCall<T>(path, { ...opts, method: 'PATCH', body }),

  delete: <T = unknown>(path: string, opts?: Omit<ApiOptions, 'method' | 'body'>) =>
    apiCall<T>(path, { ...opts, method: 'DELETE' }),
}
