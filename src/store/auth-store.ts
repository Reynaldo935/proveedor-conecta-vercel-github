import { create } from 'zustand'
import { storeAuthData, clearAuthData, getStoredUser, getStoredUserId, setCurrentUserId } from '@/lib/client-auth'

interface User {
  id: string
  email: string
  name: string
  role: 'BUYER' | 'SELLER' | 'ADMIN'
  avatar: string
  coverPhoto: string
  phone: string
  department: string
  address: string
  bio: string
  website: string
  isVerified: boolean
  emailVerified: boolean
  phoneVerified: boolean
  balance: number
  businessProfile?: {
    id: string
    businessName: string
    description: string
    category: string
    address: string
    latitude: number | null
    longitude: number | null
    phone: string
    coverImage: string
    logo: string
    hours: string
    paymentMethods: string
  } | null
}

interface AuthState {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean

  setUser: (user: User | null) => void
  setLoading: (loading: boolean) => void
  logout: () => void
  initAuth: () => Promise<void>
  /** Sync a Clerk-authenticated user with the Zustand store */
  syncClerkUser: (clerkUser: {
    id: string
    emailAddress: string
    firstName: string | null
    lastName: string | null
    imageUrl: string
  }) => Promise<void>
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,

  setUser: (user) => {
    set({ user, isAuthenticated: !!user, isLoading: false })
    if (user) {
      storeAuthData(user as unknown as Record<string, unknown>)
      setCurrentUserId(user.id)
    } else {
      clearAuthData()
      setCurrentUserId(null)
    }
  },
  setLoading: (isLoading) => set({ isLoading }),
  logout: () => {
    set({ user: null, isAuthenticated: false, isLoading: false })
    clearAuthData()
    setCurrentUserId(null)
    fetch('/api/auth/logout', { method: 'POST' }).catch(() => {})
  },
  initAuth: async () => {
    // Try to restore from localStorage first for instant UI
    const storedUser = getStoredUser()
    const storedUserId = getStoredUserId()

    if (storedUser) {
      set({ user: storedUser as User, isAuthenticated: true, isLoading: false })
      if (storedUser.id) setCurrentUserId(storedUser.id as string)
    }

    // Then verify with the server (uses Clerk auto-create now)
    try {
      const res = await fetch('/api/auth/me', { credentials: 'include' })
      const data = await res.json()
      if (data.success && data.data) {
        const user = data.data
        set({ user, isAuthenticated: true, isLoading: false })
        storeAuthData(user)
        setCurrentUserId(user.id)
      } else if (storedUser) {
        // Keep stored user — Clerk might still be loading
        set({ isLoading: false })
      } else {
        // No stored user and server says not authenticated
        set({ isLoading: false })
      }
    } catch {
      // Network error — keep stored user if available
      set({ isLoading: false })
      if (!storedUser) {
        set({ user: null, isAuthenticated: false })
      }
    }
  },

  /**
   * Sync a Clerk-authenticated user with the Zustand store.
   * Sets user IMMEDIATELY from Clerk data, then refreshes from API.
   */
  syncClerkUser: async (clerkUser) => {
    // Set user immediately from Clerk data (instant UI update)
    const minimalUser: User = {
      id: clerkUser.id,
      email: clerkUser.emailAddress,
      name: [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(' ') || clerkUser.emailAddress,
      role: 'BUYER',
      avatar: clerkUser.imageUrl,
      coverPhoto: '',
      phone: '',
      department: '',
      address: '',
      bio: '',
      website: '',
      isVerified: false,
      emailVerified: true,
      phoneVerified: false,
      balance: 50000,
    }
    set({ user: minimalUser, isAuthenticated: true, isLoading: false })
    storeAuthData(minimalUser as unknown as Record<string, unknown>)
    setCurrentUserId(clerkUser.id)

    // Then refresh from API (gets full DB record with balance, businessProfile, etc.)
    try {
      const res = await fetch('/api/auth/clerk-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clerkId: clerkUser.id,
          email: clerkUser.emailAddress,
          name: minimalUser.name,
          avatar: clerkUser.imageUrl,
        }),
        credentials: 'include',
      })
      const data = await res.json()
      if (data.success && data.data) {
        const user = data.data
        set({ user, isAuthenticated: true, isLoading: false })
        storeAuthData(user)
        setCurrentUserId(user.id)
      }
    } catch {
      // Keep the minimal user set above
    }
  },
}))

export type { User }
