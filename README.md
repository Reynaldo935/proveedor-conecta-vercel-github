<p align="center">
  <img src="https://img.shields.io/badge/Nicaragua%20Hackathon-2026-0B1A2C?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiNGNEQwM0YiIHN0cm9rZS13aWR0aD0iMiI+PHBvbHlnb24gcG9pbnRzPSIxMiAyIDE1LjA5IDguMjYgMjIgOS4yNyAxNyAxNC4xNCAxOC4xOCAyMS4wMiAxMiAxNy43NyA1LjgyIDIxLjAyIDcgMTQuMTQgMiA5LjI3IDguOTEgOC4yNiAxMiAyIj48L3BvbHlnb24+PC9zdmc+" alt="Hackathon Nicaragua 2026" />
  <img src="https://img.shields.io/badge/Next.js-16-000000?style=for-the-badge&logo=nextdotjs" alt="Next.js 16" />
  <img src="https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript 5" />
  <img src="https://img.shields.io/badge/Prisma-ORM-2D3748?style=for-the-badge&logo=prisma" alt="Prisma" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white" alt="Tailwind CSS 4" />
</p>

<h1 align="center">
  🇳🇮 ProveedorConecta Nicaragua
</h1>

<p align="center">
  <strong>Plataforma B2B/B2C de Marketplace para conectar proveedores y compradores nicaragüenses</strong>
</p>

<p align="center">
  <em>Competencia de Innovación Tecnológica — Nicaragua 2026</em>
</p>

---

## 🎯 Visión del Proyecto

**ProveedorConecta Nicaragua** es una plataforma de marketplace integral diseñada específicamente para el ecosistema empresarial nicaragüense. Conecta a proveedores locales con compradores de todo el país, ofreciendo herramientas profesionales de comercio electrónico adaptadas a las necesidades y realidades del mercado nacional.

---

## ✨ Funcionalidades

### 🔐 1. Autenticación y Roles (Clerk)
- **Clerk** como proveedor de autenticación externo (Email + Google OAuth)
- **3 roles de usuario:** `BUYER` (Comprador), `SELLER` (Vendedor), `ADMIN` (Administrador)
- Componentes nativos `<SignIn />` y `<SignUp />` en `/sign-in` y `/sign-up`
- Verificación de email automática por Clerk (código al Gmail)
- Admin único: `rey7214935@gmail.com` protegido por middleware
- Sincronización automática Clerk ↔ Turso vía API + Webhooks

### 🛒 2. Marketplace Completo
- Catálogo de productos con imágenes, precios en córdobas (NIO) y descripciones
- **17 categorías**: Construcción y Ferretería, Alimentos y Bebidas, Tecnología y Electrónica, Agricultura y Ganadería, Textil y Calzado, Hogar y Muebles, Energía y Combustible, Deportes y Recreación, Belleza y Cuidado Personal, Transporte y Logística, Salud y Farmacia, Educación y Papelería, Servicios Profesionales, Artesanías y Manualidades, Impresión y Diseño, Otros
- Búsqueda avanzada con filtros por categoría, departamento, rango de precio
- Descuentos por cantidad y ofertas especiales
- Sistema de "me gusta" y productos guardados
- **Productos de proveedores nicaragüenses verificados** con precios actualizados

### 🏢 3. Proveedores Nicaragüenses Verificados
- **60+ proveedores locales**: Flor de Caña (ISA), Casa Pellas, Ferromax, Disagro, AGRICORP, CCN (Coca-Cola, Toña, Victoria), Pollo Tip Top, Doselva, Puratos Nicaragua, Lala Nicaragua, CISA AGRO, PROINCO, Nicanaturals, La Curacao, Brenntag, COMERSA, Café Soluble Exportadora (Café Prestó), Café Toro, Café 1820, Cukra Industrial, Suplidora Internacional, EUROSTAR, Plásticos San Martín, Sol Orgánica, APEN, Agroexport, Exportadora Atlantic, Industrial Comercial San Martín, Shin Han Nicaragua, La Fábrica de Niples, PROAGRO J.R., Servicio Agrícola Gurdian, Grupo Petrop, y más
- Cada proveedor tiene perfil con logo, sitio web oficial, ubicación y productos
- **328 productos** en catálogo con imágenes únicas y datos actualizados
- **Precios en Córdobas (NIO)**: Mecanismo de actualización disponible
- Filtrado por categoría, departamento y búsqueda textual

### 📦 4. Gestión de Productos para Vendedores
- CRUD completo: Crear, Editar, Eliminar, Pausar/Activar productos
- **Multimedia**: Subida de fotos, videos, audio, PDF, Word, Excel, PPT
- Descuentos por cantidad (hasta 5 reglas escalonadas)
- Perfil de vendedor con todos sus productos (estilo Facebook Marketplace)
- Panel "Mis Productos" con filtros de búsqueda y estado

