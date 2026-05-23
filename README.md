# 🍽️ Legado Culinario

Plataforma de recetas ecuatorianas con **sustitución inteligente de ingredientes** según la ubicación del usuario. Incluye panel de administración, app pública y simulador de ubicación.

---

## Arquitectura

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Public App    │     │   Admin Panel   │     │   Simulador     │
│  localhost:3000 │     │  localhost:5173 │     │  (HTML plano)   │
│  React + i18n   │     │  React + Vite   │     │  standalone     │
└────────┬────────┘     └────────┬────────┘     └────────┬────────┘
         │                       │                        │
         └──────────────────────┬┴────────────────────────┘
                                │ HTTP
                       ┌────────▼────────┐
                       │    Backend      │
                       │  localhost:5000 │
                       │  Express + R2   │
                       └────────┬────────┘
                                │
                    ┌───────────┼───────────┐
                    ▼           ▼           ▼
               ┌────────┐ ┌────────┐ ┌──────────┐
               │Supabase│ │Groq AI│ │   R2     │
               │ (DB)   │ │(Llama)│ │(imágenes)│
               └────────┘ └────────┘ └──────────┘
```

| App | Puerto | Descripción |
|-----|--------|-------------|
| **Backend** | `:5000` | API REST con Express, Supabase, Groq AI, R2 |
| **Public App** | `:3000` | Catálogo de recetas con sustitutos inteligentes |
| **Admin Panel** | `:5173` | CRUD de recetas, dashboard, feedback |
| **Simulador** | — | HTML standalone para simular país (`simulador-ubicacion.html`) |

---

## Stack

### Backend
- **Runtime:** Node.js + Express 5
- **DB:** Supabase (PostgreSQL) via `@supabase/supabase-js`
- **AI:** Groq API (Llama 3.3 70B) para sustitutos y traducción
- **Storage:** Cloudflare R2 (S3-compatible) para imágenes y videos
- **Auth:** Supabase Auth (JWT)

### Public App
- React 19 + react-scripts (CRA-like)
- i18next + react-i18next (es/en)
- Geolocalización vía backend proxy (`/api/geoip` → ipinfo.io)

### Admin Panel
- React 19 + Vite
- Supabase Auth, Chart.js, React Router
- Subida de archivos vía proxy backend (multer → R2)

---

## Requisitos

- Node.js 18+
- npm
- Cuenta en: Supabase, Groq, Cloudflare R2

---

## Variables de Entorno

### `backend/.env`

```env
NODE_ENV=development
PORT=5000

# Supabase
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_ANON_KEY=tu_anon_key
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key

# CORS
CORS_ORIGIN=http://localhost:3000,http://localhost:5173

# Cloudflare R2
R2_ENDPOINT=https://xxxxxxxxxxxxx.r2.cloudflarestorage.com
R2_ACCESS_KEY_ID=tu_access_key
R2_SECRET_ACCESS_KEY=tu_secret_key
R2_BUCKET=legadoculinario
R2_PUBLIC_URL=https://pub-xxxxxxxxxxxxxxxx.r2.dev

# Email (opcional)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=tu_correo@gmail.com
EMAIL_PASS=tu_contraseña_app

# Groq AI
GROQ_API_KEY=gsk_tu_api_key
```

### `public-app/.env`

```env
REACT_APP_API_URL=http://localhost:5000/api
```

### `admin-panel/.env`

```env
VITE_API_URL=http://localhost:5000/api
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu_anon_key
```

---

## Instalación y Ejecución Local

### 1. Backend

```bash
cd backend
cp .env.example .env   # Completar credenciales
npm install
npm run dev            # nodemon, puerto 5000
```

### 2. Public App

```bash
cd public-app
npm install
npm start              # puerto 3000
```

### 3. Admin Panel

```bash
cd admin-panel
npm install
npm run dev            # puerto 5173
```

### 4. Simulador de Ubicación

Abrir `simulador-ubicacion.html` en el navegador (doble click). Elegir un país y hacer click en **"Abrir app pública con este país"** para abrir la app en ese modo.

---

## API Endpoints

### Públicos

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/api/health` | Health check |
| `GET` | `/api/geoip` | Detectar país por IP (ipinfo.io) |
| `GET` | `/api/recipes` | Listar recetas (paginado) |
| `GET` | `/api/recipes/:id` | Detalle de receta |
| `GET` | `/api/recipes?region_id=N` | Filtrar por región |
| `POST` | `/api/recipes/:id/view` | Incrementar vistas |
| `GET` | `/api/regions` | Listar regiones |
| `GET` | `/api/provinces` | Listar provincias |
| `GET` | `/api/feedback?recipe_id=N` | Feedback de receta |
| `POST` | `/api/ai/substitutes` | Sustitutos IA (`{ingredients[], country}`) |
| `POST` | `/api/ai/translate` | Traducir receta (`{text, target_language}`) |
| `POST` | `/api/ai/calories` | Estimar calorías (`{name, ingredients}`) |

### Requieren Auth (JWT)

