<p align="center">
  <img src="https://img.shields.io/badge/Nicaragua%20Hackathon-2026-0B1A2C?style=for-the-badge" />
  <img src="https://img.shields.io/badge/Next.js-16-000000?style=for-the-badge&logo=nextdotjs" />
  <img src="https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white" />
  <img src="https://img.shields.io/badge/Prisma-ORM-2D3748?style=for-the-badge&logo=prisma" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white" />
  <img src="https://img.shields.io/badge/Vercel-Prod-000000?style=for-the-badge&logo=vercel" />
  <img src="https://img.shields.io/badge/Clerk-Auth-6C47FF?style=for-the-badge&logo=clerk" />
  <img src="https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?style=for-the-badge&logo=supabase" />
  <img src="https://img.shields.io/badge/Turso-libSQL-4B9CD3?style=for-the-badge&logo=sqlite" />
  <img src="https://img.shields.io/badge/Admin_UNICO-rey7214935@gmail.com-E74C3C?style=for-the-badge" />
</p>

<h1 align="center">🇳🇮 ProveedorConecta Nicaragua</h1>
<p align="center"><strong>Marketplace B2B/B2C para MIPYMES nicaragüenses</strong><br><em>Hackathon Nicaragua 2026 · 10ª Edición</em></p>
<p align="center">
  <a href="https://proveedor-conecta-vercel-github.vercel.app">🌐 Demo en Vivo</a> ·
  <a href="https://github.com/Reynaldo935/proveedor-conecta">📂 GitHub</a>
</p>

---

## 🎯 Objetivo del Proyecto

**ProveedorConecta Nicaragua** conecta proveedores locales con compradores de todo el país, ofreciendo herramientas profesionales de e-commerce adaptadas a Nicaragua.

1. **Conectar** proveedores con compradores en un marketplace digital
2. **Digitalizar** el comercio B2B/B2C nicaragüense
3. **Empoderar** MIPYMES con herramientas profesionales
4. **Facilitar** transacciones con 11 métodos de pago locales
5. **Experiencia** similar a Facebook Marketplace + Alibaba + Amazon, 100% nicaragüense

---

## 🧪 Perfiles de Prueba

> ⚠️ **ADMINISTRADOR ÚNICO:** Solo existe UN administrador en el sistema: `rey7214935@gmail.com`. Este usuario tiene acceso COMPLETO a todo el panel de administración, auditoría, backup, y puede ver TODOS los usuarios registrados.

| Rol | Email | Contraseña | Permisos |
|---|---|---|---|
| 👑 **ADMIN UNICO** | `rey7214935@gmail.com` | `El_jefe07` | 🔓 TODO: Panel Admin, Auditoría, Backup, Ver TODOS los usuarios, Gestionar anuncios, Exportar datos |
| 🏪 **Vendedor** | `losmunguias007@gmail.com` | `Yamoshi2007..` | 🏪 Publicar productos, Dashboard Ventas P&L, Catálogo en "Vendedores", Chat con compradores |
| 🛒 **Comprador** | `munguiafrancisco860@gmail.com` | `perrasuciadavid` | 🛒 Comprar, Navegar 328 productos, Chatear, Guardar favoritos, Dar like, Convertirse en Vendedor |

> **Nota:** Cualquier email de Google puede registrarse y usar la plataforma. Nuevos usuarios reciben rol `BUYER` automáticamente. Desde su perfil pueden hacer clic en **"🏪 Convertirse en Vendedor"** para cambiar a `SELLER`.

---

## 📊 Diagramas de Flujo

### Flujo General del Usuario

