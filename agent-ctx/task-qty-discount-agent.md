# Task: Add Quantity Discount Feature to Sell Product Form

## Summary
Added quantity discount feature to the sell product form and corresponding API endpoints.

## Changes Made

### 1. Frontend: `/src/components/marketplace/sell-product-form.tsx`
- Added `QuantityDiscountRule` interface with `minQty` and `discountPercent` fields
- Added `quantityDiscounts: QuantityDiscountRule[]` to `ProductForm` interface
- Added `Package`, `Plus`, `Trash2` lucide-react icon imports
- Set default `quantityDiscounts: []` in initial form state
- Added loading of existing `quantityDiscounts` in edit mode useEffect
- Added "Descuento por Cantidad" section in Step 3 below existing discount fields:
  - Card with amber/gold accent border styling
  - Badge with "📦 Cantidad" indicator
  - AnimatePresence for adding/removing rules with motion animations
  - List of existing rules showing "Lleva X+ → Y% descuento" with delete button (Trash2 icon)
  - Unit price preview per rule (C$XX.XX c/u)
  - "Agregar regla" button with max 5 rules limit
  - Inline editing inputs for the last added rule (Cantidad mínima / Descuento %)
  - Preview section showing sorted rules with full calculation
- Form submission already includes `quantityDiscounts` via `JSON.stringify(form)`

### 2. API: `/src/app/api/products/route.ts` (POST)
- Destructured `quantityDiscounts` from request body
- Added nested `quantityDiscounts.create` in `db.product.create()` data
- Filters rules with `minQty > 0 && discountPercent > 0`
- Added `quantityDiscounts: true` to include clause

### 3. API: `/src/app/api/products/[id]/route.ts` (GET & PUT)
- GET: Added `quantityDiscounts: true` to product include clause
- PUT: Added delete-and-recreate logic for quantity discounts before product update
  - `db.quantityDiscount.deleteMany()` then `db.quantityDiscount.createMany()`
  - Added `quantityDiscounts: true` to update include clause

## Lint & Dev Server
- Lint passed with no errors
- Dev server running normally
