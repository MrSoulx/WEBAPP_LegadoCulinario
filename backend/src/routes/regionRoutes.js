const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/authMiddleware');
const {
  getAllRegions,
  getRegionById,
  getProvincesByRegion,
  createRegion,
  updateRegion,
  deleteRegion
} = require('../controllers/regionController');

// Rutas públicas
router.get('/', getAllRegions);
router.get('/:id', getRegionById);
router.get('/:id/provinces', getProvincesByRegion);

// Rutas protegidas (Admin)
router.post('/', protect, createRegion);
router.put('/:id', protect, updateRegion);
router.delete('/:id', protect, deleteRegion);

module.exports = router;