```mermaid
flowchart TB
    A[Usuario llega] --> B{Cuenta?}
    B -->|No| C[Registro Google/Email via Clerk]
    B -->|Si| D[Iniciar Sesion]
    C --> E[Webhook Clerk -> Turso DB]
    E --> F[Rol: BUYER]
    D --> G{Rol?}
    F --> G
    G -->|BUYER| H[Explorar Marketplace]
    G -->|SELLER| I[Panel Vendedor]
    G -->|ADMIN| J[Panel Admin]
    H --> K[Comprar + Chatear]
    H --> L[Convertirse en Vendedor]
    L --> I
    I --> M[Publicar productos con fotos]
    I --> N[Dashboard Ventas P&L]
    I --> O[Gestionar Catalogo]
    M --> P[Aparece en: Marketplace + Perfil + Catalogos]
    J --> Q[Ver todos los usuarios]
    J --> R[Auditoria + Backup + Anuncios]
```

### Flujo de Autenticacion (Clerk)

```mermaid
sequenceDiagram
    participant U as Usuario
    participant C as Clerk
    participant W as /api/webhooks/clerk
    participant D as Turso DB
    participant A as App Zustand
    U->>C: Google/Email Login
    C->>C: Verifica email
    C->>W: user.created
    W->>D: INSERT User (role:BUYER)
    C-->>U: Sesion iniciada
    U->>A: initAuth()
    A->>D: SELECT User
    D-->>A: User data
    A->>A: Store actualizado
```

### Flujo de Compra

```mermaid
sequenceDiagram
    participant B as Comprador
    participant M as Marketplace
    participant C as Carrito
    participant T as Transaction
    B->>M: Navega 328 productos
    B->>C: Agregar al carrito
    B->>T: Pagar (11 metodos)
    T->>T: Comision 3%
    T->>B: Confirmacion
```

### Flujo Vendedor

```mermaid
flowchart LR
    A[BUYER] -->|Click Convertirse| B[/api/auth/role]
    B --> C[BusinessProfile creado]
    C --> D[SELLER]
    D --> E[Publicar producto + fotos]
    E --> F[Marketplace]
    E --> G[Perfil Vendedor]
    E --> H[Catalogos > Vendedores]
```


---

## 🛠️ Tecnologias Usadas

### Frontend
| Tecnologia | Version | Uso |
|---|---|---|
| Next.js | 16.2.9 | Framework React App Router |
| React | 19 | Biblioteca UI |
| TypeScript | 5 | Tipado estatico |
| Tailwind CSS | 4 | Estilos utilitarios |
| shadcn/ui | latest | 40+ componentes UI |
| Framer Motion | 11 | Animaciones |
| Zustand | 5 | Estado global |
| Recharts | 2 | Graficas Dashboard |
| Leaflet | 1.9 | Mapas interactivos |
| Lucide React | latest | Iconos |

### Backend
| Tecnologia | Uso |
|---|---|
| Next.js API Routes | 60+ Serverless Functions |
| Prisma ORM | Acceso a base de datos |
| Clerk | Autenticacion Email + Google OAuth |
| Pusher + Socket.io | Chat en tiempo real |
| n8n | Webhooks IA chatbot |
| Svix | Verificacion Webhooks |
| bcryptjs | Encriptacion |
| Zod | Validacion de datos |
| Resend | Emails transaccionales |

### Bases de Datos
| Base | Tipo | Hosting | Uso |
|---|---|---|---|
| Turso | libSQL | Turso Cloud | PRIMARIA - 26 tablas |
| Supabase | PostgreSQL | Supabase Cloud | SECUNDARIA - Respaldo |
| Upstash Redis | Redis | Upstash Cloud | Cache |
| SQLite Local | SQLite | Local | Desarrollo |

### Infraestructura
| Servicio | Uso |
|---|---|
| Vercel | Hosting + CDN + Edge Network |
| GitHub | Control de versiones |
| OpenWeatherMap | API de clima |
| Clearbit | Logos de proveedores |
| Lorem Flickr | Imagenes fallback |
| Picsum | Imagenes producto |


---

## 🗄️ Bases de Datos - Arquitectura 4 Capas

```mermaid
graph TB
    subgraph "Capa de Datos"
        A[Turso libSQL<br/>PRIMARIA - 26 tablas]
        B[Supabase PostgreSQL<br/>SECUNDARIA - Respaldo]
        C[Upstash Redis<br/>Cache - Sesiones]
        D[SQLite Local<br/>Desarrollo]
    end
    subgraph "Capa App"
        E[Next.js API Routes<br/>Serverless Vercel]
    end
    E -->|Prisma| A
    E -->|PHP Endpoint| B
    E -->|SDK| C
    E -->|Prisma| D
```

