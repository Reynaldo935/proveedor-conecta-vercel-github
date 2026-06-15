# 🚀 ProveedorConecta Nicaragua — Vercel Deployment Guide

This guide walks you through deploying **ProveedorConecta Nicaragua** to Vercel as a single Next.js application. Everything — frontend, API routes, and serverless functions — deploys as **one unit**.

---

## Prerequisites

Before you begin, you need:

| Requirement | Why | Get It |
|---|---|---|
| **GitHub account** | To host your code repository | https://github.com/signup |
| **Vercel account** | To deploy and host the application | https://vercel.com/signup (sign up with GitHub) |
| **Turso account** | Cloud SQLite database for production | https://turso.tech/app (sign up with GitHub) |

> **Cost: $0** — All three services offer generous free tiers that cover this project.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                      Vercel (Serverless)                        │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │              Next.js App (Single Deployment)              │  │
│  │                                                           │  │
│  │  ┌─────────────────┐    ┌──────────────────────────────┐  │  │
│  │  │   Frontend       │    │   API Routes (Serverless)    │  │  │
│  │  │   (React/SSR)    │    │   /api/* → Serverless Fn     │  │  │
│  │  │                   │    │                              │  │  │
│  │  │  • Pages & Layout │    │  • /api/auth/*    → Auth    │  │  │
│  │  │  • Components     │    │  • /api/products  → CRUD    │  │  │
│  │  │  • Client State   │    │  • /api/chat/*    → Chat    │  │  │
│  │  │  • Tailwind CSS   │    │  • /api/payments  → Pay     │  │  │
│  │  │                   │    │  • /api/ai        → AI Bot  │  │  │
│  │  │                   │    │  • /api/cron/*    → Cron    │  │  │
│  │  │                   │    │  • ...65 routes total        │  │  │
│  │  └────────┬──────────┘    └──────────┬───────────────────┘  │  │
│  │           │                          │                      │  │
│  └───────────┼──────────────────────────┼──────────────────────┘  │
│              │                          │                         │
│              │     ┌────────────────────┘                         │
│              │     │                                              │
│              ▼     ▼                                              │
│  ┌────────────────────────┐    ┌────────────────────────────┐    │
│  │   Turso Cloud DB       │    │   External Services         │    │
│  │   (libsql://...)       │    │                             │    │
│  │                        │    │  • Pusher (Real-time Chat)  │    │
│  │   • Users             │    │  • Cloudinary (Images)      │    │
│  │   • Products          │    │  • Vercel Blob (Files)      │    │
│  │   • Transactions      │    │  • Resend (Email)           │    │
│  │   • Chat Messages     │    │  • Z.ai (AI Chatbot)        │    │
│  │   • Commission Logs   │    │  • Open-Meteo (Weather)     │    │
│  │   • Reviews           │    │  • n8n (Automation)         │    │
│  └────────────────────────┘    └────────────────────────────┘    │
│                                                                 │
│  Region: iad1 (US East — low latency to Nicaragua)              │
│  Cron: Daily commission payout at 2:00 AM UTC                   │
└─────────────────────────────────────────────────────────────────┘
```

**Key Point:** This is a **Next.js monolith** — not a separate React frontend + Node.js backend. Vercel automatically converts every file under `src/app/api/*/route.ts` into an individual serverless function. No separate server deployment needed.

---

## Step 1: Fork or Clone the Repository

1. Go to the GitHub repository: `mych336-bli/h2o`
2. Click **Fork** in the top-right corner to create your own copy
3. Alternatively, clone it:
   ```bash
   git clone https://github.com/YOUR_USERNAME/h2o.git
   cd h2o
   ```

---

## Step 2: Create a Turso Cloud Database

Turso provides a free SQLite-compatible cloud database that works perfectly with Vercel's serverless environment (where local file-based SQLite is read-only).

### 2.1 Install the Turso CLI

```bash
curl -sSfL https://get.tur.so/install.sh | bash
```

### 2.2 Sign in and create a database

```bash
# Login with your GitHub account
turso auth login

# Create your database (choose any name)
turso db create proveedor-conecta

# Get the connection URL — save this as TURSO_DATABASE_URL
turso db show proveedor-conecta --url
# Example output: libsql://proveedor-conecta-your-org.turso.io

# Create an auth token — save this as TURSO_AUTH_TOKEN
turso db tokens create proveedor-conecta
# Example output: eyJhbGciOiJF...
```

### 2.3 Apply the database schema

```bash
# Set environment variables temporarily
export TURSO_DATABASE_URL="libsql://proveedor-conecta-your-org.turso.io"
export TURSO_AUTH_TOKEN="eyJhbGciOiJF..."
# For Prisma, combine into DATABASE_URL with authToken
export DATABASE_URL="libsql://proveedor-conecta-your-org.turso.io?authToken=eyJhbGciOiJF..."

