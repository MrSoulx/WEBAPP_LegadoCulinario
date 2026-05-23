const multer = require('multer');
const path = require('path');
const fs = require('fs');

const os = require('os');

// En Vercel el sistema de archivos es de solo lectura excepto /tmp
const tempDir = process.env.VERCEL ? path.join('/tmp', 'uploads', 'temp') : path.join(__dirname, '../../uploads/temp');

try {
  if (!fs.existsSync(tempDir)){
    fs.mkdirSync(tempDir, { recursive: true });
  }
} catch (e) {
  console.warn('⚠️ No se pudo crear carpeta de uploads (esperado en algunos entornos serverless):', e.message);
}

// Configurar almacenamiento temporal
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, tempDir); // Usar la ruta definida arriba
  },
  filename: (req, file, cb) => {
    // Generar nombre único: timestamp-random-originalname
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

// Filtro de archivos (imágenes y videos)
const fileFilter = (req, file, cb) => {
  const allowedImageTypes = /jpeg|jpg|png|gif|webp/;
  const allowedVideoTypes = /mp4|webm|ogg|mov/;
  
  const isImage = allowedImageTypes.test(path.extname(file.originalname).toLowerCase()) || allowedImageTypes.test(file.mimetype);
  const isVideo = allowedVideoTypes.test(path.extname(file.originalname).toLowerCase()) || allowedVideoTypes.test(file.mimetype);

  if (isImage || isVideo) {
    return cb(null, true);
  } else {
    cb(new Error('Solo se permiten imágenes (jpeg, jpg, png, gif, webp) y videos (mp4, webm, mov)'));
  }
};

// Configurar multer
// Configurar multer para ALTA CAPACIDAD (1GB)
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 1024 * 1024 * 1024, // 1GB Forzado
    fieldSize: 1024 * 1024 * 50    // 50MB para campos de texto pesados
  },
  fileFilter: fileFilter
});

// Middleware para una sola imagen
const uploadSingle = (fieldName) => {
  return upload.single(fieldName);
};

// Middleware para múltiples imágenes
const uploadMultiple = (fieldName, maxCount = 5) => {
  return upload.array(fieldName, maxCount);
};

// Middleware para campos mezclados (imagenes y video)
const uploadRecipeFiles = (req, res, next) => {
  // Si la petición es JSON (subida directa desde frontend), saltamos Multer
  if (req.headers['content-type'] && req.headers['content-type'].includes('application/json')) {
    return next();
  }

  console.log('📥 Recibiendo paquete de datos (Multipart/Multimedia)...');
  
  const mult = upload.fields([
    { name: 'imagenes', maxCount: 5 },
    { name: 'video', maxCount: 1 }
  ]);
  
  mult(req, res, (err) => {
    if (err) {
      console.error('❌ Error en Multer:', err.message);
      return handleMulterError(err, req, res, next);
    }
    console.log('✅ Paquete abierto con éxito. Archivos listos.');
    next();
  });
};

// Middleware para manejar errores de multer
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'El archivo es demasiado grande. El límite es de 1GB para videos de alta calidad.'
      });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: 'Demasiados archivos. Máximo 5 imágenes'
      });
    }
    return res.status(400).json({
      success: false,
      message: err.message
    });
  }
  
  if (err) {
    return res.status(400).json({
      success: false,
      message: err.message
    });
  }
  
  next();
};

module.exports = {
  uploadSingle,
  uploadMultiple,
  uploadRecipeFiles,
  handleMulterError
};