### Comparacion de Bases de Datos

| Caracteristica | Turso | Supabase | Redis | SQLite |
|---|---|---|---|---|
| Tipo | SQLite distribuido | PostgreSQL | Key-Value | SQLite |
| Uso | PRIMARIO | SECUNDARIO | Cache | Dev |
| Latencia | ~5ms edge | ~50ms | ~1ms | 0ms |
| Tablas | 26 | 26 replica | N/A | 26 |
| Backup | Auto Turso | Auto Supabase | Upstash | Archivo |

---

## 📐 Diagrama Entidad-Relacion (ER)

```mermaid
erDiagram
    User ||--o| BusinessProfile : "1:1"
    User ||--o{ Product : "1:M vende"
    User ||--o{ Transaction : "1:M compra/vende"
    User ||--o{ Message : "1:M envia"
    User ||--o{ ChatRoom : "1:M participa"
    User ||--o{ Notification : "1:M recibe"
    User ||--o{ Like : "1:M da"
    User ||--o{ SavedProduct : "1:M guarda"
    User ||--o{ Follow : "1:M sigue"
    User ||--o{ Review : "1:M escribe/recibe"
    Product ||--o{ Transaction : "1:M"
    Product ||--o{ QuantityDiscount : "1:M"
    ChatRoom ||--o{ Message : "1:M"
    Transaction ||--o{ CommissionLog : "1:1"
    User {
        string id PK
        string email UK
        string name
        string role "BUYER|SELLER|ADMIN"
        float balance
    }
    Product {
        string id PK
        string sellerId FK
        string title
        float price
        float discountPrice
        string category
        string images "JSON"
        string status "ACTIVE|PAUSED|SOLD"
    }
    Transaction {
        string id PK
        string buyerId FK
        string sellerId FK
        float amount
        float commission "3%"
        float sellerPayout "97%"
        string paymentMethod
    }
```

### 26 Tablas de Base de Datos

| Tabla | Descripcion |
|---|---|
| User | Usuarios con rol BUYER/SELLER/ADMIN |
| BusinessProfile | Perfil de negocio del vendedor |
| Product | Productos del marketplace |
| Transaction | Transacciones de compra/venta |
| Message | Mensajes del chat |
| ChatRoom | Salas de chat comprador-vendedor |
| Notification | Notificaciones push |
| Follow | Seguidores entre usuarios |
| Like | Me gusta en productos |
| SavedProduct | Productos guardados |
| Review | Resenas y calificaciones |
| ReviewVote | Votos en resenas |
| LoyaltyPoint | Puntos de lealtad |
| PointHistory | Historial de puntos |
| AuditLog | Registro de actividad |
| CommissionLog | Comisiones 3% |
| Advertisement | Anuncios publicitarios |
| QuantityDiscount | Descuentos por cantidad |
| WallPost | Publicaciones en muro |
| CalendarEvent | Eventos del calendario |
| Appointment | Citas entre usuarios |
| Cotizacion | Solicitudes RFQ |
| CotizacionResponse | Respuestas a cotizaciones |
| PostLike | Likes en posts |
| PostComment | Comentarios en posts |


---

## 📊 Control de Versiones

### Grafica de Barras de Commits (2026)

```
Abril     ████████░░░░░░░░░░░░  5 commits  (v1.0 MVP)
Mayo      ██████████████░░░░░░  8 commits  (v2.0 Chat + RFQ)
Junio     ██████████████████████████████  30 commits (v3.0-v4.0)
         ├─────────┼─────────┼─────────┤
         0         10        20        30

Ramas: main (produccion)
Total: 43 commits
Ultimo deploy: 2026-06-30
```

### Historial Completo de Commits

