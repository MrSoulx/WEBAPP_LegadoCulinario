const express = require('express');
const router = express.Router();
const { healthCheck, liveness, readiness } = require('../controllers/healthController');

// Health check completo
router.get('/', healthCheck);

// Dashboard HTML
router.get('/dashboard', (req, res) => {
  res.redirect('/public/health.html');
});

// Liveness probe (para Docker/K8s)
router.get('/live', liveness);

// Readiness probe (para Docker/K8s)
router.get('/ready', readiness);

module.exports = router;
