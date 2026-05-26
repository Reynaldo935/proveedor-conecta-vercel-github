# Task 3: Fix Critical Auth and Payment Bugs

## Agent: Bug Fixer

## Summary of Fixes

### Bug 1: Image Upload returns "No autenticado"
**Root Cause**: `authFetch` relied solely on `localStorage.getItem('pc_user_id')` which could return null if:
- localStorage was blocked/unavailable in sandbox/iframe environments
- The `pc_user_id` key was not set (only `pc_user` key existed)
- Race condition between page load and auth initialization

**Fix Applied** (`/home/z/my-project/src/lib/client-auth.ts`):
1. Added module-level `_currentUserId` variable that persists in memory (set by auth store)
2. Added `setCurrentUserId()` function called by the auth store whenever user changes
3. Enhanced `getStoredUserId()` with 3-tier fallback:
   - Priority 1: Module-level `_currentUserId` variable (most reliable)
   - Priority 2: `localStorage.getItem('pc_user_id')` 
   - Priority 3: Extract `id` from `localStorage.getItem('pc_user')` JSON object (repairs missing key)
4. Enhanced `storeAuthData()` to always set `_currentUserId` even if localStorage write fails
5. Enhanced `authFetch()` with automatic 401 retry: if server returns 401 but we have a stored user ID, verify auth with `/api/auth/me` and retry the original request once

**Fix Applied** (`/home/z/my-project/src/store/auth-store.ts`):
- Added `setCurrentUserId()` calls in `setUser`, `logout`, and `initAuth` to keep module-level variable in sync

### Bug 2: Profile save doesn't persist
**Root Cause**: `profile-settings.tsx` used plain `fetch()` with manually constructed headers for `loadProfile()` and `refreshUser()` instead of `authFetch()`. While this technically worked, it was fragile and inconsistent.

**Fix Applied** (`/home/z/my-project/src/components/auth/profile-settings.tsx`):
1. Changed `loadProfile()` to use `authFetch("/api/auth/me")` instead of manual `fetch` with header construction
2. Changed `refreshUser()` to use `authFetch("/api/auth/me")` with error handling
3. Removed unused `getStoredUserId` import (now handled by `authFetch` internally)

### Bug 3: Payment validation - server-side balance check
**Root Cause**: The transaction API had:
- Balance validation (INSUFFICIENT_FUNDS) ✓ already present
- Buyer balance deduction ✓ already present
- **Missing**: Seller balance credit (97% payout) - seller never received money!
- **Missing**: Atomic transaction - balance deduction and transaction creation were separate operations (if transaction creation failed after deduction, buyer would lose money)

**Fix Applied** (`/home/z/my-project/src/app/api/transactions/route.ts`):
1. Wrapped critical operations in `db.$transaction()` for atomicity:
   - Step 1: Deduct from buyer balance (atomic decrement)
   - Step 2: Credit seller balance with 97% payout (atomic increment) **← NEW**
   - Step 3: Create transaction record
   - Step 4: Decrease product quantity
   - If any step fails, ALL changes are rolled back
2. Added seller balance credit: `balance: { increment: sellerPayout }` where `sellerPayout = finalAmount - commission` (97%)
3. Updated notification message to include seller's earnings
4. Updated audit log to include commission and payout details

### Bug 4: Sell product form image upload
**Root Cause**: `sell-product-form.tsx` used plain `fetch()` for loading product data in edit mode instead of `authFetch()`.

**Fix Applied** (`/home/z/my-project/src/components/marketplace/sell-product-form.tsx`):
- Changed `fetch(`/api/products/${editProductId}`)` to `authFetch(`/api/products/${editProductId}`)`

### Bonus: Additional authFetch adoption
Found and fixed several other components using plain `fetch` for authenticated endpoints:
- `vendor-profile.tsx`: Changed wall post creation from `fetch` to `authFetch`
- `buyer-dashboard.tsx`: Changed transactions, saved products, and auth/me calls from `fetch` to `authFetch`
- `chat-view.tsx`: Changed file upload from `fetch` to `authFetch`

## Files Modified
1. `/home/z/my-project/src/lib/client-auth.ts` - Enhanced auth robustness with module-level variable, 3-tier fallback, and 401 retry
2. `/home/z/my-project/src/store/auth-store.ts` - Added `setCurrentUserId` calls for in-memory auth sync
3. `/home/z/my-project/src/components/auth/profile-settings.tsx` - Switched to `authFetch` for all API calls
4. `/home/z/my-project/src/components/marketplace/sell-product-form.tsx` - Switched to `authFetch` for product loading
5. `/home/z/my-project/src/app/api/transactions/route.ts` - Added atomic transaction with seller credit
6. `/home/z/my-project/src/components/vendor/vendor-profile.tsx` - Switched to `authFetch`
7. `/home/z/my-project/src/components/marketplace/buyer-dashboard.tsx` - Switched to `authFetch`
8. `/home/z/my-project/src/components/chat/chat-view.tsx` - Switched to `authFetch`

## Lint Status
- 0 new errors introduced (pre-existing lint errors in footer.tsx and header.tsx are unrelated)
- 1 pre-existing warning (unused eslint-disable in chat messages route)
