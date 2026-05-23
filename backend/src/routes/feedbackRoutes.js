const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/authMiddleware');
const {
  getAllFeedback,
  getFeedbackByRecipe,
  createFeedback,
  updateFeedback,
  deleteFeedback
} = require('../controllers/feedbackController');

// Rutas públicas
router.get('/', getAllFeedback);
router.get('/recipe/:recetaId', getFeedbackByRecipe);
router.post('/', createFeedback);

// Rutas protegidas
router.put('/:id', protect, updateFeedback);
router.delete('/:id', protect, deleteFeedback);

module.exports = router;