### 👤 5. Perfil de Usuario Mejorado
- Foto de perfil y portada personalizables
- Información personal: nombre, teléfono, ubicación, biografía
- Dirección física con geolocalización
- Datos persistentes entre sesiones
- Perfil público con seguidores y productos

### 💬 6. Chat Multimedia en Tiempo Real
- Mensajes de texto con detección automática de enlaces
- **Multimedia**: Imágenes, videos, audio, archivos (cualquier formato)
- **Ubicación en tiempo real** con GPS
- Indicadores de escritura y estado en línea
- Modo fallback: polling HTTP cuando WebSocket no está disponible
- Pusher + Socket.io para mensajería instantánea

### 💾 7. Sistema de Backup
- **Usuarios**: Exportación de datos personales en JSON/CSV (perfil, productos, transacciones)
- **Admin**: Backup completo de base de datos (15+ tablas) en JSON/CSV
- Metadatos de respaldo: fecha, tamaño, registros, tablas
- Restauración desde backup (para administradores)

### 🌐 8. CDN y Rendimiento
- **Vercel Edge Network**: Distribución global de assets estáticos
- **Cloudflare CDN**: Configurable via DNS proxy
- Optimización de imágenes con AVIF/WebP
- Cache-Control inmutable para assets con hash (1 año)
- Compresión gzip/brotli automática en Vercel

### 🤖 9. Asistente Virtual (Chatbot IA)
- Integración con **n8n webhook** para respuestas inteligentes
- Fallback a API de IA interna (z-ai-web-dev-sdk)
- Fallback local basado en reglas cuando los servicios de IA no están disponibles
- Sugerencias rápidas y contexto de producto automático

### 🤖 4. Asistente Virtual (Chatbot IA)
- Integración con **n8n webhook** para respuestas inteligentes
- Fallback a API de IA interna (z-ai-web-dev-sdk)
- Fallback local basado en reglas cuando los servicios de IA no están disponibles
- Sugerencias rápidas y contexto de producto automático

### 📋 5. Cotizaciones (RFQ)
- Los compradores pueden solicitar cotizaciones describiendo sus necesidades
- Los vendedores envían propuestas con precio y plazo de entrega
- Sistema de estados: PENDING → ACCEPTED → COMPLETED

### 🗺️ 6. Mapa Interactivo
- Mapa con Leaflet + OpenStreetMap/Nominatim
- Geolocalización por GPS del navegador
- Proveedores marcados por departamento
- Filtrado por categoría

### 🌤️ 7. Clima por Departamento
- Datos meteorológicos en tiempo real vía **OpenWeatherMap API**
- Visualización para los 17 departamentos de Nicaragua

### 💰 8. Pagos y Billetera
- **11 métodos de pago nicaragüenses**: Banpro, BAC, LAFISE, Tigo Money, PayPal, PixelPay, Pagadito, Google Pay, Kash, Western Union
- Billetera digital con recarga
- Comisión de plataforma: 3%
- Sistema de comisiones y pagos a vendedores

### ⭐ 9. Reseñas y Lealtad
- Sistema de reseñas y calificaciones para vendedores
- Puntos de lealtad por compras
- Canje de puntos por descuentos

### 📊 10. Panel de Administración
- Dashboard con estadísticas de ventas, usuarios y productos
- Gestión de usuarios y contenido
- Panel de auditoría
- Sistema de anuncios publicitarios

### 📅 11. Calendario y Citas
- Calendario interactivo para programar reuniones con proveedores
- Sistema de citas con confirmación

---

## 🏗️ Arquitectura

