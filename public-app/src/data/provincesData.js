import { API_BASE_URL } from './apiClient';

const API_URL = API_BASE_URL + '/provinces';

// Mapa de IDs de regiones (Frontend Slug -> Backend ID)
export const REGION_IDS = {
  costa: 1,
  sierra: 2,
  oriente: 3,
  insular: 4
};

// Mapa inverso (Backend ID -> Frontend Slug)
export const REGION_SLUGS = {
  1: 'costa',
  2: 'sierra',
  3: 'oriente',
  4: 'insular'
};

/**
 * Normaliza el nombre de la provincia para generar el ID (slug) usado en el frontend.
 * Maneja casos especiales y acentos.
 */
export const getProvinceSlug = (name) => {
  if (name === "Santo Domingo de los Tsáchilas") return "santo_domingo";
  
  return name.toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // Eliminar acentos
    .replace(/\s+/g, '_'); // Espacios a guiones bajos
};

/**
 * Obtiene todas las provincias desde el backend.
 * Retorna las provincias organizadas por región (como lo espera el frontend antiguo)
 * y una lista plana.
 */
export const fetchProvincesData = async () => {
    try {
        const response = await fetch(API_URL);
        if (!response.ok) throw new Error('Error fetching provinces');
        const result = await response.json();
        
        if (!result.success) throw new Error(result.message);
        
        const dbProvinces = result.data;
        
        // Estructura agrupada por región (para compatibilidad)
        const grouped = {
            costa: [],
            sierra: [],
            oriente: [],
            insular: []
        };
        
        const flat = [];

        dbProvinces.forEach(p => {
            const slug = getProvinceSlug(p.name_provincias);
            const regionSlug = REGION_SLUGS[p.region_id];
            
            const provinceObj = {
                id: slug, // ID string para compatibilidad con mapa y frontend actual
                db_id: p.id, // ID numérico original
                name: p.name_provincias,
                region: regionSlug,
                // capital: p.capital // La base de datos no tiene capital actualmente
            };
            
            flat.push(provinceObj);
            
            if (grouped[regionSlug]) {
                grouped[regionSlug].push(provinceObj);
            }
        });

        return { grouped, flat };

    } catch (error) {
        console.error("Error fetching provinces data:", error);
        return { grouped: {}, flat: [] };
    }
};
