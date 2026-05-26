"use client"

import { useEffect } from "react"

/**
 * Global fetch interceptor that adds X-User-Id header to all /api/ requests.
 * This ensures authentication works even when cookies don't persist
 * (common in sandbox/iframe environments).
 */
export function FetchInterceptor() {
  useEffect(() => {
    if (typeof window === "undefined") return

    const originalFetch = window.fetch
    window.fetch = async function (input: RequestInfo | URL, init?: RequestInit) {
      const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url

      // Only intercept /api/ requests
      if (url.startsWith("/api/") || url.includes("/api/")) {
        const userId = localStorage.getItem("pc_user_id")

        if (userId) {
          const headers = new Headers(init?.headers || {})
          // Add X-User-Id header if not already present
          if (!headers.has("X-User-Id")) {
            headers.set("X-User-Id", userId)
          }

          // Ensure credentials: 'include' for cookie sending
          const newInit = {
            ...init,
            headers,
            credentials: (init?.credentials || "include") as RequestCredentials,
          }

          return originalFetch.call(this, input, newInit)
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