```
ProveedorConecta Nicaragua/
├── prisma/                    # Esquema de base de datos (Turso/libSQL)
│   ├── schema.prisma          # Definición del modelo de datos
│   ├── seed.ts                # Datos iniciales
│   └── seed-nica.ts           # Seed específico para Nicaragua
├── public/                    # Archivos estáticos (imágenes, favicon, uploads)
│   ├── uploads/               # Imágenes subidas (productos, avatares, portadas)
│   ├── favicon.svg
│   ├── logo.svg
│   └── robots.txt
├── src/
│   ├── app/
│   │   ├── api/               # API Routes (Serverless Functions para Vercel)
│   │   │   ├── ai/            # Endpoint del chatbot IA
│   │   │   ├── auth/          # Autenticación (login, register, me, google)
│   │   │   ├── products/      # CRUD de productos
│   │   │   ├── weather/       # OpenWeatherMap proxy
│   │   │   ├── search/        # Búsqueda avanzada
│   │   │   ├── cotizacion/    # Cotizaciones RFQ
│   │   │   ├── transactions/  # Transacciones y pagos
│   │   │   ├── chat/          # Salas de chat en tiempo real
│   │   │   ├── reviews/       # Reseñas y calificaciones
│   │   │   ├── notifications/ # Notificaciones
│   │   │   ├── calendar/      # Calendario y citas
│   │   │   ├── admin/         # Panel de administración
│   │   │   ├── loyalty/       # Sistema de lealtad
│   │   │   ├── wall/          # Muro social
│   │   │   ├── appointments/  # Citas
│   │   │   ├── advertisements/# Anuncios publicitarios
│   │   │   ├── audit/         # Auditoría
│   │   │   ├── backup/        # Respaldo de datos
│   │   │   ├── commissions/   # Comisiones
│   │   │   ├── currencies/    # Tasas de cambio
│   │   │   ├── export/        # Exportación de datos
│   │   │   ├── follow/        # Seguir vendedores
│   │   │   ├── likes/         # Me gusta
│   │   │   ├── saved/         # Productos guardados
│   │   │   ├── voucher/       # Vales y comprobantes
│   │   │   └── ...            # Más endpoints
│   │   ├── globals.css        # Estilos globales con Tailwind CSS 4
│   │   ├── layout.tsx         # Layout principal con ThemeProvider
│   │   ├── page.tsx           # Página principal (SPA con Zustand)
│   │   ├── loading.tsx        # Pantalla de carga
│   │   ├── error.tsx          # Pantalla de error
│   │   └── not-found.tsx      # Página 404
│   ├── components/
│   │   ├── ui/                # shadcn/ui (40+ componentes)
│   │   ├── layout/            # Header, Footer, ThemeProvider, ErrorBoundary
│   │   ├── auth/              # Login, Register, Profile, ForgotPassword
│   │   ├── marketplace/       # HomeFeed, ProductDetail, Search, SellProduct
│   │   ├── vendor/            # VendorProfile, VendorDashboard, MyProducts
│   │   ├── chat/              # ChatView, ChatList
│   │   ├── chatbot/           # AIChatbot (n8n webhook + fallback)
│   │   ├── map/               # MapView, LeafletMapInner
│   │   ├── weather/           # WeatherWidget (OpenWeatherMap)
│   │   ├── payments/          # PaymentsView, CheckoutView
│   │   ├── admin/             # AdminPanel
│   │   ├── reviews/           # ReviewsSection
│   │   ├── calendar/          # CalendarView
│   │   ├── cotizacion/        # CotizacionView
│   │   ├── loyalty/           # LoyaltyDashboard
│   │   ├── ads/               # AdBanner, CreateAdForm
│   │   ├── legal/             # TermsPage, PrivacyPage, RefundPage
│   │   ├── audit/             # AuditPanel
│   │   ├── backup/            # BackupView
│   │   ├── downloads/         # DownloadsView
│   │   ├── creators/          # CreatorsDropdown
│   │   └── view-renderer.tsx  # Enrutador SPA central (Zustand currentView)
│   ├── hooks/                 # Custom hooks (use-mobile, useCreators, use-toast)
│   ├── lib/                   # Utilidades y configuración
│   │   ├── auth.ts            # Autenticación JWT
│   │   ├── client-auth.ts     # Auth para el cliente
│   │   ├── db.ts              # Prisma client (Turso/libSQL)
│   │   ├── redis.ts           # Upstash Redis (cache)
│   │   ├── ai-orchestrator.ts # Multi-provider AI (z-ai-web-dev-sdk)
│   │   ├── pusher.ts          # Pusher config (chat en tiempo real)
│   │   ├── payments.ts        # Pasarelas de pago
│   │   ├── email.ts           # Resend (emails transaccionales)
│   │   ├── api-client.ts      # Cliente API con interceptores
│   │   ├── api-utils.ts       # Utilidades de respuesta API
│   │   ├── validators.ts      # Validadores Zod
│   │   ├── security.ts        # Utilidades de seguridad
│   │   ├── audit.ts           # Sistema de auditoría
│   │   └── utils.ts           # Utilidades generales (cn, formateo)
│   ├── store/                 # Estado global (Zustand)
│   │   ├── app-store.ts       # Estado de la app (currentView, navigate)
│   │   ├── auth-store.ts      # Estado de autenticación
│   │   └── chat-store.ts      # Estado del chat
│   ├── types/                 # Definiciones TypeScript
│   ├── data/                  # Datos estáticos (creators.json)
│   ├── middleware.ts          # Middleware (CORS, rate limit, seguridad) [deprecated en Next 16]
├── proxy.ts                   # Next.js 16 Proxy: Clerk Auth + Rate Limit + Seguridad
├── public/
│   └── api/
│       └── supabase-db.php    # Endpoint PHP para Supabase PostgreSQL
├── .env.example               # Variables de entorno (plantilla)
├── .gitignore                 # Archivos excluidos de Git
├── vercel.json                # Configuración de despliegue Vercel
├── next.config.ts             # Configuración de Next.js
├── package.json               # Dependencias y scripts
├── tsconfig.json              # Configuración TypeScript
├── tailwind.config.ts         # Configuración Tailwind CSS
├── postcss.config.mjs         # PostCSS
├── eslint.config.mjs          # ESLint
└── components.json            # shadcn/ui config
```

---

## 🛠️ Tech Stack

