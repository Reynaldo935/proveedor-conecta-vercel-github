import { create } from 'zustand'

interface User {
  id: string
  email: string
  name: string
  role: 'BUYER' | 'SELLER' | 'ADMIN'
  avatar: string
  phone: string
  address: string
  bio: string
  isVerified: boolean
  emailVerified: boolean
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
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,

  setUser: (user) => set({ user, isAuthenticated: !!user, isLoading: false }),
  setLoading: (isLoading) => set({ isLoading }),
  logout: () => {
    set({ user: null, isAuthenticated: false, isLoading: false })
    fetch('/api/auth/logout', { method: 'POST' }).catch(() => {})
  },
}))

export type { User }
