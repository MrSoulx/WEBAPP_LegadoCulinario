const { supabase } = require('../config/database');
const { uploadToR2, deleteFromR2, uploadMultipleToR2, deleteMultipleFromR2 } = require('../utils/r2Helper');

// @desc    Obtener todas las recetas
// @route   GET /api/recipes
// @access  Public
exports.getAllRecipes = async (req, res) => {
  try {
    const { page = 1, limit = 100, region_id, provincias_id, search, mine: mineQuery } = req.query;
    const offset = (page - 1) * limit;

    // Soporta mine via query param directo o via middleware (/mine)
    const applyMine = mineQuery === 'true' || req.mineFilter === true;

    let query = supabase
      .from('recetas')
      .select(`
        *,
        regiones (id, name_regiones),
        provincias (id, name_provincias),
        users (id, name, correo)
      `, { count: 'exact' });

    // Filtros
    if (region_id) {
      query = query.eq('region_id', region_id);
    }
    if (provincias_id) {
      query = query.eq('provincias_id', provincias_id);
    }
    if (search) {
      query = query.or(`name.ilike.%${search}%,ingredientes.ilike.%${search}%`);
    }
    if (applyMine && req.user) {
      query = query.eq('created_by', req.user.id);
    }

    // Paginación y ordenamiento
    const { data: recetas, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    res.json({
      success: true,
      data: recetas,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Error en getAllRecipes:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener recetas',
      error: error.message
    });
  }
};

// @desc    Obtener una receta por ID
// @route   GET /api/recipes/:id
// @access  Public
exports.getRecipeById = async (req, res) => {
  try {
    const { id } = req.params;

    const { data: receta, error } = await supabase
      .from('recetas')
      .select(`
        *,
        regiones (id, name_regiones),
        provincias (id, name_provincias),
        feedback (*)
      `)
      .eq('id', id)
      .single();

    if (error || !receta) {
      return res.status(404).json({
        success: false,
        message: 'Receta no encontrada'
      });
    }

    // Incrementar vistas - DESHABILITADO para el panel administrativo
    // Se debe llamar explícitamente desde la app de usuario final o usar un endpoint separado
    // await supabase.rpc('increment_receta_vistas', { receta_id: id });

    res.json({
      success: true,
      data: receta
    });
  } catch (error) {
    console.error('Error en getRecipeById:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener receta',
      error: error.message
    });
  }
};

// @desc    Crear nueva receta
// @route   POST /api/recipes
// @access  Private
exports.createRecipe = async (req, res) => {
  try {
    console.log('📝 createRecipe Body:', req.body);
    console.log('📂 createRecipe Files:', req.files ? Object.keys(req.files) : 'No files');
    if (req.files && req.files.imagenes) console.log('   📸 Imágenes:', req.files.imagenes.length);
    if (req.files && req.files.video) console.log('   🎥 Video:', req.files.video[0].originalname);
    console.log('--- Iniciando Creación de Receta ---');
    console.log('Archivos recibidos:', req.files ? Object.keys(req.files) : 'Ninguno');

    const { name, ingredientes, instrucciones, region_id, provincias_id, tiempo_preparacion, porciones, como_servir, calorias,
      url_foto_direct, public_id_direct, url_video_direct, video_public_id_direct, imagenes_direct } = req.body;

    // Validar campos requeridos
    if (!name || !ingredientes || !instrucciones) {
      return res.status(400).json({
        success: false,
        message: 'Name, ingredientes e instrucciones son requeridos'
      });
    }

    // Inicializar variables con datos directos si existen (preferencia por subida frontend)
    let url_foto = url_foto_direct || null;
    let key_foto = public_id_direct || null;
    let url_video = url_video_direct || null;
    let key_video = video_public_id_direct || null;
    let imagenes_adicionales = imagenes_direct ? (typeof imagenes_direct === 'string' ? JSON.parse(imagenes_direct) : imagenes_direct) : [];

    // Subir imágenes si existen en la request (fallback para subida tradicional)
    if (req.files) {
      if (req.files['imagenes'] && req.files['imagenes'].length > 0) {
        console.log(`📸 Procesando ${req.files['imagenes'].length} imágenes desde el servidor...`);
        const imagePaths = req.files['imagenes'].map(f => f.path);
        const results = await uploadMultipleToR2(imagePaths, 'recetas');
        console.log('📸 Imágenes procesadas correctamente');
        
        url_foto = results[0].url;
        key_foto = results[0].key;
        imagenes_adicionales = results;
      }

      if (req.files['video'] && req.files['video'].length > 0) {
        console.log('🎬 Procesando video desde el servidor...');
        const videoFile = req.files['video'][0];
        const result = await uploadToR2(videoFile.path, 'videos');
        console.log('🎬 Video procesado correctamente');
        url_video = result.url;
        key_video = result.key;
      }
    }

    console.log('💾 Preparando inserción en Supabase...');
    console.log('Datos:', { name, url_foto, url_video, imagenes_count: imagenes_adicionales.length });

    const { data: receta, error } = await supabase
      .from('recetas')
      .insert([{
        name,
        ingredientes,
        instrucciones,
        region_id: region_id ? parseInt(region_id) : null,
        provincias_id: provincias_id ? parseInt(provincias_id) : null,
        url_video,
        video_public_id: key_video,
        url_foto,
        public_id: key_foto,
        tiempo_preparacion,
        porciones,
        como_servir,
        calorias: calorias || null,
        imagenes: imagenes_adicionales,
        created_by: req.user.id
      }])
      .select(`
        *,
        regiones (id, name_regiones),
        provincias (id, name_provincias)
      `)
      .single();

    if (error) throw error;

    res.status(201).json({
      success: true,
      message: 'Receta creada exitosamente',
      data: receta
    });
  } catch (error) {
    console.error('Error en createRecipe:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear receta',
      error: error.message
    });
  }
};

