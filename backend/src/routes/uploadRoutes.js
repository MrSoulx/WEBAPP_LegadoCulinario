const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/authMiddleware');
const { generatePresignedUrl } = require('../utils/r2Helper');

router.post('/presign', protect, async (req, res) => {
  try {
    const { filename, contentType, folder } = req.body;

    if (!filename || !contentType) {
      return res.status(400).json({ success: false, message: 'filename y contentType requeridos' });
    }

    const result = await generatePresignedUrl(
      filename,
      contentType,
      folder || 'recetas'
    );

    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Error generando presigned URL:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
