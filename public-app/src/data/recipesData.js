import { API_BASE_URL } from './apiClient';

const API_URL = API_BASE_URL + '/recipes';

/**
 * Mapeo de nombres de regiones a IDs de la base de datos
 */
const REGION_MAP = {
  'costa': 1,
  'sierra': 2,
  'oriente': 3,
  'insular': 4
};

/**
 * Transforma los datos del backend al formato esperado por el frontend
 */
const transformRecipe = (recipe) => {
  if (!recipe) return null;
  
  return {
    ...recipe,
    // Mapear campos del backend al frontend
    image: recipe.url_foto || recipe.image,
    region: recipe.regiones?.name_regiones?.toLowerCase() || recipe.region,
    province: recipe.provincias?.name_provincias || recipe.province,
    provincia: recipe.provincias?.name_provincias || recipe.provincia,
    province_id: recipe.provincias_id || recipe.province_id,
    
    // Campos de detalle extendido
    ingredients: recipe.ingredientes ? recipe.ingredientes.split(/\r?\n/).filter(line => line.trim() !== '') : [],
    instructions: recipe.instrucciones || recipe.instructions,
    servings: recipe.porciones || recipe.servings,
    preparationTime: recipe.tiempo_preparacion || recipe.preparationTime,
    calorias: recipe.calorias || null,
    howToServe: recipe.como_servir || recipe.howToServe,
    comments: recipe.feedback || recipe.comments || [],
    
    // Generar descripción si no existe (primeras líneas de ingredientes)
    description: recipe.description || recipe.ingredientes?.split('\n').slice(0, 2).join(' ').substring(0, 150) + '...' || 'Deliciosa receta ecuatoriana',
  };
};

// Exportamos un array vacío para mantener compatibilidad temporal si algo importa 'recipes' directamente,
// pero idealmente todo debería usar las funciones asíncronas.
export const recipes = [];

/**
 * Obtiene recetas desde el backend filtrando por región o provincia.
 * @param {string} region - La región a filtrar (opcional).
 * @param {string} province - La provincia a filtrar (opcional).
 * @returns {Promise<Array>} Promesa que resuelve a un array de recetas.
 */
export const fetchRecipes = async (region = null, province = null) => {
  try {
    let url = API_URL;
    const params = new URLSearchParams();
    // Convertir nombre de región a ID si es un string
    if (region) {
      const regionId = typeof region === 'string' ? REGION_MAP[region.toLowerCase()] : region;
      if (regionId) params.append('region_id', regionId);
    }
    if (province) params.append('provincias_id', province);
    
    if (params.toString()) {
      url += `?${params.toString()}`;
    }

    const response = await fetch(url);
    if (!response.ok) throw new Error('Error al conectar con el servidor de recetas');
    
    const result = await response.json();
    // El backend devuelve { success, data, pagination }
    // Extraemos solo el array de recetas
    const recipes = result.data || [];
    return recipes.map(transformRecipe);
  } catch (error) {
    console.error('Error fetching recipes:', error);
    return [];
  }
};

/**
 * Filtra las recetas por región (Ahora usa fetchRecipes).
 */
export const getRecipesByRegion = async (region) => {
  return await fetchRecipes(region);
};

/**
 * Filtra las recetas por provincia (Ahora usa fetchRecipes).
 */
export const getRecipesByProvince = async (provinceId) => {
  return await fetchRecipes(null, provinceId);
};

/**
 * Obtiene el detalle de una receta por ID desde el backend.
 */
export const getRecipeById = async (recipeId) => {
  try {
    const response = await fetch(`${API_URL}/${recipeId}`);
    if (!response.ok) throw new Error(`Error ${response.status}: receta no encontrada`);
    const result = await response.json();
    return transformRecipe(result.data);
  } catch (error) {
    console.error('Error fetching recipe detail:', error);
    return null;
  }
};

/**
 * Función de búsqueda (se implementará en backend más adelante, 
 * por ahora puede filtrar localmente lo que traiga, pero 
 * lo ideal es un endpoint de búsqueda).
 */
export const searchRecipes = async (query) => {
  // TODO: Implementar búsqueda en backend
  console.warn("Búsqueda global aún no implementada en backend");
  return [];
}
