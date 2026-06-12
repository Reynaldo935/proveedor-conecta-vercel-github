"use client"

import { useEffect } from "react"

/**
 * Global fetch interceptor that:
 * 1. Ensures credentials: 'include' for all /api/ requests (cookie-based auth)
 * 2. Detects offline state and notifies the connection banner
 * 3. Adds retry logic for failed API requests (1 retry)
 */

let _offline = false
const _listeners: Array<(offline: boolean) => void> = []

export function isServerOffline() { return _offline }
export function onServerOfflineChange(cb: (offline: boolean) => void) {
  _listeners.push(cb)
  return () => { const i = _listeners.indexOf(cb); if (i >= 0) _listeners.splice(i, 1) }
}
function setOffline(val: boolean) {
  if (_offline !== val) {
    _offline = val
    _listeners.forEach(cb => cb(val))
  }
}

export function FetchInterceptor() {
  useEffect(() => {
    if (typeof window === "undefined") return

    const originalFetch = window.fetch

    window.fetch = async function (input: RequestInfo | URL, init?: RequestInit) {
      const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url

      // Only intercept /api/ requests
      if (url.startsWith("/api/") || url.includes("/api/")) {
        const userId = localStorage.getItem("pc_user_id")
        const headers = new Headers(init?.headers || {})

        // Ensure credentials: 'include' for cookie sending
        const newInit = {
          ...init,
          headers,
          credentials: (init?.credentials || "include") as RequestCredentials,
        }

        try {
          const result = await originalFetch.call(this, input, newInit)
          setOffline(false)
          return result
        } catch (err) {
          // API call failed - mark as offline and retry once
          setOffline(true)

          // Wait 2 seconds and retry
          await new Promise(resolve => setTimeout(resolve, 2000))

          try {
            const retryResult = await originalFetch.call(this, input, newInit)
            setOffline(false)
            return retryResult
          } catch {
            // Still failing - throw the original error
            throw err
          }
        }
      }

      return originalFetch.call(this, input, init)
    }

    return () => {
      window.fetch = originalFetch
    }
  }, [])

  return null
}