| Tecnología | Uso |
|---|---|
| **Next.js 16** | Framework principal (App Router) |
| **TypeScript 5** | Lenguaje de programación |
| **Tailwind CSS 4** | Estilos y diseño responsive |
| **shadcn/ui** | Biblioteca de componentes UI |
| **Prisma ORM** | ORM para base de datos |
| **Turso (libSQL)** | Base de datos PRIMARIA en la nube |
| **Supabase (PostgreSQL)** | Base de datos SECUNDARIA (PHP endpoint) |
| **Clerk** | Autenticación (Email + Google OAuth) |
| **Upstash Redis** | Cache en la nube |
| **Pusher / Socket.io** | Chat en tiempo real |
| **n8n Webhook** | Integración del chatbot IA |
| **z-ai-web-dev-sdk** | SDK de IA multi-provider |
| **OpenWeatherMap** | API de clima en tiempo real |
| **Leaflet + Nominatim** | Mapa interactivo y geocoding |
| **Framer Motion** | Animaciones y transiciones |
| **Zustand** | Estado global del cliente |
| **Zod** | Validación de datos |
| **bcryptjs** | Encriptación (legacy, Clerk maneja auth) |
| **Resend** | Emails transaccionales |
| **Svix** | Verificación de Webhooks de Clerk |
| **PHP** | Endpoint de conexión a Supabase |

---

## �️ Esquema de Base de Datos (Prisma + Turso)

```mermaid
erDiagram
    User ||--o| BusinessProfile : tiene
    User ||--o{ Product : vende
    User ||--o{ Transaction : compra
    User ||--o{ Transaction : vende
    User ||--o{ Message : envia
    User ||--o{ ChatRoom : comprador
    User ||--o{ ChatRoom : vendedor
    User ||--o{ Notification : recibe
    User ||--o{ Like : da
    User ||--o{ SavedProduct : guarda
    User ||--o{ Follow : sigue
    User ||--o{ Review : escribe
    User ||--o{ Review : recibe
    User ||--o{ LoyaltyPoint : acumula
    User ||--o{ Appointment : comprador
    User ||--o{ Appointment : vendedor
    Product ||--o{ Transaction : tiene
    Product ||--o{ Like : recibe
    Product ||--o{ SavedProduct : guardado
    Product ||--o{ QuantityDiscount : descuentos
    BusinessProfile ||--o{ WallPost : publica
    ChatRoom ||--o{ Message : contiene
    Cotizacion ||--o{ CotizacionResponse : recibe
    Transaction ||--o{ CommissionLog : genera
    Review ||--o{ ReviewVote : votos
    User {
        string id PK
        string clerkId UK
        string email UK
        string name
        string role
        float balance
    }
    Product {
        string id PK
        string sellerId FK
        string title
        float price
        string category
    }
    Transaction {
        string id PK
        string buyerId FK
        string sellerId FK
        string productId FK
        float amount
        float commission
        string paymentMethod
    }
```

### 🔄 Control de Versiones

| Versión | Fecha | Cambios |
|---------|-------|---------|
| **v4.0** | Jun 2026 | Proveedores NI verificados (20+), precios dinámicos, backup usuario/admin, CDN Vercel, chat multimedia completo, perfil mejorado, seller CRUD |
| **v3.0** | Jun 2026 | Clerk Auth, Next.js 16 proxy, Supabase secundario |
| **v2.0** | May 2026 | Chat Pusher, Cotizaciones, Lealtad, Reseñas |
| **v1.0** | Abr 2026 | Marketplace base, Turso, Google OAuth manual |

### 📊 Commit Graph (Jun 2026)

```
main    ●──●──●──●──●──●──●──●──●  v4.0 (proveedores NI, backup, CDN, chat)
        │   │   │   │   │   │   │   │
        │   │   │   │   │   │   │   └── fix: marketplace images display
        │   │   │   │   │   │   └────── feat: backup user + admin
        │   │   │   │   │   └────────── feat: chat multimedia + links
        │   │   │   │   └────────────── feat: CDN & performance config
        │   │   │   └────────────────── feat: seller profile + my-products
        │   │   └────────────────────── feat: 20+ NI suppliers + prices
        │   └────────────────────────── feat: Clerk auth + webhooks
        └────────────────────────────── Initial: marketplace base
```

---

## �🚀 Despliegue en Vercel

