const app = require('./src/app');

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
  console.log(`📍 Entorno: ${process.env.NODE_ENV}`);
  console.log(`🌐 API disponible en: http://localhost:${PORT}/api`);
});

// DESACTIVAR TIMEOUTS PARA SUBIDAS DE 1GB
server.timeout = 0; // Infinito (el navegador controlará su propio timeout)
server.headersTimeout = 0;
server.requestTimeout = 0;
server.keepAliveTimeout = 1000 * 60 * 10; // 10 minutos de vida de conexión
