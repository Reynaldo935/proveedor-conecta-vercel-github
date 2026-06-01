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

<p align="center">
  <a href="#-funcionalidades">Funcionalidades</a> •
  <a href="#-modelo-de-negocio">Modelo de Negocio</a> •
  <a href="#-arquitectura">Arquitectura</a> •
  <a href="#-tech-stack">Tech Stack</a> •
  <a href="#-instalación">Instalación</a> •
  <a href="#-cuentas-demo">Demo</a> •
  <a href="#-despliegue">Despliegue</a>
</p>

---

## 🎯 Visión del Proyecto

**ProveedorConecta Nicaragua** es una plataforma de marketplace integral diseñada específicamente para el ecosistema empresarial nicaragüense. Conecta a proveedores locales con compradores de todo el país, ofreciendo herramientas profesionales de comercio electrónico adaptadas a las necesidades y realidades del mercado nacional.

> 💡 **Problema que resolvemos:** Los proveedores nicaragüenses carecen de una plataforma digital unificada que les permita alcanzar compradores en los 17 departamentos, gestionar pagos con métodos locales y competir en igualdad de condiciones.

> 🚀 **Nuestra solución:** Un marketplace completo con chat en tiempo real, 11 métodos de pago nicaragüenses, clima por departamento, GPS interactivo, sistema de cotizaciones, puntos de lealtad y mucho más — todo en una sola plataforma.

---

## ✨ Funcionalidades

### 🔐 1. Autenticación y Roles
- Registro e inicio de sesión con email/contraseña
- **3 roles de usuario:** `BUYER` (Comprador), `SELLER` (Vendedor), `ADMIN` (Administrador)
- Sesiones seguras basadas en cookies con NextAuth.js v4
- Verificación de email y teléfono
- Soporte para autenticación con Google
- Roles de ayudante: `DEVELOPER`, `MARKETING`, `FULLSTACK`, `GRAPHIC_DESIGN`, `COMMUNICATOR`

### 🛒 2. Marketplace
- Catálogo completo de productos con búsqueda avanzada
- Filtros por categoría, precio, ubicación y más
- Productos destacados y recomendaciones
- Guardar productos favoritos
- Seguir vendedores

### 📦 3. Gestión de Productos
- CRUD completo de productos (crear, leer, actualizar, eliminar)
- **Subida múltiple de imágenes** por producto
- Soporte para videos de productos
- **Descuentos por cantidad:** define rangos de descuento escalonado
- Programación de descuentos con fecha de inicio y fin
- Estados: `ACTIVE`, `PAUSED`, `SOLD`, `DELETED`

### 💬 4. Chat en Tiempo Real
- Mensajería directa entre comprador y vendedor
- **Socket.io** para comunicación instantánea
- Soporte para mensajes de texto, imagen, video, audio y ubicación
- Indicador de lectura de mensajes
- Historial completo de conversaciones

### 🤖 5. Chatbot con IA
- Asistente virtual impulsado por **z-ai-web-dev-sdk**
- Resolución de dudas sobre la plataforma
- Recomendaciones inteligentes de productos
- Disponible 24/7 para todos los usuarios

### 💳 6. Pagos — 11 Métodos Nicaragüenses
| Método | Tipo | Moneda | Comisión |
|--------|------|--------|----------|
| 🅿️ PayPal | Internacional | USD | 3.5% + $0.30 |
| 🏦 Banpro Transferencia | Bancario | NIO/USD | Sin comisión |
| 💳 BAC Credomatic | Bancario | NIO/USD | 3% |
| 🏧 LAFISE | Bancario | NIO/USD | 1.5% |
| 📱 Billetera Móvil | Móvil | NIO | C$5 |
| 🔵 PixelPay | Digital | NIO/USD | 2.5% + C$5 |
| 🟢 Pagadito | Digital | NIO/USD | 2.8% |
| 📲 Google Pay | Digital | USD | Sin comisión |
| 📲 Banpro Billetera | Móvil | NIO/USD | Sin comisión |
| 💰 Kash | Móvil | NIO | 1% |
| 💵 Western Union | Internacional | NIO/USD | Según tarifa |