| Método | Ruta | Descripción |
|--------|------|-------------|
| `POST` | `/api/auth/login` | Login (`{correo, password}`) |
| `POST` | `/api/auth/register` | Registro |
| `GET` | `/api/auth/me` | Perfil actual |
| `PUT` | `/api/auth/profile` | Actualizar perfil |
| `GET` | `/api/recipes/mine` | Recetas del usuario |
| `GET` | `/api/dashboard/stats` | Estadísticas del dashboard |
| `POST` | `/api/upload/presign` | Generar URL firmada para R2 |

---

## Sustitución de Ingredientes (IA)

El sistema usa **Groq API (Llama 3.3 70B)** para sugerir sustitutos de ingredientes según el país.

**Flujo:**
1. El usuario selecciona un país (vía simulador, URL params o detección IP)
2. Al abrir una receta, el frontend llama a `POST /api/ai/substitutes` con los ingredientes y el país
3. La IA identifica ingredientes difíciles de conseguir en ese país y sugiere alternativas locales
4. Se muestran en tarjetas dentro del modal de la receta

**Ejemplo de respuesta:**
```json
{
  "substitutes": [
    "Achiote -> Pimentón dulce o Cúrcuma",
    "Panela -> Azúcar moreno",
    "Chifles -> Papas fritas"
  ]
}
```

---

## Simulador de Ubicación

El archivo `simulador-ubicacion.html` permite probar la funcionalidad de sustitutos sin cambiar la ubicación real.

**Cómo funciona:**
1. El usuario elige un país en el simulador
2. Hace click en "Abrir app pública con este país"
3. Se abre la app con el país en la URL (`?country=España&sim=true`)
4. La app pública lee los parámetros, los persiste en localStorage, y los usa para los sustitutos

> ⚠️ `localStorage` **no se comparte** entre `file://` y `http://localhost`. Por eso se usa `?country=` en la URL.

---

## Almacenamiento (R2)

Cloudinary fue reemplazado por **Cloudflare R2** (S3-compatible):

| Archivo | Rol |
|---------|-----|
| `backend/src/utils/r2Helper.js` | upload/delete/presigned URLs |
| `backend/src/routes/uploadRoutes.js` | `POST /api/upload/presign` |
| `admin-panel/src/utils/r2Uploader.js` | Sube archivos vía FormData → backend proxy |

**Razón:** R2 no cobra por transferencia de salida (egress), ideal para alto tráfico.

---

## Docker

```bash
docker compose up -d
```

| Servicio | Puerto interno | Puerto host |
|----------|---------------|-------------|
| backend | 5000 | 5001 |
| public-app | 3000 | 3001 |
| admin-panel | 80 (nginx) | 5173 |

---

## Tests

```bash
bash test-smoke.sh
```

Requiere backend corriendo en `localhost:5000`. Prueba:
- Health, GeoIP, recetas públicas
- Sustitutos IA (3 países)
- Regiones, provincias, feedback
- Archivos del proyecto
- Ausencia de Cloudinary

---

## Estructura del Proyecto

```
├── backend/
│   ├── src/
│   │   ├── app.js              # Express app
│   │   ├── server.js           # Entry point
│   │   ├── config/database.js  # Supabase client
│   │   ├── controllers/
│   │   │   ├── authController.js
│   │   │   ├── dashboardController.js
│   │   │   ├── feedbackController.js
│   │   │   ├── geoipController.js
│   │   │   ├── healthController.js
│   │   │   ├── provinceController.js
│   │   │   ├── recipeController.js
│   │   │   └── regionController.js
│   │   ├── middleware/
│   │   ├── routes/
│   │   ├── utils/r2Helper.js
│   │   └── ...
│   ├── server.js
│   ├── api/index.js            # Entry para Vercel
│   ├── .env.example
│   └── vercel.json
│
├── public-app/
│   ├── src/
│   │   ├── App.js              # App pública (recetas, sustitutos)
│   │   ├── components/         # Navigation, RecipeCard, etc.
│   │   ├── data/
│   │   │   ├── apiClient.js    # API_BASE_URL
│   │   │   ├── recipesData.js  # fetchRecipes, transformRecipe
│   │   │   └── translateService.js
│   │   └── i18n.js
│   ├── public/
│   └── vercel.json
│
├── admin-panel/
│   ├── src/
│   │   ├── pages/              # Dashboard, RecipeForm, Login, etc.
│   │   ├── components/
│   │   ├── utils/r2Uploader.js
│   │   └── ...
│   └── vercel.json
│
├── simulador-ubicacion.html     # Standalone location simulator
├── test-smoke.sh                # Smoke tests
└── docker-compose.yml
```

---

## Despliegue en Vercel

### Backend

```bash
cd backend
vercel --prod
```

Requiere configurar las variables de entorno en el proyecto de Vercel. El entry point es `api/index.js`.

### Public App

```bash
cd public-app
vercel --prod
```

Configurar `REACT_APP_API_URL` apuntando al backend en producción.

### Admin Panel

```bash
cd admin-panel
vercel --prod
```

Configurar `VITE_API_URL`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`.