// @desc    Actualizar receta
// @route   PUT /api/recipes/:id
// @access  Private
exports.updateRecipe = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`--- Iniciando Actualización de Receta ID: ${id} ---`);
    console.log('Archivos recibidos:', req.files ? Object.keys(req.files) : 'Ninguno');

    const { name, ingredientes, instrucciones, region_id, provincias_id, tiempo_preparacion, porciones, como_servir, calorias,
      url_foto_direct, public_id_direct, url_video_direct, video_public_id_direct, imagenes_direct } = req.body;

    const { data: recetaActual, error: errorGet } = await supabase
      .from('recetas')
      .select('public_id, video_public_id, url_video, created_by')
      .eq('id', id)
      .single();

    if (errorGet || !recetaActual) {
      return res.status(404).json({
        success: false,
        message: 'Receta no encontrada'
      });
    }

    const isOwner = recetaActual.created_by === req.user.id;
    const isSuperAdmin = req.user.role === 'super_admin';
    if (!isOwner && !isSuperAdmin) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso para editar esta receta'
      });
    }

    const updateData = {};
    if (name) updateData.name = name;
    if (ingredientes) updateData.ingredientes = ingredientes;
    if (instrucciones) updateData.instrucciones = instrucciones;
    if (region_id !== undefined) updateData.region_id = region_id ? parseInt(region_id) : null;
    if (provincias_id !== undefined) updateData.provincias_id = provincias_id ? parseInt(provincias_id) : null;
    if (tiempo_preparacion !== undefined) updateData.tiempo_preparacion = tiempo_preparacion;
    if (porciones !== undefined) updateData.porciones = porciones;
    if (como_servir !== undefined) updateData.como_servir = como_servir;
    if (calorias !== undefined) updateData.calorias = calorias !== '' ? parseInt(calorias, 10) : null;

    // Datos directos desde el frontend (subida a R2)
    if (url_foto_direct) updateData.url_foto = url_foto_direct;
    if (public_id_direct) updateData.public_id = public_id_direct;
    if (url_video_direct) updateData.url_video = url_video_direct;
    if (video_public_id_direct) updateData.video_public_id = video_public_id_direct;
    if (imagenes_direct) updateData.imagenes = typeof imagenes_direct === 'string' ? JSON.parse(imagenes_direct) : imagenes_direct;

    // Procesar archivos si existen
    if (req.files) {
      // Si hay nuevas imágenes
      if (req.files['imagenes'] && req.files['imagenes'].length > 0) {
        console.log(`📸 Actualizando ${req.files['imagenes'].length} imágenes...`);
        // Eliminar imagen principal anterior si existe
        if (recetaActual.public_id) {
          console.log(`🗑️ Eliminando imagen anterior de R2: ${recetaActual.public_id}`);
          await deleteFromR2(recetaActual.public_id);
        }

        const imagePaths = req.files['imagenes'].map(f => f.path);
        const results = await uploadMultipleToR2(imagePaths, 'recetas');
        console.log('📸 Imágenes actualizadas correctamente');
        
        updateData.url_foto = results[0].url;
        updateData.public_id = results[0].key;
        updateData.imagenes = results;
      }

      // Si hay nuevo video
      if (req.files['video'] && req.files['video'].length > 0) {
        console.log('🎬 Actualizando video...');
        const videoFile = req.files['video'][0];
        const result = await uploadToR2(videoFile.path, 'videos');
        console.log('🎬 Video actualizado correctamente');
        updateData.url_video = result.url;
        updateData.video_public_id = result.key;
      }
    }
    console.log('💾 Preparando actualización en Supabase...');
    console.log('Datos de actualización:', JSON.stringify(updateData, null, 2));

    // Actualizar receta en Supabase
    const { data: receta, error } = await supabase
      .from('recetas')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        regiones (id, name_regiones),
        provincias (id, name_provincias)
      `)
      .single();

    if (error) throw error;

    res.json({
      success: true,
      message: 'Receta actualizada exitosamente',
      data: receta
    });
  } catch (error) {
    console.error('Error en updateRecipe:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar receta',
      error: error.message
    });
  }
};

// @desc    Eliminar receta
// @route   DELETE /api/recipes/:id
// @access  Private
exports.deleteRecipe = async (req, res) => {
  try {
    const { id } = req.params;

    console.log(`🔍 Intentando borrar receta con ID: ${id}`);

    const { data: receta, error: errorGet } = await supabase
      .from('recetas')
      .select('public_id, video_public_id, imagenes, created_by')
      .eq('id', id)
      .single();

    if (errorGet) {
      console.error('❌ Error Supabase buscando receta:', errorGet);
    }

    if (errorGet || !receta) {
      console.warn('⚠️ Receta no encontrada o error de DB. ID:', id);
      return res.status(404).json({
        success: false,
        message: 'Receta no encontrada'
      });
    }

    const isOwner = receta.created_by === req.user.id;
    const isSuperAdmin = req.user.role === 'super_admin';
    if (!isOwner && !isSuperAdmin) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso para eliminar esta receta'
      });
    }

    // 1. Eliminar imagen principal
    if (receta.public_id) {
      try {
        console.log(`🗑️ Eliminando imagen principal: ${receta.public_id}`);
        await deleteFromR2(receta.public_id);
      } catch (err) {
        console.warn(`⚠️ No se pudo borrar imagen principal: ${err.message}`);
      }
    }

    // 2. Eliminar video
    if (receta.video_public_id) {
      try {
        console.log(`🗑️ Eliminando video: ${receta.video_public_id}`);
        await deleteFromR2(receta.video_public_id);
      } catch (err) {
        console.warn(`⚠️ No se pudo borrar video: ${err.message}`);
      }
    }

    // 3. Eliminar imágenes de la galería
    if (receta.imagenes && Array.isArray(receta.imagenes)) {
      try {
        const galleryKeys = receta.imagenes.map(img => img.key || img.public_id).filter(id => id);
        if (galleryKeys.length > 0) {
          console.log(`🗑️ Eliminando ${galleryKeys.length} imágenes adicionales...`);
          await deleteMultipleFromR2(galleryKeys);
        }
      } catch (err) {
        console.warn(`⚠️ Error borrando galería: ${err.message}`);
      }
    }

    // Eliminar receta de BD
    const { error } = await supabase
      .from('recetas')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('🔥 Error CRÍTICO Supabase DELETE:', JSON.stringify(error, null, 2));
      throw error;
    }

    res.json({
      success: true,
      message: 'Receta eliminada exitosamente'
    });
  } catch (error) {
    console.error('Error en deleteRecipe:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar receta',
      error: error.message
    });
  }
};

// @desc    Obtener recetas más vistas
// @route   GET /api/recipes/popular
// @access  Public
exports.getPopularRecipes = async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const { data: recetas, error } = await supabase
      .from('recetas')
      .select(`
        *,
        regiones (id, name_regiones),
        provincias (id, name_provincias)
      `)
      .order('vistas', { ascending: false })
      .limit(limit);

    if (error) throw error;

    res.json({
      success: true,
      data: recetas
    });
  } catch (error) {
    console.error('Error en getPopularRecipes:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener recetas populares',
      error: error.message
    });
  }
};

/**
 * @desc    Agregar feedback (comentario y puntuación) a una receta
 * @route   POST /api/recipes/:id/feedback
 * @access  Public
 */
exports.addRecipeFeedback = async (req, res) => {
  try {
    const { id } = req.params;
    const { user_name, correo, comentario, puntuacion } = req.body;

    if (!user_name || !correo || !puntuacion) {
      return res.status(400).json({
        success: false,
        message: 'Nombre, correo y puntuación son obligatorios'
      });
    }

    const { data, error } = await supabase
      .from('feedback')
      .insert([
        { 
          recetas_id: id, 
          user_name, 
          correo, 
          comentario, 
          puntuacion 
        }
      ])
      .select();

    if (error) {
      console.error('Error insertando feedback:', error);
      throw error;
    }

    res.status(201).json({
      success: true,
      data: data[0],
      message: 'Comentario agregado exitosamente'
    });
  } catch (error) {
    console.error('Error en addRecipeFeedback:', error);
    res.status(500).json({
      success: false,
      message: 'Error al agregar comentario',
      error: error.message
    });
  }
};

/**
 * @desc    Incrementar el contador de vistas de una receta
 * @route   POST /api/recipes/:id/view
 * @access  Public
 */
exports.incrementRecipeViews = async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase.rpc('increment_receta_vistas', { receta_id: id });

    if (error) throw error;

    res.json({
      success: true,
      message: 'Vista incrementada correctamente'
    });
  } catch (error) {
    console.error('Error en incrementRecipeViews:', error);
    res.status(500).json({
      success: false,
      message: 'Error al incrementar vistas',
      error: error.message
    });
  }
};