- **Validación Luhn** para tarjetas de crédito/débito
- Validación de cédula nicaragüense
- Encriptación de datos sensibles de pago
- Generación automática de comprobantes

### 🌤️ 7. Clima — 17 Provincias
- Datos meteorológicos en tiempo real vía **Open-Meteo API**
- Cobertura completa de los 17 departamentos de Nicaragua
- Temperatura, humedad, viento y condiciones actuales
- Actualización automática de datos

### 📍 8. GPS y Mapas
- **Leaflet/Google Maps** para ubicación de proveedores
- Marcadores interactivos por departamento
- Geolocalización de perfiles de negocio
- Visualización de la red de proveedores en el mapa nacional

### ⭐ 9. Sistema de Reseñas
- Calificación con estrellas (1-5)
- Reseñas verificadas (solo tras transacción completada)
- **Votos de utilidad:** "Útil" / "No útil" en cada reseña
- Respuesta del vendedor/comprador a reseñas
- Una reseña por transacción por tipo

### 📊 10. Dashboard Administrativo
- **Admin:** Estadísticas globales, gestión de usuarios, comisiones, anuncios
- **Vendedor:** Analíticas de ventas, productos, ingresos
- **Comprador:** Historial de compras, puntos, actividad
- Gráficos interactivos con **Recharts**
- Módulo de audit log para trazabilidad

### 📥 11. Exportación de Comprobantes
- Descarga de comprobantes en **PDF**, **Word**, **Excel** y **CSV**
- Generación automática al completar transacción
- Formato profesional con datos del comprador, vendedor y producto

### 🏢 12. Perfiles de Negocio
- Página de perfil profesional para cada vendedor
- **Muro de publicaciones:** posts con texto, fotos y videos
- Sistema de **likes** y **comentarios** en publicaciones
- Información de negocio: categoría, horarios, métodos de pago
- Logo y portada personalizables

### 📋 13. Cotizaciones (RFQ)
- Sistema de **Request for Quote** (Solicitud de Cotización)
- Compradores publican necesidades con descripción y categoría
- Vendedores responden con precio, descripción y tiempo de entrega
- Estados: `OPEN`, `CLOSED` / `PENDING`, `ACCEPTED`, `REJECTED`
- Vinculación con productos existentes

### 🎯 14. Sistema de Anuncios
- Planes de publicidad: **Semanal** y **Mensual**
- Creación de anuncios con imagen, título y descripción
- Moderación por administradores
- Estados: `PENDING`, `ACTIVE`, `PAUSED`, `EXPIRED`, `REJECTED`
- Fechas de inicio y fin configurables

### 💰 15. Puntos de Lealtad
- Acumulación de puntos por cada compra
- **4 niveles:** Bronce 🥉, Plata 🥈, Oro 🥇, Diamante 💎
- Canje de puntos por beneficios
- Historial completo de puntos (ganados, canjeados, expirados, bonos)
- Expiración por inactividad (12 meses)

### 📅 16. Calendario y Citas
- Creación de eventos personalizados (reuniones, entregas, reabastecimiento)
- **Sistema de citas** entre comprador y vendedor
- Estados de cita: `PENDING`, `CONFIRMED`, `CANCELLED`, `COMPLETED`
- Duración configurable y notas

### 💵 17. Sistema de Comisiones
- **3% de comisión** automática en cada transacción
- Cálculo transparente: vendedor recibe el 97%
- Registro detallado de todas las comisiones (`CommissionLog`)
- Pista de auditoría completa

### 🔔 18. Notificaciones en Tiempo Real
- Notificaciones instantáneas por: mensajes, cotizaciones, pagos, seguidores, likes
- Indicador de no leídas
- Enlaces directos a la acción relevante
- Sistema escalable por tipo de evento

