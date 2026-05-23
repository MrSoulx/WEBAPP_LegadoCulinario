const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/authMiddleware');
const { uploadRecipeFiles, handleMulterError } = require('../middlewares/uploadMiddleware');
const {
  getAllRecipes,
  getRecipeById,
  createRecipe,
  updateRecipe,
  deleteRecipe,
  getPopularRecipes,
  addRecipeFeedback,
  incrementRecipeViews
} = require('../controllers/recipeController');

// Rutas públicas
router.get('/', getAllRecipes);
router.get('/popular', getPopularRecipes);
router.get('/mine', protect, (req, res, next) => {
  req.mineFilter = true;
  next();
}, getAllRecipes);
router.get('/:id', getRecipeById);
router.post('/:id/feedback', addRecipeFeedback);
router.post('/:id/view', incrementRecipeViews);

// Rutas protegidas (requieren autenticación)
router.post('/', protect, uploadRecipeFiles, handleMulterError, createRecipe);
router.put('/:id', protect, uploadRecipeFiles, handleMulterError, updateRecipe);
router.delete('/:id', protect, deleteRecipe);

module.exports = router;
