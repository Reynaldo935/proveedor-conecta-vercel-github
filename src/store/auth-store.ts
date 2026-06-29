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

    // Then verify with the server
    try {
      const res = await fetch('/api/auth/me', {
        credentials: 'include',
      })
      const data = await res.json()
      if (data.success && data.data) {
        const user = data.data
        set({ user, isAuthenticated: true, isLoading: false })
        storeAuthData(user)
        setCurrentUserId(user.id)
      } else {
        // Server says not authenticated - clear stored data
        set({ user: null, isAuthenticated: false, isLoading: false })
        clearAuthData()
        setCurrentUserId(null)
      }
    } catch {
      // Network error - keep stored user if available
      if (!storedUser) {
        set({ user: null, isAuthenticated: false, isLoading: false })
      }
    }
  },

  /**
   * Sync a Clerk-authenticated user with the Zustand store.
   * Looks up the user in our database by clerkId, or creates a minimal profile.
   * This bridges Clerk's auth with our existing data layer.
   */
  syncClerkUser: async (clerkUser) => {
    try {
      // Try to find or create the user in our database via API
      const res = await fetch('/api/auth/clerk-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clerkId: clerkUser.id,
          email: clerkUser.emailAddress,
          name: [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(' ') || clerkUser.emailAddress,
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
      } else {
        // Fallback: set a minimal user from Clerk data
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
          emailVerified: true, // Clerk handles email verification
          phoneVerified: false,
          balance: 50000,
        }
        set({ user: minimalUser, isAuthenticated: true, isLoading: false })
        storeAuthData(minimalUser as unknown as Record<string, unknown>)
        setCurrentUserId(clerkUser.id)
      }
    } catch {
      // Network error — still set minimal user from Clerk
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
    }
  },
}))

export type { User }