### 🔄 19. Respaldo y Restauración
- Respaldo completo de la base de datos
- Restauración desde backup
- Protección de datos ante fallos

### 🌙 20. Tema Oscuro/Claro
- Cambio de tema con un clic
- Soporte completo con **next-themes**
- Interfaz adaptada para ambos modos
- Preferencia persistente

---

## 💼 Modelo de Negocio

```
╔══════════════════════════════════════════════════════════════╗
║                    MODELO DE NEGOCIO                        ║
║                                                              ║
║   💰 FUENTE DE INGRESOS PRINCIPAL: 3% de comisión           ║
║                                                              ║
║   ┌─────────────┐    Compra     ┌──────────────────┐        ║
║   │  COMPRADOR  │ ────────────▶ │    PRODUCTO      │        ║
│   │  (Gratis)   │    C$1000     │   C$1,000.00     │        ║
║   └─────────────┘               └────────┬─────────┘        ║
║                                          │                   ║
║                              ┌───────────┼───────────┐       ║
║                              │           │           │       ║
║                              ▼           ▼           ▼       ║
║                     ┌──────────┐  ┌──────────┐ ┌─────────┐  ║
║                     │ VENDEDOR │  │PLATAFORMA│ │ PAGO    │  ║
║                     │  C$970   │  │  C$30    │ │ PROCESO │  ║
║                     │  (97%)   │  │  (3%)    │ │         │  ║
║                     └──────────┘  └──────────┘ └─────────┘  ║
║                                                              ║
║   📢 FUENTES SECUNDARIAS:                                   ║
║   • Anuncios Semanales — Plan de publicidad para vendedores ║
║   • Anuncios Mensuales — Mayor visibilidad en marketplace   ║
║                                                              ║
║   ✅ REGISTRO GRATIS:                                       ║
║   • Compradores: Sin costo, sin comisión                    ║
║   • Vendedores: Sin costo de registro, solo 3% por venta   ║
╚══════════════════════════════════════════════════════════════╝
```

### 📈 Proyección de Ingresos (Ejemplo)

| Escenario | Transacciones/mes | Ticket promedio | Comisión 3% | Ingreso mensual |
|-----------|-------------------|-----------------|-------------|-----------------|
| Conservador | 500 | C$2,000 | C$60 | C$30,000 |
| Moderado | 2,000 | C$3,500 | C$105 | C$210,000 |
| Optimista | 10,000 | C$5,000 | C$150 | C$1,500,000 |

---

## 🏗️ Arquitectura

```
┌─────────────────────────────────────────────────────────────────────┐
│                        PROVEEDOR CONECTA                            │
│                      Arquitectura del Sistema                       │
└─────────────────────────────────────────────────────────────────────┘

  ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
  │   🖥️ Cliente  │     │   📱 Móvil    │     │  🤖 AI Bot   │
  │  Next.js 16   │     │  Responsive  │     │ z-ai-sdk     │
  │  App Router   │     │  Tailwind 4  │     │              │
  └──────┬───────┘     └──────┬───────┘     └──────┬───────┘
         │                    │                     │
         └────────────┬───────┴─────────────────────┘
                      │
         ┌────────────▼────────────┐
         │    🌐 Next.js Server    │
         │    (App Router API)     │
         │                         │
         │  ┌───────────────────┐  │
         │  │   API Routes      │  │
         │  │  /api/auth/*      │  │
         │  │  /api/products/*  │  │
         │  │  /api/transactions│  │
         │  │  /api/chat/*      │  │
         │  │  /api/weather/*   │  │
         │  │  /api/cotizaciones│  │
         │  │  /api/loyalty/*   │  │
         │  │  /api/reviews/*   │  │
         │  │  /api/calendar/*  │  │
         │  │  /api/ads/*       │  │
         │  │  /api/notifications│  │
         │  │  /api/export/*    │  │
         │  └───────────────────┘  │
         └───────┬────────┬────────┘
                 │        │
      ┌──────────▼┐  ┌───▼──────────┐
      │  💾 Base   │  │  🔌 Socket.io │
      │  de Datos  │  │  (Port 3003)  │
      │            │  │               │
      │  ┌──────┐  │  │  • Chat RT    │
      │  │Prisma│  │  │  • Notificac. │
      │  │ ORM  │  │  │  • Eventos    │
      │  └──┬───┘  │  └───────────────┘
      │     │      │
      │  ┌──▼───┐  │
      │  │SQLite│  │     ┌──────────────┐
      │  │Local │  │     │  ☁️ Turso    │
      │  └──────┘  │     │  (Producción)│
      └────────────┘     └──────────────┘
                 │
      ┌──────────▼──────────┐
      │   🔗 APIs Externas   │
      │                      │
      │  • Open-Meteo (Clima)│
      │  • Vercel Blob (IMG) │
      │  • Google Maps (GPS) │
      │  • Leaflet (Maps)    │
      └──────────────────────┘
```

