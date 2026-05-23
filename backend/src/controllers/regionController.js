const { supabase } = require('../config/database');

// @desc    Obtener todas las regiones
// @route   GET /api/regions
// @access  Public
exports.getAllRegions = async (req, res) => {
  try {
    const { data: regiones, error } = await supabase
      .from('regiones')
      .select('*')
      .order('id', { ascending: true });

    if (error) throw error;

    res.json({
      success: true,
      data: regiones
    });
  } catch (error) {
    console.error('Error en getAllRegions:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener regiones',
      error: error.message
    });
  }
};

// @desc    Obtener una región por ID
// @route   GET /api/regions/:id
// @access  Public
exports.getRegionById = async (req, res) => {
  try {
    const { id } = req.params;

    const { data: region, error } = await supabase
      .from('regiones')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !region) {
      return res.status(404).json({
        success: false,
        message: 'Región no encontrada'
      });
    }

    res.json({
      success: true,
      data: region
    });
  } catch (error) {
    console.error('Error en getRegionById:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener región',
      error: error.message
    });
  }
};

// @desc    Obtener provincias de una región
// @route   GET /api/regions/:id/provinces
// @access  Public
exports.getProvincesByRegion = async (req, res) => {
  try {
    const { id } = req.params;

    const { data: provincias, error } = await supabase
      .from('provincias')
      .select('*')
      .eq('region_id', id)
      .order('name_provincias', { ascending: true });

    if (error) throw error;

    res.json({
      success: true,
      data: provincias
    });
  } catch (error) {
    console.error('Error en getProvincesByRegion:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener provincias',
      error: error.message
    });
  }
};

// @desc    Crear nueva región
// @route   POST /api/regions
// @access  Private (Admin)
exports.createRegion = async (req, res) => {
  try {
    const { name_regiones } = req.body;

    if (!name_regiones) {
      return res.status(400).json({
        success: false,
        message: 'El nombre de la región es requerido'
      });
    }

    const { data: region, error } = await supabase
      .from('regiones')
      .insert([{ name_regiones }])
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({
      success: true,
      message: 'Región creada exitosamente',
      data: region
    });
  } catch (error) {
    console.error('Error en createRegion:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear región',
      error: error.message
    });
  }
};

// @desc    Actualizar región
// @route   PUT /api/regions/:id
// @access  Private (Admin)
exports.updateRegion = async (req, res) => {
  try {
    const { id } = req.params;
    const { name_regiones } = req.body;

    if (!name_regiones) {
      return res.status(400).json({
        success: false,
        message: 'El nombre de la región es requerido'
      });
    }

    const { data: region, error } = await supabase
      .from('regiones')
      .update({ name_regiones })
      .eq('id', id)
      .select()
      .single();

    if (error || !region) {
      return res.status(404).json({
        success: false,
        message: 'Región no encontrada'
      });
    }

    res.json({
      success: true,
      message: 'Región actualizada exitosamente',
      data: region
    });
  } catch (error) {
    console.error('Error en updateRegion:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar región',
      error: error.message
    });
  }
};

// @desc    Eliminar región
// @route   DELETE /api/regions/:id
// @access  Private (Admin)
exports.deleteRegion = async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('regiones')
      .delete()
      .eq('id', id);

    if (error) throw error;

    res.json({
      success: true,
      message: 'Región eliminada exitosamente'
    });
  } catch (error) {
    console.error('Error en deleteRegion:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar región',
      error: error.message
    });
  }
};