### Prerrequisitos
1. Cuenta en [Vercel](https://vercel.com)
2. Cuenta en [GitHub](https://github.com)
3. Base de datos Turso activa con URL y token
4. (Opcional) n8n Cloud o self-hosted para el chatbot

### Paso 1: Subir el proyecto a GitHub

```bash
# Inicializar repositorio (si no existe)
git init
git add .
git commit -m "Initial commit: ProveedorConecta Nicaragua"

# Conectar con GitHub
git remote add origin https://github.com/TU_USUARIO/proveedorconecta-nicaragua.git
git branch -M main
git push -u origin main
```

### Paso 2: Conectar con Vercel

1. Ve a [vercel.com/new](https://vercel.com/new)
2. Haz clic en **"Import Git Repository"**
3. Selecciona tu repositorio de GitHub
4. **Configuración importante en Vercel:**
   - **Framework Preset**: Next.js (se detecta automáticamente)
   - **Root Directory**: `./` (dejar vacío, la raíz es el proyecto)
   - **Build Command**: Se usa el de `vercel.json` (`prisma generate && next build`)
   - **Output Directory**: Se detecta automáticamente (`.next`)

### Paso 3: Configurar Variables de Entorno

En el panel de Vercel, ve a **Settings → Environment Variables** y agrega:

```env
# Base de datos PRIMARIA - Turso (OBLIGATORIO)
TURSO_DATABASE_URL=libsql://tu-db-nombre.turso.io
TURSO_AUTH_TOKEN=tu-token
DATABASE_URL=file:./db/custom.db

# Clerk Authentication (OBLIGATORIO)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxxxxxxxx
CLERK_SECRET_KEY=sk_test_xxxxxxxxx
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/

# Supabase PostgreSQL (SECUNDARIO)
SUPABASE_URL=https://xxxxxxxxx.supabase.co
SUPABASE_DB=postgresql://postgres:password@db.xxxxxxxxx.supabase.co:5432/postgres

# App URL
NEXT_PUBLIC_APP_URL=https://proveedor-conecta-vercel-github.vercel.app
ADMIN_EMAIL=rey7214935@gmail.com

# OpenWeatherMap (para el widget de clima)
OPENWEATHERMAP_API_KEY=tu-api-key

# n8n Webhook (para el chatbot IA)
NEXT_PUBLIC_N8N_WEBHOOK_URL=https://tu-n8n-instance.com/webhook/proveedorconecta

# Pusher (para chat en tiempo real)
PUSHER_APP_ID=tu-app-id
PUSHER_KEY=tu-key
PUSHER_SECRET=tu-secret
PUSHER_CLUSTER=us2
NEXT_PUBLIC_PUSHER_KEY=tu-key
NEXT_PUBLIC_PUSHER_CLUSTER=us2

# Upstash Redis (para cache)
UPSTASH_REDIS_REST_URL=https://tu-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=tu-token

# Resend (para emails)
RESEND_API_KEY=re_xxxxx

# Google OAuth (opcional)
GOOGLE_CLIENT_ID=tu-client-id
GOOGLE_CLIENT_SECRET=tu-client-secret
```

### Paso 4: Desplegar

```bash
# Desde el panel de Vercel, haz clic en "Deploy"
# O desde la terminal:
npx vercel --prod
```

### Paso 5: Verificar el despliegue

1. Vercel te dará una URL como `https://tu-proyecto.vercel.app`
2. Verifica que la página principal carga correctamente
3. Verifica que los APIs responden: `https://tu-proyecto.vercel.app/api/products`
4. Verifica que el clima funciona: `https://tu-proyecto.vercel.app/api/weather`
5. Verifica CORS: Los headers `Access-Control-Allow-Origin` deben estar presentes

---

## 💻 Instalación Local

```bash
# Clonar repositorio
git clone https://github.com/TU_USUARIO/proveedorconecta-nicaragua.git
cd proveedorconecta-nicaragua

# Instalar dependencias
bun install

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tus valores reales

# Generar cliente Prisma
bun run db:generate

# Sincronizar esquema con la base de datos
bun run db:push

# (Opcional) Cargar datos de ejemplo
bun run db:seed

# Iniciar servidor de desarrollo
bun run dev
```

La aplicación se ejecuta en `http://localhost:3000`

---

## 🤖 Configuración del Chatbot con n8n

El chatbot está configurado para usar un **webhook de n8n** como proveedor principal de IA, con fallback a la API interna.

### Flujo del chatbot:

1. **Primero** intenta enviar el mensaje al webhook de n8n (si `NEXT_PUBLIC_N8N_WEBHOOK_URL` está configurado)
2. **Segundo** intenta la API interna `/api/ai` que usa el SDK de z-ai-web-dev-sdk
3. **Tercero** usa respuestas locales basadas en reglas (siempre disponibles, sin dependencias externas)

### Configurar n8n:

1. Crea un workflow en n8n con un nodo **Webhook**
2. Configura el método HTTP como **POST**
3. El webhook recibirá un JSON con:
   ```json
   {
     "message": "mensaje del usuario",
     "sessionId": "id-del-usuario",
     "userName": "nombre del usuario",
     "conversationHistory": [...],
     "source": "proveedorconecta-chatbot"
   }
   ```
4. El webhook debe responder con:
   ```json
   {
     "response": "respuesta del asistente"
   }
   ```
5. Configura la URL del webhook en Vercel:
   - Variable: `NEXT_PUBLIC_N8N_WEBHOOK_URL`
   - Valor: `https://tu-instancia-n8n.com/webhook/tu-path`

### Workflows de referencia:
Puedes encontrar workflows de ejemplo en: [n8n-workflows](https://zie619.github.io/n8n-workflows/)

---

## 🔧 Solución de Problemas

### Error: "Prisma generate fails on Vercel"
- Verifica que `DATABASE_URL` esté configurada en las variables de entorno de Vercel
- La URL debe ser una conexión válida de Turso: `libsql://...turso.io?authToken=...`

### Error: "404 en GitHub Pages"
- Este proyecto usa **Vercel** como plataforma de despliegue, NO GitHub Pages
- Si tienes GitHub Pages habilitado, desactívalo: Repository → Settings → Pages → Source: "None"
- Asegúrate de NO tener un archivo `index.html` en la raíz del repositorio

### Error: "CORS blocking API requests"
- Verifica que `NEXT_PUBLIC_APP_URL` esté configurada con la URL de tu app en Vercel
- El middleware maneja CORS automáticamente basándose en las variables de entorno

### Error: "Chatbot no responde"
- Verifica que `NEXT_PUBLIC_N8N_WEBHOOK_URL` sea una URL válida y accesible
- Si no tienes n8n configurado, el chatbot usará la API interna o respuestas locales

---

## 📋 Cuentas Demo

| Rol | Email | Contraseña |
|---|---|---|
| Admin | admin@proveedorconecta.com | admin123 |
| Vendedor | vendedor@ejemplo.com | vendedor123 |
| Comprador | comprador@ejemplo.com | comprador123 |

---

## � Sistema de Backup

### Backup de Usuario
- **Endpoint**: `GET /api/export/my-data?format=json|csv&scope=all|profile|products|transactions`
- El usuario autenticado puede descargar sus datos personales
- Formatos: JSON (estructurado) o CSV (hoja de cálculo)
- Incluye: perfil, productos, transacciones, guardados, seguidos

### Backup Administrativo
- **Endpoint**: `POST /api/export/admin-backup` (solo admin)
- Backup completo de 15+ tablas en JSON o CSV
- Registro de auditoría por cada backup creado
- Metadatos: fecha, tamaño, número de registros, tablas incluidas

### Cron de Respaldo
- Se puede programar un cron job en Vercel para backups automáticos
- Configurar en `vercel.json`:
```json
{
  "crons": [
    { "path": "/api/cron/refresh-prices", "schedule": "0 4 * * *" }
  ]
}
```

---

## 🌐 CDN y Rendimiento

### Vercel Edge Network (Automático)
- **Activado por defecto** en todos los deployments de Vercel
- Edge caching de assets estáticos (`/_next/static/*`) con 1 año de caché
- Imágenes optimizadas automáticamente (AVIF/WebP) con `next/image`
- Compresión Brotli/Gzip automática

### Cloudflare CDN (Opcional)
1. Agrega tu dominio a Cloudflare
2. Apunta los DNS a Vercel (`cname.vercel-dns.com`)
3. Activa el proxy naranja de Cloudflare
4. Configura reglas de caché para `/uploads/*` y assets estáticos

### Headers de Caché (configurados en `next.config.ts`)
- `/_next/static/*` → 1 año inmutable
- `/uploads/*` → 7 días
- `/api/*` → no-store (datos dinámicos)

---

## 💰 Lógica de Comisión 3%

Cada transacción en ProveedorConecta aplica una comisión del 3%:

```
Transaction.amount = precio × cantidad
Transaction.commission = Transaction.amount × 0.03
Transaction.sellerPayout = Transaction.amount × 0.97
```

La comisión se registra en la tabla `CommissionLog`:
- `destination`: `rey7214935@gmail.com` (cuenta admin)
- `bank`: `LAFISE` (por defecto)
- Estados: `PENDING` → `PAID`

El cron job `/api/cron/commission-payout` procesa comisiones pendientes cada 24h (2:00 AM).

---

## 🗄️ Esquema Relacional de Base de Datos

### Tablas Principales (26 tablas)

| Tabla | Descripción | Relaciones Clave |
|-------|-------------|------------------|
| **User** | Usuarios (BUYER, SELLER, ADMIN) | FK a sí mismo (follows) |
| **BusinessProfile** | Perfil de negocio del vendedor | FK → User (1:1) |
| **Product** | Productos del marketplace | FK → User (sellerId) |
| **Transaction** | Transacciones de compra/venta | FK → User (buyerId, sellerId), FK → Product |
| **Message** | Mensajes del chat | FK → ChatRoom, FK → User (senderId) |
| **ChatRoom** | Salas de chat | FK → User (buyerId, sellerId), FK → Product |
| **Cotizacion** | Solicitudes de cotización (RFQ) | FK → User (buyerId) |
| **CotizacionResponse** | Respuestas a cotizaciones | FK → Cotizacion, User, Product |
| **Notification** | Notificaciones push | FK → User |
| **Follow** | Seguidores (user-to-user) | FK → User (followerId, followingId) |
| **Like** | Likes en productos | FK → User, Product |
| **SavedProduct** | Productos guardados | FK → User, Product |
| **AuditLog** | Registro de actividad | FK → User |
| **CommissionLog** | Registro de comisiones 3% | FK → Transaction |
| **Review** | Reseñas y calificaciones | FK → User (reviewer, reviewed) |
| **LoyaltyPoint** | Puntos de lealtad | FK → User |
| **Advertisement** | Anuncios publicitarios | FK → User (sellerId) |
| **QuantityDiscount** | Descuentos por cantidad | FK → Product |
| **WallPost** | Publicaciones en muro | FK → BusinessProfile |
| **CalendarEvent** | Eventos del calendario | FK → User |
| **Appointment** | Citas entre usuarios | FK → User (buyer, seller) |

### Diagrama de Relaciones (Texto)

```
┌──────────┐       ┌──────────────────┐       ┌──────────┐
│   User   │1────1│ BusinessProfile  │       │ Product  │
│  (id)    │       │  (userId FK)     │       │  (id)    │
└────┬─────┘       └──────────────────┘       └────┬─────┘
     │                                             │
     │ 1──M Product (sellerId)                     │ 1──M Transaction
     │ 1──M Transaction (buyerId)                  │ 1──M Like
     │ 1──M Transaction (sellerId)                 │ 1──M SavedProduct
     │ 1──M Message (senderId)                     │ 1──M ChatRoom
     │ 1──M ChatRoom (buyerId)                     │ 1──M QuantityDiscount
     │ 1──M ChatRoom (sellerId)                    │
     │ 1──M Notification                           │
     │ 1──M Follow (followerId)        ┌───────────┴──────────┐
     │ 1──M Follow (followingId)       │     ChatRoom         │
     │ 1──M Review (givenRatings)      │      (id)            │
     │ 1──M Review (receivedRatings)   └──────┬───────────────┘
     │ 1──M LoyaltyPoint                      │
     │ 1──M AuditLog                           │ 1──M Message
     │ 1──M Advertisement                      │
     │                                         │
     └── 1──M Cotizacion                       │
          │ 1──M CotizacionResponse            │
          │                                    │
┌─────────┴──────────┐              ┌──────────┴──────────┐
│   Transaction      │              │   CommissionLog     │
│   (id)             │1────1────────│   (transactionId)   │
└────────────────────┘              └─────────────────────┘
```

### Índices de Rendimiento
- `Product`: sellerId, status, category, isFeatured, price, createdAt
- `Transaction`: buyerId, sellerId, productId, status, createdAt
- `Message`: chatRoomId, senderId, createdAt, isRead
- `ChatRoom`: buyerId, sellerId, lastMessageAt
- `Notification`: userId, isRead, createdAt

---

## 🗄️ Arquitectura de Bases de Datos

ProveedorConecta utiliza **4 bases de datos** en paralelo, cada una con un propósito específico:

### 1. Turso (libSQL) — Base de Datos PRIMARIA

```
Tipo:      SQLite distribuido (libSQL)
ORM:       Prisma
Hosting:   Turso Cloud (edge)
Ubicación: Global (replicado en múltiples regiones)
```

**Propósito**: Almacenamiento principal de la aplicación. Contiene todas las tablas del marketplace: usuarios, productos, transacciones, chat, notificaciones, reseñas, etc.

**Conexión**:
```env
TURSO_DATABASE_URL=libsql://proveedor-conecta.turso.io
TURSO_AUTH_TOKEN=tu-token
```

**Tablas principales**: User, Product, Transaction, Message, ChatRoom, Notification, BusinessProfile, Follow, Like, SavedProduct, Review, LoyaltyPoint, AuditLog, CommissionLog, Advertisement, QuantityDiscount, WallPost, CalendarEvent, Appointment, Cotizacion, CotizacionResponse

**Nota**: En Vercel, Turso ocasionalmente no está disponible. Por eso el catálogo de productos usa un fallback estático (`MEGA_CATALOG`) con 328 productos precargados.

### 2. Supabase (PostgreSQL) — Base de Datos SECUNDARIA

```
Tipo:      PostgreSQL relacional
Hosting:   Supabase Cloud
Ubicación: AWS us-east-1
```

**Propósito**: Respaldo y consultas analíticas. Conexión vía PHP endpoint (`public/api/supabase-db.php`).

**Diagrama Relacional (PostgreSQL)**:

```mermaid
erDiagram
    users ||--o{ products : "vende (seller_id)"
    users ||--o{ transactions : "compra (buyer_id)"
    users ||--o{ transactions : "vende (seller_id)"
    users ||--o{ messages : "envía"
    users ||--o{ chat_rooms : "participa"
    users ||--o{ notifications : "recibe"
    users ||--o{ reviews : "escribe"
    users ||--o{ reviews : "recibe"
    
    products ||--o{ transactions : "tiene"
    products ||--o{ likes : "recibe"
    products ||--o{ saved_products : "guardado"
    products ||--o{ quantity_discounts : "descuentos"
    
    chat_rooms ||--o{ messages : "contiene"
    transactions ||--o{ commission_logs : "genera"
    
    users {
        uuid id PK
        varchar clerk_id UK
        varchar email UK
        varchar name
        varchar role
        decimal balance
        timestamp created_at
    }
    
    products {
        uuid id PK
        uuid seller_id FK
        varchar title
        text description
        decimal price
        varchar category
        varchar status
        boolean is_featured
        timestamp created_at
    }
    
    transactions {
        uuid id PK
        uuid buyer_id FK
        uuid seller_id FK
        uuid product_id FK
        decimal amount
        decimal commission
        varchar payment_method
        varchar status
        timestamp created_at
    }
```

**Conexión**:
```env
SUPABASE_URL=https://xxxxxxxxx.supabase.co
SUPABASE_DB=postgresql://postgres:password@db.xxxxxxxxx.supabase.co:5432/postgres
```

### 3. Clerk — Base de Datos de Autenticación

```
Tipo:      SaaS (managed auth database)
Hosting:   Clerk Cloud
```

**Propósito**: Gestión completa de usuarios (registro, login, verificación de email, OAuth). Clerk mantiene su propia base de datos con:
- Usuarios (email, contraseña hasheada, Google OAuth tokens)
- Sesiones (JWT tokens, refresh tokens)
- Verificación de email (códigos OTP)
- Webhooks para sincronizar con Turso

**Flujo de sincronización**:
```
Usuario se registra en Clerk
    ↓
Clerk webhook → POST /api/webhooks/clerk
    ↓
Sincroniza usuario en Turso (crea/actualiza)
    ↓
Usuario puede usar la plataforma inmediatamente
```

### 4. Upstash Redis — Cache

```
Tipo:      Redis serverless
Hosting:   Upstash Cloud
```

**Propósito**: Cache de sesiones, rate limiting, y datos frecuentes (productos destacados, clima).

### 📊 Comparación de Bases de Datos

| Característica | Turso (libSQL) | Supabase (PostgreSQL) | Clerk | Upstash Redis |
|---|---|---|---|---|
| **Tipo** | SQLite distribuido | PostgreSQL relacional | SaaS Auth | Redis |
| **Uso principal** | Datos de la app | Backup/analíticas | Autenticación | Cache |
| **Consultas SQL** | ✅ Completo | ✅ Completo | ❌ API propia | ❌ NoSQL |
| **Relaciones** | ✅ FK, índices | ✅ FK, índices, triggers | N/A | N/A |
| **Latencia** | Baja (edge) | Media (us-east-1) | Baja | Muy baja |
| **Disponibilidad** | ⚠️ Variable en Vercel | ✅ Alta | ✅ Alta | ✅ Alta |

---

## �📋 Control de Versiones y Changelog

### Versión Actual: v4.1.0 (Junio 2026)

| Versión | Fecha | Cambios | Commit |
|---|---|---|---|
| **v4.1.0** | 30 Jun 2026 | 328 productos, 60+ proveedores NI, imágenes únicas picsum, upload base64, fotos equipo restauradas | `37570c8` |
| **v4.0.0** | 29 Jun 2026 | 68 proveedores nicaragüenses reales, backup user/admin, CDN Vercel, chat multimedia, perfil mejorado, seller CRUD | `2bde447` |
| **v3.0.0** | 28 Jun 2026 | Clerk Auth completo, Next.js 16 proxy, Supabase secundario, fallback estático para DB | `624250f` |
| **v2.0.0** | May 2026 | Chat Pusher/Socket.io, Cotizaciones RFQ, Lealtad, Reseñas, Panel Admin | — |
| **v1.0.0** | Abr 2026 | Marketplace base, Turso, Google OAuth manual, productos iniciales | — |

### 📊 Historial de Commits Recientes

```
37570c8 (HEAD -> main) fix: fotos del equipo movidas a public/equipo/
495ce7e fix: restaurar fotos del equipo - .vercelignore
756e691 fix: upload de fotos sin Vercel Blob - usa base64
9f29f75 fix: 328 imagenes UNICAS via picsum
2bde447 feat: 68 productos reales de 30+ proveedores nicaraguenses
6743314 fix: fallback products con Lorem Flickr
d596d1c fix: Lorem Flickr keywords individuales sin espacios
fa6b0b0 fix: Lorem Flickr solo palabras inglesas seguras
33df415 fix: placehold.co product-name images
866d1eb feat: 260+ productos en 16 categorias
624250f feat: HomeFeed 50 productos + fallback
```

### 🔄 Flujo de Git

```
main (producción)
  │
  ├── Cada commit → Vercel auto-deploy
  │
  └── npx vercel --prod --yes (deploy manual urgente)
```

---

## 📄 Licencia

Este proyecto es privado y confidencial. Todos los derechos reservados.

---

<p align="center">
  Hecho con ❤️ en Nicaragua 🇳🇮
</p>
