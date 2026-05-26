# Task 4 - Frontend Bug Fixer

## Summary
Fixed 7 critical frontend bugs across 4 files.

## Fixes Applied

### Fix 1: Error Boundary
- Created `/src/app/error.tsx` with Spanish UI, reset button, and error logging

### Fix 2: Fake C$50,000 Balance Fallback
- Changed `?? 50000` → `?? 0` in:
  - `src/components/layout/header.tsx` (line 379)
  - `src/components/auth/profile-settings.tsx` (line 734)
  - `src/components/payment/checkout-view.tsx` (line 236)

### Fix 3: Unsafe JSON.parse
- Wrapped 2 `JSON.parse(bp.paymentMethods)` calls in profile-settings.tsx with try/catch IIFE returning `[]` on failure

### Fix 4: _count Non-null Assertions
- Replaced `p._count!` with `p._count ?? { likes: 0, comments: 0 }` in 2 locations (like handler + comment handler)

### Fix 5: Product Form String→Number
- Modified `handleSubmit` in sell-product-form.tsx to convert price, quantity, discountPrice, discountPercent to proper numeric types before sending to API

### Fix 6: NaN in Discount Preview
- Added `priceNum > 0` guard in discount price/percent change handlers
- Added `parseFloat(form.price) > 0` guard before rendering discount preview card

### Fix 7: Client-side Balance Calculation
- Changed checkout-view.tsx to prefer server-returned balance: `data.data.newBalance ?? data.data.buyer?.balance ?? (userBalance - amount)`

## Verification
- `bun run lint` passed with no errors
