const { supabase } = require('../config/database');

// @desc    Obtener estadísticas del dashboard
// @route   GET /api/dashboard/stats
// @access  Private (Admin)
exports.getStats = async (req, res) => {
  try {
    // Base query builder para filtrar por usuario si aplica
    const userFilter = (query) => {
      if (req.query.mine === 'true' && req.user) {
        return query.eq('created_by', req.user.id);
      }
      return query;
    };

    // 1. Total recetas (propias o globales)
    let countQuery = supabase.from('recetas').select('*', { count: 'exact', head: true });
    countQuery = userFilter(countQuery);
    const { count: totalRecetas } = await countQuery;

    // 2. Receta más vista (propias o global)
    let topQuery = supabase
      .from('recetas')
      .select('name, vistas')
      .order('vistas', { ascending: false })
      .limit(1);
    topQuery = userFilter(topQuery);
    const { data: recetaTop } = await topQuery.single();

    // 3. Feedback total en mis recetas
    let feedbackCount = 0;
    if (req.query.mine === 'true' && req.user) {
      const { data: myRecipeIds } = await supabase
        .from('recetas')
        .select('id')
        .eq('created_by', req.user.id);
      if (myRecipeIds && myRecipeIds.length > 0) {
        const ids = myRecipeIds.map(r => r.id);
        const { count } = await supabase
          .from('feedback')
          .select('*', { count: 'exact', head: true })
          .in('recetas_id', ids);
        feedbackCount = count || 0;
      }
    } else {
      const { count } = await supabase
        .from('feedback')
        .select('*', { count: 'exact', head: true });
      feedbackCount = count || 0;
    }

    // 4. Lógica del Gráfico
    const regionFilter = req.query.region;
    let chartData = [];

    if (regionFilter && regionFilter !== 'General') {
      const { data: regionData } = await supabase
        .from('regiones')
        .select('id, name_regiones')
        .ilike('name_regiones', regionFilter)
        .single();
      
      if (regionData) {
        let topQuery = supabase
          .from('recetas')
          .select('name, vistas')
          .eq('region_id', regionData.id)
          .order('vistas', { ascending: false })
          .limit(5);
        topQuery = userFilter(topQuery);
        const { data: topRegionRecipes } = await topQuery;

        if (topRegionRecipes && topRegionRecipes.length > 0) {
           chartData = topRegionRecipes.map(recipe => ({
             region: regionData.name_regiones,
             recipeName: recipe.name,
             vistas: recipe.vistas
           }));
        } else {
           chartData = [{ region: regionData.name_regiones, recipeName: 'Sin datos', vistas: 0 }];
        }
      }
    } else {
      const { data: regiones } = await supabase
        .from('regiones')
        .select('id, name_regiones');

      for (const region of regiones) {
        let topQuery = supabase
          .from('recetas')
          .select('name, vistas')
          .eq('region_id', region.id)
          .order('vistas', { ascending: false })
          .limit(1);
        topQuery = userFilter(topQuery);
        const { data: topRecipe } = await topQuery;

        if (topRecipe && topRecipe.length > 0) {
          chartData.push({
            region: region.name_regiones,
            recipeName: topRecipe[0].name,
            vistas: topRecipe[0].vistas
          });
        } else {
          chartData.push({
            region: region.name_regiones,
            recipeName: 'Sin datos',
            vistas: 0
          });
        }
      }
    }

    // 5. Vistas totales
    let vistasQuery = supabase.from('recetas').select('vistas');
    vistasQuery = userFilter(vistasQuery);
    const { data: todasRecetas } = await vistasQuery;
    
    const totalVistas = todasRecetas
      ? todasRecetas.reduce((sum, item) => sum + (item.vistas || 0), 0)
      : 0;

    res.json({
      success: true,
      data: {
        totals: {
          recetas: totalRecetas || 0,
          vistasGlobales: totalVistas,
          feedbackTotal: feedbackCount,
          topRecipe: recetaTop || null
        },
        chartData: chartData
      }
    });
  } catch (error) {
    console.error('Error en getStats:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener estadísticas',
      error: error.message
    });
  }
};
