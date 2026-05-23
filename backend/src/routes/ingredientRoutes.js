const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/authMiddleware');

router.get('/', protect, (req, res) => {
  res.json({ success: true, message: 'Endpoint de ingredientes - Por implementar' });
});

module.exports = router;
