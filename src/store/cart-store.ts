/**
 * Enhanced Cart Store - Zustand + API Sync
 * ProveedorConecta Nicaragua
 *
 * Persists cart to localStorage. Syncs with server when user is logged in.
 * Supports multi-currency display: NIO, USD, NIC_COINS.
 */

import { create } from 'zustand'

export interface CartItem {
  productId: string
  title: string
  price: number
  discountPrice: number | null
  quantity: number
  image: string
  sellerName: string
  sellerId?: string
  maxQuantity: number
}

interface CartState {
  items: CartItem[]
  isOpen: boolean
  isLoading: boolean
  selectedCurrency: 'NIO' | 'USD' | 'NIC_COINS'
  exchangeRate: number

  addItem: (item: Omit<CartItem, 'quantity'> & { quantity?: number; sellerId?: string }) => void
  removeItem: (productId: string) => void
  updateQuantity: (productId: string, quantity: number) => void
  clearCart: () => void
  toggleCart: () => void
  openCart: () => void
  closeCart: () => void
  setCurrency: (currency: 'NIO' | 'USD' | 'NIC_COINS') => void
  getTotal: (currency?: 'NIO' | 'USD' | 'NIC_COINS') => number
  getItemCount: () => number
  syncWithServer: () => Promise<void>
}

function loadCart(): CartItem[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem('pc_cart_v2')
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

function saveCart(items: CartItem[]) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem('pc_cart_v2', JSON.stringify(items))
  } catch { /* ignore */ }
}

function loadCurrency(): 'NIO' | 'USD' | 'NIC_COINS' {
  if (typeof window === 'undefined') return 'NIO'
  try {
    const c = localStorage.getItem('pc_currency')
    if (c === 'USD' || c === 'NIC_COINS' || c === 'NIO') return c
  } catch { /* ignore */ }
  return 'NIO'
}

export const useCartStore = create<CartState>((set, get) => ({
  items: loadCart(),
  isOpen: false,
  isLoading: false,
  selectedCurrency: loadCurrency(),
  exchangeRate: 36.95,

  addItem: (item) => {
    set((state) => {
      const existing = state.items.find(i => i.productId === item.productId)
      let newItems: CartItem[]
      const qty = item.quantity || 1

      if (existing) {
        const newQty = Math.min(existing.quantity + qty, item.maxQuantity)
        newItems = state.items.map(i =>
          i.productId === item.productId ? { ...i, quantity: newQty } : i
        )
      } else {
        newItems = [...state.items, {
          ...item,
          quantity: qty,
          sellerId: item.sellerId || undefined
        }]
      }

      saveCart(newItems)
      return { items: newItems, isOpen: true }
    })
  },

  removeItem: (productId) => {
    set((state) => {
      const newItems = state.items.filter(i => i.productId !== productId)
      saveCart(newItems)
      return { items: newItems }
    })
  },

  updateQuantity: (productId, quantity) => {
    if (quantity <= 0) {
      get().removeItem(productId)
      return
    }
    set((state) => {
      const item = state.items.find(i => i.productId === productId)
      if (!item) return state
      const newQty = Math.min(quantity, item.maxQuantity)
      const newItems = state.items.map(i =>
        i.productId === productId ? { ...i, quantity: newQty } : i
      )
      saveCart(newItems)
      return { items: newItems }
    })
  },

  clearCart: () => {
    set({ items: [] })
    saveCart([])
  },

  toggleCart: () => set(s => ({ isOpen: !s.isOpen })),
  openCart: () => set({ isOpen: true }),
  closeCart: () => set({ isOpen: false }),

  setCurrency: (currency) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('pc_currency', currency)
    }
    set({ selectedCurrency: currency })
  },

  getTotal: (currency) => {
    const { items, selectedCurrency, exchangeRate } = get()
    const targetCurrency = currency || selectedCurrency
    const rawTotal = items.reduce((sum, item) => {
      const price = item.discountPrice ?? item.price
      return sum + price * item.quantity
    }, 0)

    if (targetCurrency === 'USD') {
      return Math.round((rawTotal / exchangeRate) * 100) / 100
    }
    return rawTotal
  },

  getItemCount: () => {
    return get().items.reduce((sum, item) => sum + item.quantity, 0)
  },

  syncWithServer: async () => {
    const { items } = get()
    set({ isLoading: true })
    try {
      const res = await fetch('/api/cart/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ items }),
      })
      const data = await res.json()
      if (data.success && data.data?.items) {
        set({ items: data.data.items })
        saveCart(data.data.items)
      }
    } catch (err) {
      console.error('Cart sync error:', err)
    } finally {
      set({ isLoading: false })
    }
  },
}))
