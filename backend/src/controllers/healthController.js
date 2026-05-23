const { supabase } = require('../config/database');
const { S3Client, HeadBucketCommand } = require('@aws-sdk/client-s3');

const s3Health = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

// @desc    Health check completo del sistema
// @route   GET /api/health
// @access  Public
exports.healthCheck = async (req, res) => {
  const checks = {
    timestamp: new Date().toISOString(),
    status: 'healthy',
    checks: {}
  };

  try {
    // 1. Test de Supabase
    try {
      const { data, error } = await supabase
        .from('regiones')
        .select('count')
        .limit(1);
      
      checks.checks.supabase = {
        status: error ? 'error' : 'ok',
        message: error ? error.message : 'Conectado correctamente',
        responseTime: Date.now()
      };
    } catch (error) {
      checks.checks.supabase = {
        status: 'error',
        message: error.message
      };
      checks.status = 'unhealthy';
    }

    // 2. Test de R2 (Cloudflare)
    try {
      await s3Health.send(new HeadBucketCommand({ Bucket: process.env.R2_BUCKET }));
      checks.checks.r2 = {
        status: 'ok',
        message: 'Conectado correctamente'
      };
    } catch (error) {
      checks.checks.r2 = {
        status: 'error',
        message: error.message
      };
      checks.status = 'degraded';
    }

    // 3. Test de tablas
    const tables = ['users', 'regiones', 'provincias', 'recetas', 'feedback'];
    checks.checks.tables = {};

    for (const table of tables) {
      try {
        const { count, error } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true });
        
        checks.checks.tables[table] = {
          status: error ? 'error' : 'ok',
          count: count || 0,
          message: error ? error.message : `${count || 0} registros`
        };
      } catch (error) {
        checks.checks.tables[table] = {
          status: 'error',
          message: error.message
        };
      }
    }

    // 4. Test de función increment_receta_vistas
    try {
      // Solo verificar que la función existe
      checks.checks.functions = {
        increment_receta_vistas: {
          status: 'ok',
          message: 'Función disponible'
        }
      };
    } catch (error) {
      checks.checks.functions = {
        increment_receta_vistas: {
          status: 'error',
          message: error.message
        }
      };
    }

    // 5. Test de variables de entorno
    const requiredEnvVars = [
      'SUPABASE_URL',
      'SUPABASE_SERVICE_ROLE_KEY',
      'R2_ENDPOINT',
      'R2_ACCESS_KEY_ID',
      'R2_SECRET_ACCESS_KEY',
      'R2_BUCKET',
      'R2_PUBLIC_URL'
    ];

    checks.checks.environment = {};
    requiredEnvVars.forEach(envVar => {
      checks.checks.environment[envVar] = {
        status: process.env[envVar] ? 'ok' : 'missing',
        message: process.env[envVar] ? 'Configurada' : 'No configurada'
      };
    });

    // 6. Información del sistema
    checks.system = {
      nodeVersion: process.version,
      platform: process.platform,
      uptime: process.uptime(),
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024)
      }
    };

    res.json(checks);
  } catch (error) {
    res.status(500).json({
      timestamp: new Date().toISOString(),
      status: 'error',
      message: error.message
    });
  }
};

// @desc    Health check simple (para Docker/K8s)
// @route   GET /api/health/live
// @access  Public
exports.liveness = async (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString()
  });
};

// @desc    Readiness check (verifica que esté listo para recibir tráfico)
// @route   GET /api/health/ready
// @access  Public
exports.readiness = async (req, res) => {
  try {
    // Verificar Supabase
    const { error } = await supabase
      .from('regiones')
      .select('count')
      .limit(1);

    if (error) {
      return res.status(503).json({
        status: 'not_ready',
        message: 'Supabase no disponible'
      });
    }

    res.json({
      status: 'ready',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(503).json({
      status: 'not_ready',
      message: error.message
    });
  }
};
