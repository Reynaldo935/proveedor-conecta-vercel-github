# ⚙️ VERCEL DEPLOY CONFIGURATION — ProveedorConecta Nicaragua

> Copy-paste ready. Every setting, every env var, every click documented.

---

## 1. VERCEL PROJECT SETUP

```
1. Go to https://vercel.com/new
2. Import: Reynaldo935/proveedor-conecta
3. Framework: Next.js (auto-detected)
4. Root Directory: ./
```

### Build Settings (leave default — vercel.json handles it)

| Setting | Value | Source |
|---------|-------|--------|
| Build Command | `prisma generate && next build` | `package.json` → `vercel.json` |
| Install Command | `npm install` | `vercel.json` |
| Output Directory | `.next` | `vercel.json` |
| Development Command | `next dev -p 3000` | `package.json` |

---

## 2. ENVIRONMENT VARIABLES (Vercel Dashboard)

Go to: Project → Settings → Environment Variables → **Bulk Edit** (paste all at once)

### 🔴 REQUIRED (app won't work without these)

```env
# Database (Turso Cloud)
TURSO_DATABASE_URL=libsql://proveedor-conecta-your-org.turso.io
TURSO_AUTH_TOKEN=eyJhbGciOiJF...your-token-here

# Auth (NextAuth.js)
NEXTAUTH_SECRET=random-32-char-string-generate-with-openssl
NEXTAUTH_URL=https://proveedor-conecta.vercel.app
NEXT_PUBLIC_APP_URL=https://proveedor-conecta.vercel.app

# Admin
ADMIN_EMAIL=rey7214935@gmail.com

# Database fallback for build phase
DATABASE_URL=file:./db/custom.db
```

### 🟡 RECOMMENDED (for full functionality)

```env
# Pusher (Real-time Chat)
PUSHER_APP_ID=your-pusher-app-id
PUSHER_KEY=your-pusher-key
PUSHER_SECRET=your-pusher-secret
PUSHER_CLUSTER=us2
NEXT_PUBLIC_PUSHER_KEY=your-pusher-key
NEXT_PUBLIC_PUSHER_CLUSTER=us2

# Email (Resend)
RESEND_API_KEY=your-resend-api-key

# Uploads (Cloudinary or Vercel Blob)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your-cloud-name

# AI Chatbot
ZAI_API_KEY=your-zai-api-key
```

### 🟢 OPTIONAL (payment gateways, maps, OAuth)

```env
# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Google Maps
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your-maps-api-key

# Payment Gateways
PIXELPAY_API_KEY=your-pixelpay-key
PIXELPAY_SECRET=your-pixelpay-secret
PAYPAL_CLIENT_ID=your-paypal-client-id
PAYPAL_CLIENT_SECRET=your-paypal-client-secret
STRIPE_SECRET_KEY=your-stripe-secret
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your-stripe-pub-key

# AI Providers (multi-provider fallback)
OPENAI_API_KEY=your-openai-key
DEEPSEEK_API_KEY=your-deepseek-key
GEMINI_API_KEY=your-gemini-key

# Weather
OPENWEATHER_API_KEY=your-weather-key
```

---

## 3. AFTER DEPLOY

### Verify deployment

```bash
# Health check
curl https://proveedor-conecta.vercel.app/api

# Check database setup
curl https://proveedor-conecta.vercel.app/api/setup

# Test cron job
curl https://proveedor-conecta.vercel.app/api/cron/commission-payout
```

### Enable Vercel Blob (optional, for file uploads)

```
Project → Storage → Create Database → Blob → Create
(Auto-configures BLOB_READ_WRITE_TOKEN)
```

---

## 4. TROUBLESHOOTING

| Symptom | Check |
|---------|-------|
| Build fails | Verify `TURSO_DATABASE_URL` + `TURSO_AUTH_TOKEN` set |
| Blank page | `NEXT_PUBLIC_APP_URL` must match deployment URL exactly |
| Login fails | `NEXTAUTH_SECRET` + `NEXTAUTH_URL` must be set |
| Chat broken | All 6 Pusher vars required |
| Upload fails | Enable Blob OR set Cloudinary vars |
| 404 on API | Root Directory must be `./` in Vercel settings |

---

## 5. CI/CD PIPELINE

```
Git Push (main) → GitHub Actions (build check) → Vercel (auto-deploy)
```

- GitHub Actions: `.github/workflows/deploy.yml` (Node.js 20, npm ci)
- Vercel: Automatic deploy on push to `main`
- Preview deployments: Automatic on Pull Requests

---

> 📖 Full docs: `DEPLOY.md` | `.env.example` | `vercel.json`