| # | Hash | Tipo | Descripcion |
|---|------|------|-------------|
| 1 | 9b8fd5f | feat | API cambio rol BUYER->SELLER + boton Convertirse en Vendedor + API admin/users |
| 2 | aa9d9e4 | feat | Hero section gradiente + README con 3 perfiles de prueba |
| 3 | 484b163 | feat | Vendedor prueba Los Munguias + tab Vendedores |
| 4 | 0685b37 | feat | Vendedores en Catalogos + API sellers + tabs Oficiales/Vendedores/Todos + 120+ productos |
| 5 | 98c66c4 | fix | Fotos equipo movidas a raiz public/ con .jpg |
| 6 | b216eb1 | fix | Boton Catalogos Oficiales en menu lateral Header |
| 7 | 84650a4 | feat | Catalogos oficiales 20+ proveedores NI con links |
| 8 | 68c05aa | fix | Tasas de cambio solo USD y NIO |
| 9 | 3fe6566 | fix | Fotos del equipo corregidas |
| 10 | 27c6505 | docs | README: arquitectura DBs, version control, 60+ proveedores |
| 11 | 37570c8 | fix | Fotos equipo movidas a public/equipo/ |
| 12 | 495ce7e | fix | Restaurar fotos equipo - .vercelignore |
| 13 | 756e691 | fix | Upload fotos sin Vercel Blob -> base64 FileReader |
| 14 | 9f29f75 | fix | 328 imagenes UNICAS via picsum |
| 15 | 2bde447 | feat | 68 productos reales de 30+ proveedores nicaraguenses |
| 16 | 6743314 | fix | Fallback products con Lorem Flickr |
| 17 | fa6b0b0 | fix | Lorem Flickr solo palabras inglesas seguras |
| 18 | d596d1c | fix | Lorem Flickr keywords individuales sin espacios |
| 19 | 33df415 | fix | placehold.co con nombre real de productos |
| 20 | a4ac9dd | fix | Imagenes Lorem Flickr limpias |
| 21 | 5a7ae83 | feat | 260 imagenes REALES via Lorem Flickr |
| 22 | 866d1eb | feat | 260 productos en 16 categorias |
| 23 | 48c2521 | fix | Categoria Transporte y Logistica unificada |
| 24 | 62a76c6 | fix | Imagenes unicas + categorias unificadas + detalle producto fallback |
| 25 | 624250f | feat | 214+ productos |
| 26 | 87f5272 | fix | HomeFeed carga 50 productos API + fallback |
| 27 | 439b69b | feat | 195+ productos en 11 categorias |
| 28 | f3adbf6 | feat | Cart store + botones agregar al carrito |
| 29 | c70d3c6 | feat | 150+ productos en 7 categorias |
| 30 | ef0491d | fix | Precios con descuento en mega catalogo |

---

## 📈 Estadisticas

