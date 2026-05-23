const { supabase } = require('../config/database');

// @desc    Obtener todo el feedback
// @route   GET /api/feedback
// @access  Public
exports.getAllFeedback = async (req, res) => {
  try {
    const { recetas_id, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    let query = supabase
      .from('feedback')
      .select(`
        *,
        recetas (id, name)
      `, { count: 'exact' });

    if (recetas_id) {
      query = query.eq('recetas_id', recetas_id);
    }

    const { data: feedback, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    res.json({
      success: true,
      data: feedback,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Error en getAllFeedback:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener feedback',
      error: error.message
    });
  }
};

// @desc    Obtener feedback de una receta
// @route   GET /api/feedback/recipe/:recetaId
// @access  Public
exports.getFeedbackByRecipe = async (req, res) => {
  try {
    const { recetaId } = req.params;

    const { data: feedback, error } = await supabase
      .from('feedback')
      .select('*')
      .eq('recetas_id', recetaId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Calcular estadísticas
    const stats = {
      total: feedback.length,
      promedio: feedback.length > 0 
        ? (feedback.reduce((sum, f) => sum + f.puntuacion, 0) / feedback.length).toFixed(1)
        : 0,
      distribucion: {
        5: feedback.filter(f => f.puntuacion === 5).length,
        4: feedback.filter(f => f.puntuacion === 4).length,
        3: feedback.filter(f => f.puntuacion === 3).length,
        2: feedback.filter(f => f.puntuacion === 2).length,
        1: feedback.filter(f => f.puntuacion === 1).length
      }
    };

    res.json({
      success: true,
      data: feedback,
      stats
    });
  } catch (error) {
    console.error('Error en getFeedbackByRecipe:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener feedback',
      error: error.message
    });
  }
};

// @desc    Crear nuevo feedback
// @route   POST /api/feedback
// @access  Public
exports.createFeedback = async (req, res) => {
  try {
    const { user_name, correo, comentario, puntuacion, recetas_id } = req.body;

    // Validar campos requeridos
    if (!user_name || !correo || !puntuacion || !recetas_id) {
      return res.status(400).json({
        success: false,
        message: 'user_name, correo, puntuacion y recetas_id son requeridos'
      });
    }

    // Validar puntuación
    if (puntuacion < 1 || puntuacion > 5) {
      return res.status(400).json({
        success: false,
        message: 'La puntuación debe estar entre 1 y 5'
      });
    }

    // Verificar que la receta existe
    const { data: receta, error: errorReceta } = await supabase
      .from('recetas')
      .select('id')
      .eq('id', recetas_id)
      .single();

    if (errorReceta || !receta) {
      return res.status(404).json({
        success: false,
        message: 'Receta no encontrada'
      });
    }

    // Crear feedback
    const { data: feedback, error } = await supabase
      .from('feedback')
      .insert([{
        user_name,
        correo,
        comentario: comentario || null,
        puntuacion,
        recetas_id
      }])
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({
      success: true,
      message: 'Feedback creado exitosamente',
      data: feedback
    });
  } catch (error) {
    console.error('Error en createFeedback:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear feedback',
      error: error.message
    });
  }
};

// @desc    Actualizar feedback
// @route   PUT /api/feedback/:id
// @access  Private
exports.updateFeedback = async (req, res) => {
  try {
    const { id } = req.params;
    const { comentario, puntuacion } = req.body;

    const updateData = {};
    if (comentario !== undefined) updateData.comentario = comentario;
    if (puntuacion !== undefined) {
      if (puntuacion < 1 || puntuacion > 5) {
        return res.status(400).json({
          success: false,
          message: 'La puntuación debe estar entre 1 y 5'
        });
      }
      updateData.puntuacion = puntuacion;
    }

    const { data: feedback, error } = await supabase
      .from('feedback')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error || !feedback) {
      return res.status(404).json({
        success: false,
        message: 'Feedback no encontrado'
      });
    }

    res.json({
      success: true,
      message: 'Feedback actualizado exitosamente',
      data: feedback
    });
  } catch (error) {
    console.error('Error en updateFeedback:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar feedback',
      error: error.message
    });
  }
};

// @desc    Eliminar feedback
// @route   DELETE /api/feedback/:id
// @access  Private
exports.deleteFeedback = async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('feedback')
      .delete()
      .eq('id', id);

    if (error) throw error;

    res.json({
      success: true,
      message: 'Feedback eliminado exitosamente'
    });
  } catch (error) {
    console.error('Error en deleteFeedback:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar feedback',
      error: error.message
    });
  }
};
