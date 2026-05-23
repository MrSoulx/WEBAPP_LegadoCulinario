/**
 * Componente Home (Página de Inicio)
 * Muestra el mapa interactivo de Ecuador y permite navegar por regiones para ver recetas.
 */

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { fetchProvincesData } from '../data/provincesData';
import { getRecipesByRegion } from '../data/recipesData';
import RecipeCard from './RecipeCard';
import EcuadorMap from './EcuadorMap';
import './styles/Home.css';

function Home({ onRecipeClick }) {
  const { t } = useTranslation();
  
  // Estado para controlar qué región está seleccionada en el mapa
  const [selectedRegion, setSelectedRegion] = useState(() => {
    return localStorage.getItem('home_selectedRegion') || null;
  });
  
  const [selectedProvince, setSelectedProvince] = useState(() => {
    return localStorage.getItem('home_selectedProvince') || null;
  });
  
  // Estado para las recetas de la región seleccionada recuperadas del backend
  const [regionRecipes, setRegionRecipes] = useState([]);
  const [loading, setLoading] = useState(false);
  // Estado para provincias
  const [provincesGrouped, setProvincesGrouped] = useState({});

  useEffect(() => {
    fetchProvincesData().then(({ grouped }) => {
      setProvincesGrouped(grouped);
    });
  }, []);

  // Datos estáticos de las regiones para visualización
  const regions = [
    { id: 'costa', name: t('nav.region_costa', 'Costa'), color: 'costa' },
    { id: 'sierra', name: t('nav.region_sierra', 'Sierra'), color: 'sierra' },
    { id: 'oriente', name: t('nav.region_oriente', 'Oriente'), color: 'oriente' },
    { id: 'insular', name: t('nav.region_insular', 'Insular'), color: 'insular' }
  ];


  /**
   * Efecto para cargar recetas y persistir estado cuando cambia la región.
   */
  useEffect(() => {
    // Persistir región
    if (selectedRegion) {
      localStorage.setItem('home_selectedRegion', selectedRegion);
    } else {
      localStorage.removeItem('home_selectedRegion');
      localStorage.removeItem('home_selectedProvince'); // Limpiar provincia si no hay región
    }

    if (selectedRegion) {
      setLoading(true);
      
      getRecipesByRegion(selectedRegion)
        .then(data => {
          setRegionRecipes(data);
          setLoading(false);
        })
        .catch(err => {
          console.error("Error cargando recetas:", err);
          setLoading(false);
        });
    } else {
      setRegionRecipes([]);
    }
  }, [selectedRegion, t]);

  /**
   * Efecto para persistir la provincia seleccionada
   */
  useEffect(() => {
    if (selectedProvince) {
      localStorage.setItem('home_selectedProvince', selectedProvince);
    } else {
      localStorage.removeItem('home_selectedProvince');
    }
  }, [selectedProvince]);


  /**
   * Maneja el clic en una región del mapa.
   * Ahora solo selecciona/deselecciona la región, no navega a recetas.
   */
  const handleRegionClick = (regionId) => {
    // Si regionId es null, deseleccionar (usado por doble click)
    if (regionId === null) {
      setSelectedRegion(null);
      setSelectedProvince(null);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    
    // Alternar selección: si clic en la ya seleccionada, deseleccionar.
    if (selectedRegion === regionId) {
      setSelectedRegion(null);
      setSelectedProvince(null); // Resetear provincia al cerrar región
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      setSelectedRegion(regionId);
      setSelectedProvince(null); // Resetear provincia al cambiar región
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  /**
   * Maneja el clic en una provincia específica.
   * Esto carga las recetas de esa provincia.
   */
  const handleProvinceClick = (provinceId, regionId) => {
    console.log('🏠 Home recibió click de provincia:', provinceId, 'región:', regionId);
    setSelectedProvince(provinceId);
    // Scroll suave al inicio de la página
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };


  /**
   * Obtiene las recetas correspondientes a la región seleccionada.
   */
  const getDisplayedRecipes = () => {
    if (!selectedProvince) return regionRecipes;
    const currentRegionProvinces = provincesGrouped[selectedRegion] || [];
    return regionRecipes.filter(r => 
      (r.province === selectedProvince) || 
      (r.province_id === selectedProvince) ||
      (r.provincia?.toLowerCase() === currentRegionProvinces.find(p => p.id === selectedProvince)?.name.toLowerCase())
    );
  };

  const displayedRecipes = getDisplayedRecipes();

  return (
    <div className="home-page">
      {/* Mostrar Mapa siempre, pero solo si NO hay provincia seleccionada */}
      {!selectedProvince && (
        <>
          {/* Sección del Mapa Interactivo */}
          <section className="map-section container" style={{ paddingTop: '2rem' }}>
            <EcuadorMap 
              selectedRegion={selectedRegion} 
              onRegionClick={handleRegionClick}
              onProvinceClick={handleProvinceClick}
            />
          </section>
        </>
      )}

      {/* Sección de Recetas - Se muestra cuando una provincia es seleccionada */}
      {selectedProvince && selectedRegion && (
        <section className="region-detail-view container fade-in">
          <div className="region-recipes-container">
            {/* Navegación (Breadcrumb) para volver al mapa */}
            <div className="breadcrumb">
              <button onClick={() => setSelectedProvince(null)} className="breadcrumb-btn">
                ← {t('common.back_to_map', 'Regresar al mapa')}
              </button>
            </div>

            <h2 className="section-title">
              {t('common.recipes_of', 'Recetas de')} {
                selectedProvince 
                  ? (provincesGrouped[selectedRegion]?.find(p => p.id === selectedProvince)?.name || selectedProvince)
                  : t(`nav.region_${selectedRegion}`, regions.find(r => r.id === selectedRegion)?.name)
              }
            </h2>
            
            {/* Grid de recetas */}
            {loading ? (
              <div className="loading-container" style={{ textAlign: 'center', padding: '2rem' }}>
                <h3>{t('common.loading', 'Cargando recetas...')}</h3>
              </div>
            ) : displayedRecipes.length > 0 ? (
              <div className="recipes-grid grid grid-3">
                {displayedRecipes.map(recipe => (
                  <RecipeCard 
                    key={recipe.id}
                    recipe={recipe}
                    onClick={onRecipeClick}
                  />
                ))}
              </div>
            ) : (
              <div className="no-recipes-message glass-card">
                <h3>😔 {t('recipes.no_available', 'No hay recetas disponibles')}</h3>
                <p>{t('recipes.no_results_desc', 'Aún no tenemos recetas registradas para esta región en nuestra base de datos.')}</p>
                <button 
                  className="btn-3d btn-costa"
                  onClick={() => onRecipeClick('suggestions')}
                >
                  {t('home.share_recipe', '¡Comparte una receta!')}
                </button>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Sección CTA (Llamada a la acción) - Solo visible cuando no hay región seleccionada */}
      {!selectedRegion && (
        <section className="cta-section glass-card container">
          <h2>{t('home.cta_title', '¿Tienes una receta ecuatoriana que compartir?')}</h2>
          <p>{t('home.cta_subtitle', 'Comparte tus recetas tradicionales y ayúdanos a preservar la gastronomía ecuatoriana')}</p>
          <button className="btn-3d btn-insular" onClick={() => onRecipeClick('suggestions')}>
            {t('home.cta_button', 'Compartir receta')}
          </button>
        </section>
      )}
    </div>
  );
}

export default Home;
