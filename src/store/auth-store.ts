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
}))

export type { User }
