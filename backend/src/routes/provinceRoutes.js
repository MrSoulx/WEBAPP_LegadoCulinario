const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/authMiddleware');
const {
  getAllProvinces,
  getProvinceById,
  createProvince,
  updateProvince,
  deleteProvince
} = require('../controllers/provinceController');

// Rutas públicas
router.get('/', getAllProvinces);
router.get('/:id', getProvinceById);

// Rutas protegidas (Admin)
router.post('/', protect, createProvince);
router.put('/:id', protect, updateProvince);
router.delete('/:id', protect, deleteProvince);

module.exports = router;