# Push the Prisma schema to Turso
npx prisma db push
```

### 2.4 (Optional) Seed with demo data

```bash
bun run prisma/seed-nica.ts
```

> **Important:** Save both `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN` — you'll need them in Step 5.

---

## Step 3: Connect GitHub to Vercel

1. Go to [vercel.com](https://vercel.com) and sign in with your **GitHub account**
2. Click **"Add New..."** → **"Project"**
3. You should see your forked repository in the list
4. If not, click **"Adjust GitHub App Permissions"** to grant Vercel access to the repo
5. Click **"Import"** on the repository

---

## Step 4: Configure Root Directory

After importing, you'll see the **"Configure Project"** screen:

1. **Root Directory** — Set to `.` (dot, meaning the root of the project)
   - Click **"Edit"** next to Root Directory
   - Enter `.` and confirm
   - This is critical: the `package.json`, `next.config.ts`, and `prisma/` folder are all at the root

2. **Framework Preset** — Should auto-detect as **Next.js**. If not, select it manually.

3. **Build and Output Settings** — Leave as default. The `vercel.json` file handles:
   - `installCommand`: `bun install`
   - `buildCommand`: `prisma generate && next build`

> **Do NOT change** the Build Command or Install Command in the Vercel UI — `vercel.json` takes precedence.

---

## Step 5: Add Environment Variables in Vercel Dashboard

On the same "Configure Project" screen, expand **"Environment Variables"** and add the following.

### Required Variables (must add for the app to work)

| Variable | Value | Notes |
|---|---|---|
| `TURSO_DATABASE_URL` | `libsql://proveedor-conecta-your-org.turso.io` | From Step 2 |
| `TURSO_AUTH_TOKEN` | `eyJhbGciOiJF...` | From Step 2 |
| `DATABASE_URL` | `file:./db/custom.db` | Fallback for build phase |
| `NEXTAUTH_SECRET` | *(generate a random string)* | `openssl rand -base64 32` |
| `NEXTAUTH_URL` | `https://your-app.vercel.app` | Your Vercel deployment URL |
| `NEXT_PUBLIC_APP_URL` | `https://your-app.vercel.app` | Same as NEXTAUTH_URL |
| `ADMIN_EMAIL` | `rey7214935@gmail.com` | Admin account email |

### Recommended Variables (for full functionality)

| Variable | Value | Notes |
|---|---|---|
| `NEXT_PUBLIC_PUSHER_KEY` | Your Pusher key | Real-time chat |
| `NEXT_PUBLIC_PUSHER_CLUSTER` | `us2` | Pusher cluster |
| `PUSHER_APP_ID` | Your Pusher app ID | Server-side Pusher |
| `PUSHER_KEY` | Your Pusher key | Server-side Pusher |
| `PUSHER_SECRET` | Your Pusher secret | Server-side Pusher |
| `PUSHER_CLUSTER` | `us2` | Server-side Pusher cluster |
| `RESEND_API_KEY` | Your Resend key | Email notifications |
| `ZAI_API_KEY` | Your Z.ai key | AI chatbot (optional) |
| `NEXT_PUBLIC_N8N_WEBHOOK_URL` | Your n8n webhook | Automation (optional) |
| `CLOUDINARY_CLOUD_NAME` | Your Cloudinary cloud name | Image uploads |
| `CLOUDINARY_API_KEY` | Your Cloudinary API key | Image uploads |
| `CLOUDINARY_API_SECRET` | Your Cloudinary API secret | Image uploads |
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | Your Cloudinary cloud name | Client-side uploads |

### Optional Variables (payment gateways, AI providers, etc.)

See `.env.example` in the repository for the complete list of optional environment variables including:
- Google OAuth (`GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`)
- Google Maps (`NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`)
- Payment gateways (PixelPay, Pagadito, PayPal, Stripe)
- AI providers (OpenAI, Gemini, DeepSeek, Grok)
- Vercel Blob (`BLOB_READ_WRITE_TOKEN` — auto-configured if you enable Blob store)

> **Tip:** Add all variables at once by using the "Bulk Edit" mode in Vercel. Copy-paste from `.env.example`.

---

## Step 6: Deploy

1. After adding all environment variables, click **"Deploy"**
2. Vercel will:
   - Install dependencies (`bun install`)
   - Generate Prisma Client (`prisma generate`)
   - Build the Next.js app (`next build`)
3. Wait 2-3 minutes for the build to complete
4. Once deployed, click **"Visit"** to see your live app 🎉

Your app will be available at: `https://your-project-name.vercel.app`

### Post-Deploy Setup

1. **Enable Vercel Blob** (if you need image uploads):
   - Go to your project → **Storage** → **Create Database**
   - Select **"Blob"** → **Create**
   - This auto-configures `BLOB_READ_WRITE_TOKEN`

