# Work Log: PROD-FIX-1 — Lead Full-Stack Architect + Backend Engineer

## Date: 2026-03-05

## Summary of Changes

### 1. Fixed `/src/lib/db.ts` — Lazy Initialization (Critical Fix)

**Problem:** The original `db.ts` called `createPrismaClient()` at module-evaluation time via:
```ts
export const db = globalForPrisma.prisma ?? createPrismaClient()
```
This caused `@libsql/client`'s `createClient()` to be invoked during `next build` static page generation, when `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN` env vars are typically absent. This resulted in 3 `LibsqlError` warnings during build.

**Solution:** Converted the `db` export to a **Proxy-based lazy getter** that defers `PrismaClient` creation until first actual access:

```ts
let _db: PrismaClient | undefined

function getDb(): PrismaClient {
  if (_db) return _db
  if (globalForPrisma.prisma) { _db = globalForPrisma.prisma; return _db }
  _db = createPrismaClient()
  if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = _db
  return _db
}

export const db = new Proxy({} as PrismaClient, {
  get(_target, prop, receiver) {
    const instance = getDb()
    const value = Reflect.get(instance, prop, receiver)
    if (typeof value === 'function') return value.bind(instance)
    return value
  },
})
```

**Key properties preserved:**
- ✅ Turso adapter only activates when BOTH `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN` are set AND URL starts with `libsql://`
- ✅ Graceful fallback to local SQLite when Turso env vars are missing/invalid
- ✅ `PrismaLibSql` class name is correct (camelCase, verified via `require('@prisma/adapter-libsql')`)
- ✅ Turso adapter creation wrapped in try/catch
- ✅ Global singleton pattern preserved for development hot-reloading
- ✅ All existing `db.xxx.findMany()` call sites work transparently via Proxy

### 2. Verified All API Routes for Production Compatibility

Checked all 55 API routes. Summary:

| Check | Result |
|-------|--------|
| try/catch error handling | ✅ All routes have it |
| Proper JSON responses | ✅ All routes return `{ success, data/error }` |
| No filesystem ops (except upload) | ✅ Only `/api/upload` uses `fs/promises`, guarded by `isVercelBlob` check |
| No hardcoded localhost URLs | ✅ Zero instances found |
| Cookie-based auth works in serverless | ✅ Using `cookies()` from `next/headers` |
| Upload uses Vercel Blob in production | ✅ Checks `BLOB_READ_WRITE_TOKEN` env var |

### 3. Updated `vercel.json`

Changed `buildCommand` from `npx prisma generate && next build` to `prisma generate && next build` to match the project's package.json scripts (which uses `bun`/`prisma` directly, not `npx`).

Current `vercel.json`:
```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "framework": "nextjs",
  "buildCommand": "prisma generate && next build",
  "installCommand": "bun install",
  "regions": ["iad1"],
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        { "key": "Cache-Control", "value": "no-store, max-age=0" }
      ]
    }
  ]
}
```

### 4. Build Verification — ZERO Errors

```
▲ Next.js 16.1.3 (Turbopack)
✓ Compiled successfully in 7.6s
✓ Generating static pages (50/50) in 331.5ms
```

- **0 fatal errors**
- **0 LibsqlError warnings** (previously 3)
- **ESLint: 0 issues**
- All 55 API routes correctly detected as dynamic (ƒ)
- 2 static pages generated (/, /_not-found)

## Files Modified

1. `/home/z/my-project/src/lib/db.ts` — Complete rewrite with Proxy-based lazy initialization
2. `/home/z/my-project/vercel.json` — Updated buildCommand

## No Breaking Changes

All existing functionality preserved:
- `import { db } from '@/lib/db'` works identically
- `db.user.findMany()`, `db.product.create()`, `db.$transaction()` all work transparently
- Turso production mode activates automatically when env vars are present
- Local SQLite development mode unchanged
