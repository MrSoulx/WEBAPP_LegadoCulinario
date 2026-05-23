const { supabase } = require('../config/database');

// @desc    Obtener todas las provincias
// @route   GET /api/provinces
// @access  Public
exports.getAllProvinces = async (req, res) => {
  try {
    const { region_id } = req.query;

    let query = supabase
      .from('provincias')
      .select(`
        *,
        regiones (id, name_regiones)
      `);

    if (region_id) {
      query = query.eq('region_id', region_id);
    }

    const { data: provincias, error } = await query
      .order('name_provincias', { ascending: true });

    if (error) throw error;

    res.json({
      success: true,
      data: provincias
    });
  } catch (error) {
    console.error('Error en getAllProvinces:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener provincias',
      error: error.message
    });
  }
};

// @desc    Obtener una provincia por ID
// @route   GET /api/provinces/:id
// @access  Public
exports.getProvinceById = async (req, res) => {
  try {
    const { id } = req.params;

    const { data: provincia, error } = await supabase
      .from('provincias')
      .select(`
        *,
        regiones (id, name_regiones)
      `)
      .eq('id', id)
      .single();

    if (error || !provincia) {
      return res.status(404).json({
        success: false,
        message: 'Provincia no encontrada'
      });
    }

    res.json({
      success: true,
      data: provincia
    });
  } catch (error) {
    console.error('Error en getProvinceById:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener provincia',
      error: error.message
    });
  }
};

// @desc    Crear nueva provincia
// @route   POST /api/provinces
// @access  Private (Admin)
exports.createProvince = async (req, res) => {
  try {
    const { name_provincias, region_id } = req.body;

    if (!name_provincias) {
      return res.status(400).json({
        success: false,
        message: 'El nombre de la provincia es requerido'
      });
    }

    const { data: provincia, error } = await supabase
      .from('provincias')
      .insert([{ name_provincias, region_id: region_id || null }])
      .select(`
        *,
        regiones (id, name_regiones)
      `)
      .single();

    if (error) throw error;

    res.status(201).json({
      success: true,
      message: 'Provincia creada exitosamente',
      data: provincia
    });
  } catch (error) {
    console.error('Error en createProvince:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear provincia',
      error: error.message
    });
  }
};

// @desc    Actualizar provincia
// @route   PUT /api/provinces/:id
// @access  Private (Admin)
exports.updateProvince = async (req, res) => {
  try {
    const { id } = req.params;
    const { name_provincias, region_id } = req.body;

    const updateData = {};
    if (name_provincias) updateData.name_provincias = name_provincias;
    if (region_id !== undefined) updateData.region_id = region_id || null;

    const { data: provincia, error } = await supabase
      .from('provincias')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        regiones (id, name_regiones)
      `)
      .single();

    if (error || !provincia) {
      return res.status(404).json({
        success: false,
        message: 'Provincia no encontrada'
      });
    }

    res.json({
      success: true,
      message: 'Provincia actualizada exitosamente',
      data: provincia
    });
  } catch (error) {
    console.error('Error en updateProvince:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar provincia',
      error: error.message
    });
  }
};

// @desc    Eliminar provincia
// @route   DELETE /api/provinces/:id
// @access  Private (Admin)
exports.deleteProvince = async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('provincias')
      .delete()
      .eq('id', id);

    if (error) throw error;

    res.json({
      success: true,
      message: 'Provincia eliminada exitosamente'
    });
  } catch (error) {
    console.error('Error en deleteProvince:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar provincia',
      error: error.message
    });
  }
};