### 🔄 Flujo de Datos Principal

```
Usuario → Next.js Client → API Routes → Prisma ORM → SQLite/Turso
                ↑                                     │
                └────── JSON Response ─────────────────┘

Chat en Tiempo Real:
Usuario A → Socket.io Client → Socket.io Server (Port 3003) → Usuario B
                                          │
                                          └→ Base de Datos (persistencia)

Subida de Imágenes:
Usuario → API Upload → Vercel Blob Storage → URL pública → Base de Datos
```

---

## 🛠️ Tech Stack

| Categoría | Tecnología | Propósito |
|-----------|-----------|-----------|
| **Framework** | ![Next.js](https://img.shields.io/badge/Next.js-16-000000?logo=nextdotjs) | Framework fullstack con App Router |
| **Lenguaje** | ![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white) | Tipado estático y seguridad |
| **Estilos** | ![Tailwind](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss&logoColor=white) | Diseño responsive y utilities |
| **UI** | ![shadcn/ui](https://img.shields.io/badge/shadcn/ui-New_York-000000) | Componentes profesionales |
| **Base de Datos** | ![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?logo=prisma) | ORM type-safe |
| **DB Local** | SQLite | Desarrollo local |
| **DB Producción** | Turso | Base de datos distribuida |
| **Imágenes** | Vercel Blob | Almacenamiento de imágenes en producción |
| **Clima** | Open-Meteo API | Datos meteorológicos en tiempo real |
| **Mapas** | Leaflet + Google Maps | GPS y ubicaciones interactivas |
| **Gráficos** | Recharts | Visualización de datos en dashboard |
| **Tiempo Real** | Socket.io | Chat y notificaciones instantáneas |
| **IA** | z-ai-web-dev-sdk | Chatbot inteligente |
| **Estado** | Zustand + TanStack Query | Estado client + server |
| **Auth** | NextAuth.js v4 | Autenticación segura |
| **Animaciones** | Framer Motion | Transiciones fluidas |
| **Iconos** | Lucide React | Iconografía consistente |

---

## 📸 Capturas de Pantalla

> 📌 *Las capturas serán añadidas durante la demostración en vivo del hackathon*

| Vista | Descripción |
|-------|-------------|
| 🏠 **Home** | Página principal con productos destacados y búsqueda |
| 🛒 **Marketplace** | Catálogo completo con filtros y categorías |
| 📦 **Producto** | Detalle del producto con imágenes, descuentos y vendedor |
| 💬 **Chat** | Mensajería en tiempo real entre comprador y vendedor |
| 📊 **Dashboard Admin** | Estadísticas globales y gestión de plataforma |
| 📊 **Dashboard Vendedor** | Analíticas de ventas y productos |
| 🌤️ **Clima** | Mapa meteorológico de los 17 departamentos |
| 📍 **Mapa GPS** | Ubicación de proveedores en mapa interactivo |
| 📋 **Cotizaciones** | Sistema RFQ con respuestas de vendedores |
| 💰 **Lealtad** | Puntos y niveles de fidelidad |
| 📅 **Calendario** | Eventos y citas programadas |
| 💳 **Pagos** | 11 métodos de pago nicaragüenses |

---

## 🚀 Instalación

### Prerrequisitos

- **Node.js** 18+ o **Bun** (recomendado)
- **Git**

### Pasos de Instalación

```bash
# 1. Clonar el repositorio
git clone https://github.com/tu-usuario/proveedor-conecta-nicaragua.git
cd proveedor-conecta-nicaragua

# 2. Instalar dependencias
bun install

# 3. Configurar variables de entorno
cp .env.example .env
# Editar .env con tus valores (ver sección de Variables de Entorno)

# 4. Inicializar la base de datos
bun run db:push
bun run db:generate

# 5. (Opcional) Ejecutar seed con datos de demostración
bun run prisma/seed.ts

# 6. Iniciar el servidor de desarrollo
bun run dev

# 7. ¡Abrir en el navegador!
# La aplicación estará disponible en http://localhost:3000
```

### Variables de Entorno

Crear un archivo `.env` en la raíz del proyecto:

```env
# ═══ Base de Datos ═══
DATABASE_URL="file:./dev.db"                    # SQLite local (desarrollo)
TURSO_DATABASE_URL="libsql://tu-db.turso.io"    # Turso Cloud (producción)
TURSO_AUTH_TOKEN="tu-turso-auth-token"           # Token de autenticación Turso

# ═══ Aplicación ═══
NEXT_PUBLIC_APP_URL="http://localhost:3000"      # URL de la aplicación

# ═══ Almacenamiento ═══
BLOB_READ_WRITE_TOKEN="vercel_blob_rw_..."       # Vercel Blob (auto-configurado en Vercel)
```

> 💡 **Nota:** Para desarrollo local, solo necesitas `DATABASE_URL`. Las demás variables son para despliegue en producción.

---

## 👤 Cuentas Demo

Probar la plataforma con estas cuentas preconfiguradas:

| Rol | Email | Contraseña | Descripción |
|-----|-------|------------|-------------|
| 👑 **Admin** | `rey7214935@gmail.com` | `Rey7214935` | Acceso completo al dashboard administrativo |
| 🏪 **Vendedor** | `ferreteria@demo.ni` | `demo123` | Perfil de negocio con productos publicados |
| 🛒 **Comprador** | `comprador@demo.ni` | `demo123` | Navegación, compras y cotizaciones |

> 🎮 **Tip:** Inicia sesión como Admin para ver el dashboard completo con estadísticas, gestión de comisiones y moderación de anuncios.

---

## 📦 Estructura del Proyecto

```
proveedor-conecta-nicaragua/
├── 📁 prisma/
│   ├── schema.prisma          # Esquema de la base de datos (22 modelos)
│   └── seed.ts                # Datos iniciales de demostración
├── 📁 src/
│   ├── 📁 app/
│   │   ├── page.tsx           # Página principal (SPA)
│   │   ├── layout.tsx         # Layout raíz con providers
│   │   └── 📁 api/            # API Routes (App Router)
│   │       ├── 📁 auth/       # Autenticación
│   │       ├── 📁 products/   # CRUD de productos
│   │       ├── 📁 transactions/ # Transacciones y pagos
│   │       ├── 📁 chat/       # Chat y salas
│   │       ├── 📁 weather/    # Clima por departamento
│   │       ├── 📁 cotizaciones/ # Sistema RFQ
│   │       ├── 📁 loyalty/    # Puntos de lealtad
│   │       ├── 📁 reviews/    # Reseñas y calificaciones
│   │       ├── 📁 calendar/   # Eventos y citas
│   │       ├── 📁 ads/        # Anuncios publicitarios
│   │       ├── 📁 notifications/ # Notificaciones
│   │       ├── 📁 export/     # Exportación PDF/Word/Excel/CSV
│   │       └── 📁 upload/     # Subida de imágenes
│   ├── 📁 components/
│   │   ├── 📁 ui/             # shadcn/ui componentes
│   │   └── 📁 marketplace/    # Componentes del marketplace
│   ├── 📁 lib/                # Utilidades y configuración
│   └── 📁 stores/             # Zustand stores
├── 📁 mini-services/
│   └── 📁 chat-service/       # Socket.io server (Port 3003)
├── 📁 public/                 # Archivos estáticos
├── 📁 db/                     # Base de datos SQLite local
├── index.html                 # GitHub Pages landing
└── 404.html                   # GitHub Pages SPA routing
```

---

## 🗄️ Modelo de Base de Datos

La plataforma cuenta con **22 modelos** de datos interrelacionados:

```
User ──────────────────────────────────────────────────
  ├── BusinessProfile ── WallPost ── PostLike
  │                                  └─ PostComment
  ├── Product ── QuantityDiscount
  │     ├── Like / SavedProduct
  │     └── ChatRoom ── Message
  ├── Transaction ── CommissionLog
  ├── Cotizacion ── CotizacionResponse
  ├── Notification
  ├── Follow (seguidores)
  ├── Review ── ReviewVote
  ├── LoyaltyPoint / PointHistory
  ├── CalendarEvent
  ├── Appointment
  ├── Advertisement
  └── AuditLog
```

---

## 🌐 Despliegue

### Vercel + Turso (Recomendado — ¡Gratis!)

```bash
# 1. Crear base de datos en Turso
turso db create proveedor-conecta

# 2. Obtener credenciales
turso db show proveedor-conecta --url
turso db tokens create proveedor-conecta

# 3. Desplegar en Vercel
vercel --prod

# 4. Configurar variables de entorno en Vercel Dashboard
#    - TURSO_DATABASE_URL
#    - TURSO_AUTH_TOKEN
#    - BLOB_READ_WRITE_TOKEN (auto-configurado con Vercel Blob)
```

### Costos de Despliegue

| Servicio | Plan | Costo |
|----------|------|-------|
| **Vercel** | Hobby (Free) | $0/mes |
| **Turso** | Starter (Free) | $0/mes — hasta 9GB |
| **Vercel Blob** | Free tier | $0/mes — hasta 250MB |
| **Total** | | **$0/mes** 🎉 |

> 🇳🇮 **¡La plataforma completa puede funcionar sin costo alguno en producción!**

---

## 🇳🇮 Sobre Nicaragua

ProveedorConecta está diseñado específicamente para el mercado nicaragüense, con:

- 🏦 **Métodos de pago locales:** Banpro, BAC, LAFISE, Kash, Billetera Móvil
- 🌤️ **Clima por departamento:** Los 17 departamentos de Nicaragua
- 💱 **Moneda nacional:** Córdoba (NIO) con conversión a USD
- 📍 **Mapa interactivo:** Ubicación de proveedores a nivel nacional
- 📋 **Cotizaciones:** Adaptado al estilo de negociación nicaragüense
- 💵 **Comisiones justas:** 3% competitivo para el mercado centroamericano

---

## 👥 Equipo

| Miembro | Rol | Especialidad |
|---------|-----|-------------|
| 🧑‍💻 Reynaldo | Líder de Desarrollo | Fullstack, Arquitectura |
| 🧑‍💻 Mychael | Desarrollador | Frontend, UI/UX |
| 🧑‍💻 Pedro | Desarrollador | Backend, Base de Datos |
| 🧑‍💻 Apolonio | Desarrollador | APIs, Integraciones |
| 🧑‍💻 Arbela | Diseñadora | Gráficos, Marketing Digital |

---

## 📜 Licencia

Este proyecto fue desarrollado para la **Competencia de Innovación Tecnológica Nicaragua 2026**.

---

<p align="center">
  <strong>🇳🇮 Hecho con ❤️ en Nicaragua</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Hecho%20en-Nicaragua-0B1A2C?style=for-the-badge&labelColor=F4D03F" alt="Hecho en Nicaragua" />
</p>
