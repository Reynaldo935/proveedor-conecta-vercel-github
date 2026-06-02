---
Task ID: 1
Agent: Main Agent
Task: Fix "Error de conexión" errors and improve API resilience

Work Log:
- Analyzed user screenshots showing "Error de conexión" toasts on login/register pages
- Root cause: fetch() calls had no retry logic, no timeout, and generic error messages
- Created `/src/lib/api-client.ts` - robust API client with retry logic (2 retries), 15s timeout, offline detection, and descriptive error messages
- Updated `/src/components/auth/login-form.tsx` to use new api client
- Updated `/src/components/layout/fetch-interceptor.tsx` with retry logic on API failures and offline detection
- Created `/src/components/layout/connection-banner.tsx` - shows banner when server is unreachable with auto-retry and reload button
- Added ConnectionBanner to `/src/app/layout.tsx`
- Replaced all 20+ instances of generic "Error de conexión" across 12 component files with specific, helpful error messages
- Lint passes clean
- Server running and all APIs tested successfully

Stage Summary:
- API calls now have automatic retry (2 retries with 2s delay)
- Better error messages in Spanish: "No se pudo conectar al servidor. Intenta de nuevo."
- Connection banner shows when server is offline with auto-retry indicator
- All demo accounts verified working: ferreteria@demo.ni, agroserv@demo.ni, tech@demo.ni, comprador@demo.ni
- Admin login verified: rey7214935@gmail.com / admin123
