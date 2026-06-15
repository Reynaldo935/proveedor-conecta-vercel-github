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

### 🔐 1. Autenticación y Roles
- Registro e inicio de sesión con email/contraseña
- **3 roles de usuario:** `BUYER` (Comprador), `SELLER` (Vendedor), `ADMIN` (Administrador)
- Sesiones seguras basadas en cookies con JWT + bcryptjs
- Verificación de email y teléfono
- Soporte para autenticación con Google OAuth

### 🛒 2. Marketplace Completo
- Catálogo de productos con imágenes, precios en córdobas (NIO) y descripciones
- **17 categorías**: Ferretería, Agropecuaria, Tecnología, Construcción, Alimentos, Textiles, Automotriz, Energía Solar, Industrial y más
- Búsqueda avanzada con filtros por categoría, departamento, rango de precio
- Descuentos por cantidad y ofertas especiales
- Sistema de "me gusta" y productos guardados

### 💬 3. Chat en Tiempo Real
- Comunicación directa entre compradores y vendedores vía Pusher/Socket.io
- Salas de chat privadas por producto o consulta
- Notificaciones en tiempo real

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
│   └── middleware.ts          # Middleware (CORS, rate limit, seguridad)
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
| **Turso (libSQL)** | Base de datos en la nube |
| **Upstash Redis** | Cache en la nube |
| **Pusher / Socket.io** | Chat en tiempo real |
| **n8n Webhook** | Integración del chatbot IA |
| **z-ai-web-dev-sdk** | SDK de IA multi-provider |
| **OpenWeatherMap** | API de clima en tiempo real |
| **Leaflet + Nominatim** | Mapa interactivo y geocoding |
| **Framer Motion** | Animaciones y transiciones |
| **Zustand** | Estado global del cliente |
| **Zod** | Validación de datos |
| **bcryptjs** | Encriptación de contraseñas |
| **Resend** | Emails transaccionales |

---

## 🚀 Despliegue en Vercel

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
# Base de datos (OBLIGATORIO para que prisma generate funcione)
DATABASE_URL=libsql://tu-db-nombre.turso.io?authToken=tu-token

# Autenticación
JWT_SECRET=tu-secreto-jwt-super-seguro
NEXTAUTH_SECRET=tu-secreto-nextauth

# App URL (para CORS)
NEXT_PUBLIC_APP_URL=https://tu-proyecto.vercel.app

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

## 📄 Licencia

Este proyecto es privado y confidencial. Todos los derechos reservados.

---

<p align="center">
  Hecho con ❤️ en Nicaragua 🇳🇮
</p>
