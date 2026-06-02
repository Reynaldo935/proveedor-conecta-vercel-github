# 🚀 Deploy a Vercel — ProveedorConecta Nicaragua

## Resumen Rápido

| Componente | Local | Vercel (Online) |
|---|---|---|
| Frontend | ✅ localhost:3000 | ✅ tu-app.vercel.app |
| Base de Datos | ✅ db/custom.db (SQLite local) | ☁️ Turso Cloud (SQLite en la nube, GRATIS) |
| Subir Imágenes | ✅ public/uploads/ | ☁️ Vercel Blob (GRATIS hasta 250MB) |
| Auth (cookies) | ✅ Funciona | ✅ Funciona en HTTPS |

---

## PASO 1: Crear Base de Datos en Turso Cloud (GRATIS)

1. Ir a https://turso.tech y crear cuenta con GitHub
2. Crear una base de datos:
   ```bash
   # Instalar Turso CLI
   curl -sSfL https://get.tur.so/install.sh | bash
   
   # Login
   turso auth login
   
   # Crear base de datos
   turso db create proveedor-conecta
   
   # Obtener la URL de conexión
   turso db show proveedor-conecta --url
   # Resultado: libsql://proveedor-conecta-XXXX.turso.io
   
   # Crear token de autenticación
   turso db tokens create proveedor-conecta
   # Resultado: eyJhbGciOiJF...
   ```

3. Aplicar el schema a Turso:
   ```bash
   # Configurar variables temporalmente
   export TURSO_DATABASE_URL="libsql://proveedor-conecta-XXXX.turso.io"
   export TURSO_AUTH_TOKEN="eyJhbGciOiJF..."
   export DATABASE_URL="libsql://proveedor-conecta-XXXX.turso.io?authToken=eyJhbGciOiJF..."
   
   # Push del schema
   npx prisma db push
   ```

4. Llenar con datos de demo:
   ```bash
   bun run prisma/seed.ts
   ```

---

## PASO 2: Crear Cuenta en Vercel (GRATIS)

1. Ir a https://vercel.com y crear cuenta con GitHub
2. Vercel detecta automáticamente proyectos Next.js

---

## PASO 3: Activar Vercel Blob (para subir imágenes)

1. En el dashboard de Vercel, ir a tu proyecto → Storage → Create Database
2. Seleccionar "Blob" → Create
3. Esto automáticamente configura `BLOB_READ_WRITE_TOKEN`

---

## PASO 4: Deploy a Vercel

### Opción A: Desde la web (más fácil)

1. Ir a https://vercel.com/new
2. Importar tu repo de GitHub: `mych336-bli/h2o`
3. Configurar variables de entorno:

| Variable | Valor |
|---|---|
| `DATABASE_URL` | `libsql://proveedor-conecta-XXXX.turso.io?authToken=TU_TOKEN` |
| `TURSO_DATABASE_URL` | `libsql://proveedor-conecta-XXXX.turso.io` |
| `TURSO_AUTH_TOKEN` | `eyJhbGciOiJF...` (tu token de Turso) |
| `NEXT_PUBLIC_APP_URL` | `https://tu-app.vercel.app` |
| `BLOB_READ_WRITE_TOKEN` | (se configura automáticamente con Vercel Blob) |

4. Click "Deploy" 🚀
5. ¡Listo! Tu URL será: `https://tu-app.vercel.app`

### Opción B: Desde la terminal

```bash
# Instalar Vercel CLI (ya instalado en tu proyecto)
npm i -g vercel

# Login
vercel login

# Deploy
vercel

# La primera vez te preguntará:
# - Set up and deploy? → Yes
# - Which scope? → Tu cuenta
# - Link to existing project? → No
# - Project name? → proveedor-conecta
# - Which directory is your code in? → ./
# - Want to override the settings? → No

# Agregar variables de entorno:
vercel env add DATABASE_URL
vercel env add TURSO_DATABASE_URL
vercel env add TURSO_AUTH_TOKEN
vercel env add NEXT_PUBLIC_APP_URL

# Redeploy con las variables:
vercel --prod
```

---

## Verificación Post-Deploy

1. Abrir `https://tu-app.vercel.app`
2. Login con: `ferreteria@demo.ni` / `demo123`
3. Probar subir una imagen
4. Probar el chat
5. Probar los pagos

---

## Costo: $0 (TODO GRATIS)

| Servicio | Plan Gratuito |
|---|---|
| Vercel | 100GB bandwidth, Serverless Functions ilimitadas |
| Turso | 9GB almacenamiento, 1 billón filas leídas/mes |
| Vercel Blob | 250MB almacenamiento |

---

## Troubleshooting

### Error: "Can't reach database server"
- Verificar que `TURSO_DATABASE_URL` y `TURSO_AUTH_TOKEN` estén configuradas en Vercel

### Error: "Upload failed"
- Verificar que Vercel Blob esté activado en el dashboard del proyecto

### Error: "500 Internal Server Error"
- Verificar los logs: `vercel logs tu-app.vercel.app`
