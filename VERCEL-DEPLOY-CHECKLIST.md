# 🚀 Vercel Deployment Checklist — ProveedorConecta Nicaragua

## ⚠️ CRITICAL — Sin estas variables la app FALLA

Agrega estas variables en **Vercel Dashboard** → Tu proyecto → **Settings** → **Environment Variables**:

| Variable | Valor esperado | Dónde obtenerlo |
|----------|---------------|-----------------|
| `TURSO_DATABASE_URL` | `libsql://[tu-db].turso.io` | [Turso Dashboard](https://turso.tech/app) → tu DB → "Show Credentials" |
| `TURSO_AUTH_TOKEN` | `eyJ...` (token largo) | [Turso Dashboard](https://turso.tech/app) → tu DB → "Show Credentials" |
| `NEXT_PUBLIC_APP_URL` | `https://proveedor-conecta-vercel-github.vercel.app` | La URL de tu deploy en Vercel |
| `DATABASE_URL` | `file:./db/custom.db` | Solo para Prisma CLI — pon este valor exacto |

## 🔐 Google OAuth (para login con Google)

| Variable | Dónde obtenerlo |
|----------|-----------------|
| `GOOGLE_CLIENT_ID` | [Google Cloud Console](https://console.cloud.google.com/apis/credentials) |
| `GOOGLE_CLIENT_SECRET` | [Google Cloud Console](https://console.cloud.google.com/apis/credentials) |

> ⚠️ Redirect URI autorizada: `https://TU-DOMINIO.vercel.app/api/auth/google`

## 💳 Stripe (pagos + comisión 3%)

| Variable | Notas |
|----------|-------|
| `STRIPE_SECRET_KEY` | `sk_live_...` o `sk_test_...` |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | `pk_live_...` |
| `STRIPE_PLATFORM_ACCOUNT_ID` | ID de la cuenta Connect (admin: `rey7214935@gmail.com`) |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` |

## 📁 Uploadthing / Vercel Blob (subida de archivos)

| Variable | Dónde obtenerlo |
|----------|-----------------|
| `BLOB_READ_WRITE_TOKEN` | Vercel Dashboard → Storage → Create Blob Store |

## 📡 Pusher (chat en tiempo real)

| Variable |
|----------|
| `PUSHER_APP_ID` |
| `PUSHER_KEY` |
| `PUSHER_SECRET` |
| `PUSHER_CLUSTER` |
| `NEXT_PUBLIC_PUSHER_KEY` |
| `NEXT_PUBLIC_PUSHER_CLUSTER` |

## 📧 Email (Resend)

| Variable |
|----------|
| `RESEND_API_KEY` |

## 🌤️ Clima (opcional — usa Open-Meteo gratis por defecto)

| Variable |
|----------|
| `OPENWEATHER_API_KEY` |

---

## ✅ Pasos para arreglar el error actual

1. **Abre [Vercel Dashboard](https://vercel.com/dashboard)**
2. Selecciona tu proyecto `proveedor-conecta-vercel-github`
3. Ve a **Settings** → **Environment Variables**
4. **Agrega `TURSO_DATABASE_URL` y `TURSO_AUTH_TOKEN`** con los valores reales de Turso
5. Asegúrate de que `NEXT_PUBLIC_APP_URL` tenga la URL correcta
6. Haz clic en **Save**
7. Ve a **Deployments** → haz clic en los 3 puntos `⋯` del último deployment → **Redeploy**
8. Espera a que termine (estado "Ready")
9. Prueba la app — ya debe cargar productos sin errores

---

## 🔍 Verificación post-deploy

Abre la consola del navegador (F12 → Network) y verifica:

- ✅ `/api/products` → Devuelve 200 con array de productos
- ✅ `/api/auth/me` → Devuelve 200 si estás logueado
- ✅ Sin errores `PrismaClientInitializationError`

---

## 📝 Comando para forzar redeploy

```bash
git commit --allow-empty -m "Fix: Configurar variables de entorno Turso en Vercel"
git push origin main
```
