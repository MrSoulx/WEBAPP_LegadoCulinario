// Entry point para Vercel Serverless Functions
const app = require('../src/app');

// Vercel maneja el servidor automáticamente, solo exportamos la app
module.exports = app;
