const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middlewares/authMiddleware');

router.get('/', protect, authorize('super_admin', 'admin'), (req, res) => {
  res.json({ success: true, message: 'Endpoint de usuarios - Por implementar' });
});

module.exports = router;
