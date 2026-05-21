"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import fallbackCreators from "@/data/creators.json"

export interface Creator {
  id: string
  name: string
  role: string
  bio: string
  photo: string
  email: string
  color: string
}

const CACHE_KEY = "pc_creators_data"
const CACHE_EXPIRY_KEY = "pc_creators_expiry"
const CACHE_DURATION = 24 * 60 * 60 * 1000 // 24 hours

export function useCreators() {
  const [creators, setCreators] = useState<Creator[]>(fallbackCreators as Creator[])
  const [loading, setLoading] = useState(true)
  const [fromCache, setFromCache] = useState(false)

  const refreshCreators = useCallback(async () => {
    setLoading(true)
    try {
      // Try Google Apps Script endpoint first
      const endpoint = process.env.NEXT_PUBLIC_CREATORS_ENDPOINT
      if (endpoint) {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 8000)
        try {
          const res = await fetch(endpoint, { signal: controller.signal })
          clearTimeout(timeoutId)
          if (res.ok) {
            const data = await res.json()
            if (Array.isArray(data) && data.length > 0) {
              setCreators(data)
              localStorage.setItem(CACHE_KEY, JSON.stringify(data))
              localStorage.setItem(CACHE_EXPIRY_KEY, String(Date.now()))
              setLoading(false)
              return
            }
          }
        } catch {
          clearTimeout(timeoutId)
        }
      }

      // Try our own API as backup
      try {
        const res = await fetch('/api/creators')
        if (res.ok) {
          const data = await res.json()
          if (data.success && Array.isArray(data.data) && data.data.length > 0) {
            setCreators(data.data)
            localStorage.setItem(CACHE_KEY, JSON.stringify(data.data))
            localStorage.setItem(CACHE_EXPIRY_KEY, String(Date.now()))
            setLoading(false)
            return
          }
        }
      } catch {}

      // Clear cache and try localStorage
      localStorage.removeItem(CACHE_KEY)
      localStorage.removeItem(CACHE_EXPIRY_KEY)
      
      // Keep existing data (fallback or previous load)
    } catch {
      // Keep existing data
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    async function loadCreators() {
      try {
        // 1. Try fetching from Google Apps Script endpoint
        const endpoint = process.env.NEXT_PUBLIC_CREATORS_ENDPOINT
        if (endpoint) {
          const controller = new AbortController()
          const timeoutId = setTimeout(() => controller.abort(), 5000)
          try {
            const res = await fetch(endpoint, { signal: controller.signal })
            clearTimeout(timeoutId)
            if (res.ok) {
              const data = await res.json()
              if (Array.isArray(data) && data.length > 0) {
                setCreators(data)
                localStorage.setItem(CACHE_KEY, JSON.stringify(data))
                localStorage.setItem(CACHE_EXPIRY_KEY, String(Date.now()))
                setLoading(false)
                return
              }
            }
          } catch {
            clearTimeout(timeoutId)
          }
        }

        // 2. Try localStorage cache
        const cached = localStorage.getItem(CACHE_KEY)
        const cachedTime = localStorage.getItem(CACHE_EXPIRY_KEY)
        if (cached && cachedTime) {
          const age = Date.now() - parseInt(cachedTime)
          if (age < CACHE_DURATION) {
            setCreators(JSON.parse(cached))
            setFromCache(true)
            setLoading(false)
            return
          }
        }

        // 3. Fallback to hardcoded data (already set as initial state)
        setLoading(false)
      } catch {
        // Use fallback data
        setLoading(false)
      }
    }
    loadCreators()
  }, [])

  // Auto-refresh every 30 minutes
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      refreshCreators()
    }, 30 * 60 * 1000) // 30 minutes

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [])

  return { creators, loading, fromCache, refreshCreators }
}