2. **Run the setup endpoint** to initialize the database:
   - Visit `https://your-app.vercel.app/api/setup` in your browser
   - This creates the admin user and seed data

3. **Verify cron job** is running:
   - Go to your project → **Settings** → **Cron Jobs**
   - You should see `/api/cron/commission-payout` scheduled daily at 2:00 AM UTC

---

## Step 7: Disable GitHub Pages (Important!)

If your GitHub repository has GitHub Pages enabled, it will conflict with your Vercel deployment.

1. Go to your GitHub repository
2. Click **Settings**
3. In the left sidebar, click **Pages**
4. Under **"Build and deployment"**, set **Source** to **None**
5. Click **Save**

This prevents GitHub from trying to serve a static version of the repo that would interfere with Vercel's routing.

---

## Common Issues and Fixes

### ❌ "Can't reach database server"

**Symptom:** 500 errors on any page that loads data.

**Fix:**
1. Verify `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN` are set in Vercel Dashboard → Settings → Environment Variables
2. Make sure the URL starts with `libsql://` (not `https://`)
3. Redeploy after adding variables: Deployments → ⋯ → Redeploy

---

### ❌ "Prisma Client could not be generated"

**Symptom:** Build fails during `prisma generate`.

**Fix:**
1. Ensure `prisma/schema.prisma` is committed to the repo
2. The `vercel.json` build command runs `prisma generate && next build` — this should handle it
3. If issues persist, add `postinstall` script check in `package.json` (already present: `"postinstall": "prisma generate"`)

---

### ❌ "Authentication failed" or login doesn't work

**Symptom:** Can't log in, session not persisting.

**Fix:**
1. Verify `NEXTAUTH_SECRET` is set (generate with `openssl rand -base64 32`)
2. Verify `NEXTAUTH_URL` matches your deployment URL exactly (including `https://`)
3. If you change the deployment URL, update both `NEXTAUTH_URL` and `NEXT_PUBLIC_APP_URL`

---

### ❌ Real-time chat not working

**Symptom:** Messages don't appear in real-time.

**Fix:**
1. Verify all 6 Pusher environment variables are set correctly
2. Make sure `NEXT_PUBLIC_PUSHER_KEY` and `NEXT_PUBLIC_PUSHER_CLUSTER` are set (the `NEXT_PUBLIC_` prefix makes them available in the browser)
3. Check Pusher dashboard for connection events

---

### ❌ Image uploads fail

**Symptom:** Uploads return errors or images don't display.

**Fix:**
1. Enable **Vercel Blob** in your project's Storage tab, OR
2. Set all 4 Cloudinary variables (`CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`, `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`)
3. Redeploy after adding the variables

---

### ❌ "404 Not Found" on API routes

**Symptom:** Frontend works but API calls return 404.

**Fix:**
1. Check that `src/app/api/*/route.ts` files are committed to the repo
2. Verify Root Directory is set to `.` in Vercel settings
3. Check that `vercel.json` does NOT have any `redirects` or `rewrites` that would interfere with Next.js routing

---

### ❌ Cron job not running

**Symptom:** Commission payouts not processing automatically.

**Fix:**
1. Go to Vercel Dashboard → your project → Settings → Cron Jobs
2. Verify the cron job for `/api/cron/commission-payout` is listed
3. Note: Cron jobs only run on **Production** deployments, not on Preview deployments
4. You can manually test by visiting `https://your-app.vercel.app/api/cron/commission-payout`

---

### ❌ Build succeeds but page shows blank

**Symptom:** Deployment succeeds but the app shows a blank page.

**Fix:**
1. Open browser DevTools → Console for error messages
2. Check if `NEXT_PUBLIC_APP_URL` is set correctly
3. Verify that all `NEXT_PUBLIC_*` variables are set (these are baked into the build at compile time)
4. If you added a `NEXT_PUBLIC_*` variable after the first deploy, you must **redeploy** for it to take effect

---

## Cost Summary

| Service | Free Tier | Notes |
|---|---|---|
| **Vercel** | 100GB bandwidth/mo, unlimited serverless functions | Hobby plan |
| **Turso** | 9GB storage, 1B row reads/mo | Starter plan |
| **Pusher** | 200K messages/day, 100 concurrent connections | Sandbox plan |
| **Resend** | 100 emails/day | Free plan |
| **Cloudinary** | 25GB storage, 25GB bandwidth/mo | Free plan |
| **Vercel Blob** | 250MB storage | Free with Hobby |

**Total monthly cost: $0** for typical development and small-scale production use.

---

## Quick Reference

```bash
# Generate NEXTAUTH_SECRET
openssl rand -base64 32

# Check Vercel deployment logs
vercel logs your-app.vercel.app

# Redeploy after changing env vars
vercel --prod

# Test the commission cron endpoint manually
curl https://your-app.vercel.app/api/cron/commission-payout

# Initialize database
curl https://your-app.vercel.app/api/setup
```