| Metrica | Valor |
|---|---|
| **Total Commits** | 43 |
| **API Routes** | 60+ |
| **Componentes React** | 80+ |
| **Tablas DB** | 26 |
| **Proveedores Oficiales** | 20+ |
| **Productos Catalogo** | 328 |
| **Metodos de Pago** | 11 |
| **Categorias** | 16 |
| **Bases de Datos** | 4 |
| **Lenguajes** | 7 (TS, JS, Python, Go, Java, C#, PHP) |

---

## 🔗 Enlaces

| Recurso | URL |
|---|---|
| 🌐 Produccion | https://proveedor-conecta-vercel-github.vercel.app |
| 📂 GitHub | https://github.com/Reynaldo935/proveedor-conecta |
| 👑 Admin | rey7214935@gmail.com / El_jefe07 |
| 🏪 Vendedor | losmunguias007@gmail.com / Yamoshi2007.. |
| 🛒 Comprador | munguiafrancisco860@gmail.com / perrasuciadavid |

---

## 👥 Equipo

| Miembro | Rol |
|---|---|
| Reynaldo | Full-Stack Developer |
| Apolonio | Frontend Developer |
| Sarahi | Graphic Designer |
| Pedro | Communicator |
| Mychael | Marketing |

---

<p align="center">
  <strong>Hecho con ❤️ en Nicaragua 🇳🇮</strong><br>
  🏆 Hackathon Nicaragua 2026 — 10ª Edicion<br>
  <sub>© 2026 ProveedorConecta Nicaragua</sub>
</p>

---

## 🐘 Supabase PostgreSQL — Base de Datos SECUNDARIA

### Diagrama Relacional (PostgreSQL)

```mermaid
erDiagram
    users ||--o{ products : "vende (seller_id)"
    users ||--o{ transactions : "compra (buyer_id)"
    users ||--o{ transactions : "vende (seller_id)"
    users ||--o{ messages : "envia"
    users ||--o{ chat_rooms : "participa"
    users ||--o{ notifications : "recibe"
    users ||--o{ reviews : "escribe"
    users ||--o{ reviews : "recibe"
    users ||--o{ loyalty_points : "acumula"
    users ||--o{ audit_logs : "registra"
    users ||--o{ advertisements : "crea"
    products ||--o{ transactions : "tiene"
    products ||--o{ likes : "recibe"
    products ||--o{ saved_products : "guardado"
    products ||--o{ quantity_discounts : "descuentos"
    chat_rooms ||--o{ messages : "contiene"
    transactions ||--o{ commission_logs : "genera"
    users {
        uuid id PK "gen_random_uuid()"
        varchar clerk_id UK "ID de Clerk"
        varchar email UK "Email unico"
        varchar name "Nombre completo"
        varchar role "BUYER | SELLER | ADMIN"
        decimal balance "Billetera en NIO"
        varchar avatar "URL foto perfil"
        varchar cover_photo "URL portada"
        varchar phone "Telefono"
        varchar department "Departamento"
        varchar address "Direccion"
        text bio "Biografia"
        varchar website "Sitio web"
        boolean is_verified "Verificado"
        boolean email_verified "Email verificado"
        boolean phone_verified "Telefono verificado"
        timestamp created_at "Fecha creacion"
        timestamp updated_at "Ultima actualizacion"
    }
    products {
        uuid id PK
        uuid seller_id FK "Vendedor"
        varchar title "Titulo"
        text description "Descripcion"
        decimal price "Precio NIO"
        decimal discount_price "Precio descuento"
        int discount_percent "Porcentaje desc."
        varchar category "Categoria"
        text tags "Etiquetas CSV"
        jsonb images "Array URLs imagenes"
        varchar video_url "URL video"
        int quantity "Stock"
        varchar status "ACTIVE | PAUSED | SOLD"
        boolean is_featured "Destacado"
        timestamp published_at "Fecha publicacion"
        timestamp created_at
        timestamp updated_at
    }
    transactions {
        uuid id PK
        uuid buyer_id FK "Comprador"
        uuid seller_id FK "Vendedor"
        uuid product_id FK "Producto"
        decimal amount "Monto total"
        decimal commission "Comision 3%"
        decimal seller_payout "Pago vendedor 97%"
        varchar payment_method "Metodo pago"
        varchar status "PENDING | COMPLETED | FAILED"
        varchar cedula "Cedula"
        varchar card_last4 "Ultimos 4 digitos"
        timestamp created_at
    }
```

### Tablas de Supabase PostgreSQL

| # | Tabla | Descripcion | FK / Relaciones |
|---|-------|-------------|-----------------|
| 1 | `users` | Usuarios registrados via Clerk | - |
| 2 | `business_profiles` | Perfil de negocio vendedor | FK -> users (1:1) |
| 3 | `products` | Productos del marketplace | FK -> users (seller_id) |
| 4 | `transactions` | Transacciones de compra/venta | FK -> users (buyer_id, seller_id), products |
| 5 | `messages` | Mensajes del chat | FK -> chat_rooms, users |
| 6 | `chat_rooms` | Salas de chat | FK -> users (buyer_id, seller_id), products |
| 7 | `notifications` | Notificaciones push | FK -> users |
| 8 | `follows` | Seguidores entre usuarios | FK -> users (follower_id, following_id) |
| 9 | `likes` | Me gusta en productos | FK -> users, products |
| 10 | `saved_products` | Productos guardados/bookmarks | FK -> users, products |
| 11 | `reviews` | Resenas y calificaciones | FK -> users (reviewer, reviewed) |
| 12 | `review_votes` | Votos en resenas | FK -> reviews |
| 13 | `loyalty_points` | Puntos de lealtad | FK -> users |
| 14 | `point_history` | Historial de puntos | FK -> users |
| 15 | `audit_logs` | Registro de actividad | FK -> users |
| 16 | `commission_logs` | Comisiones 3% | FK -> transactions |
| 17 | `advertisements` | Anuncios publicitarios | FK -> users |
| 18 | `quantity_discounts` | Descuentos por cantidad | FK -> products |
| 19 | `wall_posts` | Publicaciones en muro | FK -> business_profiles |
| 20 | `calendar_events` | Eventos del calendario | FK -> users |
| 21 | `appointments` | Citas comprador-vendedor | FK -> users (buyer_id, seller_id) |
| 22 | `cotizaciones` | Solicitudes RFQ | FK -> users (buyer_id) |
| 23 | `cotizacion_responses` | Respuestas a cotizaciones | FK -> cotizaciones, users, products |
| 24 | `post_likes` | Likes en posts del muro | FK -> wall_posts, users |
| 25 | `post_comments` | Comentarios en posts | FK -> wall_posts, users |
| 26 | `commission_payouts` | Pagos de comisiones | FK -> commission_logs |

### Conexion PHP a Supabase

```php
// public/api/supabase-db.php
$url = getenv("SUPABASE_URL");
$db = getenv("SUPABASE_DB"); // postgresql://postgres:password@host:5432/postgres
$conn = pg_connect($db);
// CRUD operations via pg_query()
```

### Script SQL de Creacion (Supabase)

```sql
-- Ejemplo: Crear tabla users en Supabase PostgreSQL
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clerk_id VARCHAR(255) UNIQUE,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) DEFAULT "",
    role VARCHAR(20) DEFAULT "BUYER",
    balance DECIMAL(10,2) DEFAULT 50000.00,
    avatar TEXT DEFAULT "",
    cover_photo TEXT DEFAULT "",
    phone VARCHAR(20) DEFAULT "",
    department VARCHAR(100) DEFAULT "",
    address TEXT DEFAULT "",
    bio TEXT DEFAULT "",
    website VARCHAR(500) DEFAULT "",
    is_verified BOOLEAN DEFAULT FALSE,
    email_verified BOOLEAN DEFAULT FALSE,
    phone_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indices para rendimiento
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_products_seller ON products(seller_id);
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_status ON products(status);
CREATE INDEX idx_transactions_buyer ON transactions(buyer_id);
CREATE INDEX idx_transactions_seller ON transactions(seller_id);
CREATE INDEX idx_transactions_status ON transactions(status);
```


---

## 🔐 Clerk — Sistema de Autenticacion y Gestion de Usuarios

### Diagrama de Integracion Clerk

```mermaid
flowchart TB
    subgraph "Clerk Cloud"
        A[Clerk Dashboard<br/>manage.clerk.com]
        B[Clerk API<br/>api.clerk.com]
        C[Webhooks<br/>Svix]
    end
    
    subgraph "ProveedorConecta App"
        D[SignIn / SignUp<br/>Componentes Clerk]
        E[/api/webhooks/clerk<br/>Webhook Receiver]
        F[/api/auth/me<br/>User Sync]
        G[Auth Store<br/>Zustand]
    end
    
    subgraph "Base de Datos"
        H[Turso DB<br/>Tabla User]
    end
    
    A -->|Configuracion| D
    D -->|Login/Register| B
    B -->|Evento user.created| C
    C -->|POST JSON| E
    E -->|INSERT/UPDATE| H
    F -->|SELECT| H
    F -->|Sync| G
    G -->|Estado global| D
```

### Flujo de Sincronizacion Clerk -> DB

```mermaid
sequenceDiagram
    participant U as Usuario
    participant CL as Clerk Dashboard
    participant CA as Clerk API
    participant WH as Svix Webhook
    participant API as /api/webhooks/clerk
    participant DB as Turso DB

    U->>CL: Registro con Google/Email
    CL->>CA: Crear usuario Clerk
    CA->>WH: Emitir user.created
    WH->>API: POST {data: {id, email, name}}
    API->>API: Validar firma Svix
    API->>DB: Buscar email existente
    alt Usuario nuevo
        API->>DB: INSERT User (role: BUYER)
    else Usuario existente
        API->>DB: UPDATE User (name, avatar, emailVerified)
    end
    API-->>WH: 200 OK
    CA-->>U: Email de verificacion
```

### Tablas/Entidades de Clerk

| Entidad Clerk | Descripcion | Mapeo en DB |
|---|---|---|
| **User** | Usuario registrado en Clerk | `User` (Turso) via `clerkId` (no almacenado, solo email) |
| **EmailAddress** | Email principal + secundarios | `User.email` (UNIQUE) |
| **PhoneNumber** | Numero de telefono | `User.phone` |
| **Session** | Sesion activa del usuario | No se almacena (Clerk maneja JWT) |
| **Organization** | Organizaciones (no usado) | N/A |
| **Webhook** | Eventos Svix | `/api/webhooks/clerk` recibe: `user.created`, `user.updated`, `user.deleted` |

### Eventos de Webhook Clerk utilizados

| Evento | Descripcion | Accion en DB |
|---|---|---|
| `user.created` | Nuevo usuario se registra | INSERT User con rol `BUYER`, email, nombre, avatar |
| `user.updated` | Usuario actualiza su perfil | UPDATE User: nombre, avatar, emailVerified=true |
| `user.deleted` | Usuario elimina su cuenta | DELETE User de Turso |

### Configuracion de Clerk (Variables de Entorno)

```env
# Clerk Publishable Key (publica, para frontend)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxxxxxxxxxx

# Clerk Secret Key (privada, solo backend)
CLERK_SECRET_KEY=sk_test_xxxxxxxxxxxxxxxxxxxxx

# Clerk Webhook Secret (Svix, para verificar firma de webhooks)
CLERK_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxxx

# URLs de redireccion
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/
```

### Middleware de Clerk (proxy.ts)

```typescript
// proxy.ts - Next.js 16 Proxy para Clerk Auth
import { clerkMiddleware } from "@clerk/nextjs/server"

export default clerkMiddleware({
  // Rutas publicas (sin autenticacion)
  publicRoutes: [
    "/",
    "/api/products",
    "/api/suppliers",
    "/api/weather",
    "/api/webhooks/clerk",
    "/api/catalog/sellers",
    "/sign-in(.*)",
    "/sign-up(.*)",
  ],
  // Rutas ignoradas (archivos estaticos)
  ignoredRoutes: [
    "/_next/static/(.*)",
    "/uploads/(.*)",
    "/favicon.ico",
    "/robots.txt",
  ],
})
```

### Roles de Usuario en Clerk + DB

| Rol | Descripcion | Como se asigna | Acceso |
|---|---|---|---|
| **BUYER** | Comprador (default) | Automatico al registrarse via Clerk webhook | Marketplace, Comprar, Chatear |
| **SELLER** | Vendedor | Via boton "Convertirse en Vendedor" en perfil → PATCH `/api/auth/role` | Dashboard Ventas, Publicar productos, Catalogo |
| **ADMIN** | Administrador unico | Manualmente en DB: `UPDATE User SET role="ADMIN" WHERE email="rey7214935@gmail.com"` | TODO: Panel Admin, Auditoria, Backup, Usuarios |

> ⚠️ **IMPORTANTE:** Solo existe **UN administrador** en el sistema: `rey7214935@gmail.com`. No hay forma de crear otro admin desde la interfaz. El rol ADMIN se asigna directamente en la base de datos.
