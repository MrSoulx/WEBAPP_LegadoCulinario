const dotenv = require("dotenv");

// Cargar variables de entorno PRIMERO antes de cualquier otro import
dotenv.config();

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const path = require("path");

// Validar variables de entorno críticas
const requiredEnvVars = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'];
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error('❌ ERROR: Faltan variables de entorno críticas:', missingVars.join(', '));
  console.error('⚠️ El servidor continuará pero algunas funcionalidades no estarán disponibles.');
}

const { testConnection } = require("./config/database");

// Verificar conexión a Supabase de forma no bloqueante
testConnection().catch(err => console.warn('⚠️ Advertencia al conectar a Supabase:', err.message));

const app = express();

// Confiar en el proxy de Vercel para obtener la IP real del cliente
app.set('trust proxy', 1);

// Middlewares de seguridad
app.use(helmet({
  contentSecurityPolicy: false, 
  frameguard: false, // Permitir iframes (necesario para el visor de Cloudinary local)
}));

const corsOptions = {
  origin: true, // Permitir cualquier origen dinámicamente (Seguro con credentials: true bajo HTTPS)
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Cache-Control', 'X-Api-Version'],
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

// Middlewares de parseo (Aumentado para soportar metadatos en subidas grandes)
app.use(express.json({ limit: '50mb' })); // Reducido de 1GB a algo razonable para Vercel
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Logger
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// Servir archivos estáticos (uploads)
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));
app.use("/public", express.static(path.join(__dirname, "../public")));

// Manejar peticiones de favicon para evitar errores 404 en los logs
app.get(['/favicon.ico', '/favicon.png'], (req, res) => res.status(204).end());

// Rutas
app.use("/api/health", require("./routes/healthRoutes"));
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/recipes", require("./routes/recipeRoutes"));
app.use("/api/regions", require("./routes/regionRoutes"));
app.use("/api/provinces", require("./routes/provinceRoutes"));
app.use("/api/feedback", require("./routes/feedbackRoutes"));
app.use("/api/ai", require("./routes/aiRoutes"));
app.use("/api/suggestions", require("./routes/suggestionsRoutes"));
app.use("/api/upload", require("./routes/uploadRoutes"));
app.use("/api/dashboard", require("./routes/dashboardRoutes"));
app.use("/api/geoip", require("./routes/geoipRoutes"));

// Ruta raíz
app.get("/", (req, res) => {
  res.json({ 
    message: "Legado Culinario API Centralized is running",
    status: "healthy",
    environment: process.env.NODE_ENV
  });
});

// Ruta /api
app.get("/api", (req, res) => {
  res.json({ 
    message: "API Documentation and health at /api/health",
    endpoints: ["/api/recipes", "/api/ai", "/api/suggestions"]
  });
});

// Manejo de errores
app.use(require("./middlewares/errorHandler"));

module.exports = app;
