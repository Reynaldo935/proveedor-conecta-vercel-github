# Task 1 - Main Developer

## Task: Fix auth API routes - verify, register, phone-verify, google, me

### Changes Made

1. **Prisma Schema** (`prisma/schema.prisma`): Added `department String @default("")` to User model
2. **Database**: Ran `bun run db:push` to sync schema and regenerate Prisma client

3. **`/api/auth/verify/route.ts`**: Changed both `findUnique({ where: { token } })` calls to `findFirst({ where: { token } })` to fix Prisma runtime caching error

4. **`/api/auth/register/route.ts`**: Complete rewrite with:
   - Server-side validation using `validatePhoneNicaragua`, `validateEmail`, `NICARAGUA_DEPARTMENTS`
   - Required fields: name, email, password (min 6), phone, department, address
   - Phone normalized before storage
   - department validated against NICARAGUA_DEPARTMENTS list

5. **`/api/auth/phone-verify/route.ts`** (NEW): Phone verification endpoint
   - Send code: `{ phone }` → generates 6-digit code, stores with 10-min expiry, returns code
   - Verify code: `{ phone, code, action: "verify" }` → validates and marks verified, updates user.phoneVerified

6. **`/api/auth/google/route.ts`**: Added email validation, phone/department/address support in create and update

7. **`/api/auth/me/route.ts`**: Explicitly returns `phoneVerified`, supports `department` in PUT

### Lint: PASS
