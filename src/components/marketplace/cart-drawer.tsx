'use client'

/**
 * Cart Drawer Component
 * ProveedorConecta Nicaragua
 * 
 * Slide-out cart drawer with item list, quantity controls, and checkout button.
 * Shows item count badge and subtotal.
 */

import { useCartStore } from '@/store/cart-store'
import { useAppStore } from '@/store/app-store'
import { Button } from '@/components/ui/button'
import { X, ShoppingCart, Plus, Minus, Trash2, ShoppingBag, CreditCard } from 'lucide-react'

export function CartDrawer() {
  const {
    items, isOpen, closeCart, removeItem, updateQuantity,
    getTotal, getItemCount, clearCart, selectedCurrency, setCurrency,
  } = useCartStore()
  const { navigate } = useAppStore()

  if (!isOpen) return null

  const handleCheckout = () => {
    closeCart()
    navigate('checkout')
  }

  const formatPrice = (amount: number) => {
    if (selectedCurrency === 'USD') {
      return `$${amount.toFixed(2)}`
    }
    return `C$${amount.toFixed(2)}`
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-50 transition-opacity"
        onClick={closeCart}
      />

      {/* Drawer */}
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-card shadow-2xl z-50 flex flex-col animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5 text-primary" />
            <h2 className="font-semibold text-lg">
              Carrito ({getItemCount()})
            </h2>
          </div>
          <button
            onClick={closeCart}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Currency selector */}
        <div className="px-4 py-2 border-b flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">Moneda:</span>
          {(['NIO', 'USD', 'NIC_COINS'] as const).map((c) => (
            <button
              key={c}
              onClick={() => setCurrency(c)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                selectedCurrency === c
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted hover:bg-muted-foreground/20'
              }`}
            >
              {c === 'NIO' ? 'C$' : c === 'USD' ? '$' : '🪙 NIC'}
            </button>
          ))}
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-3">
              <ShoppingBag className="h-12 w-12 opacity-30" />
              <p>Tu carrito está vacío</p>
              <Button variant="outline" size="sm" onClick={closeCart}>
                Explorar productos
              </Button>
            </div>
          ) : (
            items.map((item) => (
              <div
                key={item.productId}
                className="flex gap-3 p-3 bg-muted/50 rounded-lg"
              >
                {/* Image */}
                <div className="w-16 h-16 rounded-md bg-muted flex-shrink-0 overflow-hidden">
                  {item.image ? (
                    <img
                      src={item.image}
                      alt={item.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none'
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                      <ShoppingBag className="h-6 w-6" />
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-sm truncate">{item.title}</h4>
                  <p className="text-xs text-muted-foreground truncate">
                    {item.sellerName}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="font-semibold text-sm text-primary">
                      {formatPrice(item.discountPrice ?? item.price)}
                    </span>
                    {item.discountPrice && (
                      <span className="text-xs line-through text-muted-foreground">
                        {formatPrice(item.price)}
                      </span>
                    )}
                  </div>

                  {/* Quantity controls */}
                  <div className="flex items-center gap-2 mt-2">
                    <button
                      onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                      className="p-1 hover:bg-muted rounded transition-colors"
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <span className="text-sm w-8 text-center">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                      disabled={item.quantity >= item.maxQuantity}
                      className="p-1 hover:bg-muted rounded transition-colors disabled:opacity-50"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => removeItem(item.productId)}
                      className="ml-auto p-1 hover:bg-destructive/20 rounded transition-colors text-destructive"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Subtotal ({getItemCount()} items)</span>
              <span className="font-bold text-lg">{formatPrice(getTotal())}</span>
            </div>

            {selectedCurrency !== 'NIO' && (
              <p className="text-xs text-muted-foreground text-right">
                ≈ C${getTotal('NIO').toFixed(2)} NIO
              </p>
            )}

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={clearCart}
                className="flex-1"
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Vaciar
              </Button>
              <Button
                onClick={handleCheckout}
                className="flex-1"
              >
                <CreditCard className="h-4 w-4 mr-1" />
                Pagar {formatPrice(getTotal())}
              </Button>
            </div>
          </div>
        )}
      </div>
    </>
  )
}

/**
 * Cart Icon Button — shows item count badge
 */
export function CartIconButton() {
  const { getItemCount, toggleCart } = useCartStore()
  const count = getItemCount()

  return (
    <button
      onClick={toggleCart}
      className="relative p-2 hover:bg-muted rounded-lg transition-colors"
      aria-label="Carrito de compras"
    >
      <ShoppingCart className="h-5 w-5" />
      {count > 0 && (
        <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
          {count > 99 ? '99+' : count}
        </span>
      )}
    </button>
  )
}
