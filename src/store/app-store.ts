import { create } from 'zustand'

export type AppView = 
  | 'home'
  | 'login'
  | 'register'
  | 'verify-email'
  | 'product-detail'
  | 'sell-product'
  | 'edit-product'
  | 'my-products'
  | 'vendor-profile'
  | 'buyer-dashboard'
  | 'vendor-dashboard'
  | 'chat'
  | 'chat-list'
  | 'checkout'
  | 'map'
  | 'cotizaciones'
  | 'cotizacion-detail'
  | 'notifications'
  | 'profile'
  | 'settings'
  | 'search'
  | 'admin'
  | 'terms'
  | 'privacy'
  | 'refund'
  | 'payments'
  | 'featured'
  | 'downloads'
  | 'backup'
  | 'forgot-password'
  | 'loyalty'
  | 'reviews'
  | 'calendar'
  | 'currencies'
  | 'audit'
  | 'create-ad'
  | 'surveys'
  | 'suppliers'
  | 'why-us'

interface AppState {
  currentView: AppView
  selectedProductId: string | null
  selectedVendorId: string | null
  selectedCotizacionId: string | null
  editProductId: string | null
  selectedRoomId: string | null
  searchQuery: string
  selectedCategory: string
  priceRange: [number, number]
  selectedLocation: string
  
  navigate: (view: AppView, params?: Record<string, string>) => void
  setSearchQuery: (q: string) => void
  setSelectedCategory: (c: string) => void
  setPriceRange: (r: [number, number]) => void
  setSelectedLocation: (l: string) => void
}

export const useAppStore = create<AppState>((set) => ({
  currentView: 'home',
  selectedProductId: null,
  selectedVendorId: null,
  selectedCotizacionId: null,
  editProductId: null,
  selectedRoomId: null,
  searchQuery: '',
  selectedCategory: '',
  priceRange: [0, 100000],
  selectedLocation: '',

  navigate: (view, params = {}) => set({
    currentView: view,
    selectedProductId: params.productId ?? null,
    selectedVendorId: params.vendorId ?? null,
    selectedCotizacionId: params.cotizacionId ?? null,
    editProductId: params.editProductId ?? null,
    selectedRoomId: params.roomId ?? null,
  }),
  setSearchQuery: (q) => set({ searchQuery: q }),
  setSelectedCategory: (c) => set({ selectedCategory: c }),
  setPriceRange: (r) => set({ priceRange: r }),
  setSelectedLocation: (l) => set({ selectedLocation: l }),
}))
