/**
 * Cart Store — Zustand
 * ProveedorConecta Nicaragua
 * 
 * Persistent cart with localStorage backup.
 * Supports add, remove, update quantity, and clear.
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
  maxQuantity: number
}

interface CartState {
  items: CartItem[]
  isOpen: boolean
  addItem: (item: Omit<CartItem, 'quantity'> & { quantity?: number }) => void
  removeItem: (productId: string) => void
  updateQuantity: (productId: string, quantity: number) => void
  clearCart: () => void
  toggleCart: () => void
  openCart: () => void
  closeCart: () => void
  getTotal: () => number
  getItemCount: () => number
}

// Load cart from localStorage
function loadCart(): CartItem[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem('pc_cart')
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

// Save cart to localStorage
function saveCart(items: CartItem[]) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem('pc_cart', JSON.stringify(items))
  } catch { /* localStorage not available */ }
}

export const useCartStore = create<CartState>((set, get) => ({
  items: loadCart(),
  isOpen: false,

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
        newItems = [...state.items, { ...item, quantity: qty }]
      }

      saveCart(newItems)
      return { items: newItems, isOpen: true } // Open cart drawer on add
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
    saveCart([])
    set({ items: [], isOpen: false })
  },

  toggleCart: () => set((s) => ({ isOpen: !s.isOpen })),
  openCart: () => set({ isOpen: true }),
  closeCart: () => set({ isOpen: false }),

  getTotal: () => {
    return get().items.reduce((sum, item) => {
      const price = item.discountPrice ?? item.price
      return sum + price * item.quantity
    }, 0)
  },

  getItemCount: () => {
    return get().items.reduce((sum, item) => sum + item.quantity, 0)
  },
}))
