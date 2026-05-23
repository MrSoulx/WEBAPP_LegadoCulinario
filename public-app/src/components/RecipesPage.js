/**
 * Componente RecipesPage (Página de Recetas)
 * Muestra una lista completa de recetas con opciones de búsqueda y filtrado por región.
 */

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import RecipeCard from './RecipeCard';
import { fetchRecipes } from '../data/recipesData';
import { fetchProvincesData } from '../data/provincesData';
import './styles/RecipesPage.css';

function RecipesPage({ onRecipeClick }) {
  const { t } = useTranslation();
  // Estado para la búsqueda por texto (local, por ahora)
  const [searchQuery, setSearchQuery] = useState('');
  // Estado para el filtro por región
  const [filterRegion, setFilterRegion] = useState('all');
  // Estado para filtro por provincia
  const [filterProvince, setFilterProvince] = useState(null);
  
  // Estado para las recetas cargadas del backend
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(false);
  // Estado para provincias
  const [provincesGrouped, setProvincesGrouped] = useState({});

  /**
   * Cargar provincias al montar
   */
  useEffect(() => {
    fetchProvincesData().then(({ grouped }) => {
      setProvincesGrouped(grouped);
    });
  }, []);

  /**
   * Cargar recetas cada vez que cambia filterRegion
   */
  useEffect(() => {
    setLoading(true);
    // Si 'all', pasamos null como región para traer todas
    const regionParam = filterRegion === 'all' ? null : filterRegion;
    
    fetchRecipes(regionParam)
      .then(data => {
        setRecipes(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error cargando recetas en RecipesPage", err);
        setRecipes([]);
        setLoading(false);
      });
  }, [filterRegion]);

  /**
   * Filtra las recetas localmente basándose en el texto de búsqueda.
   * (La región ya se filtró en el backend al cargar)
   */
  const getFilteredRecipes = () => {
    let filtered = recipes;

    // Filtrar por texto de búsqueda (nombre o descripción)
    if (searchQuery.trim()) {
      filtered = filtered.filter(recipe => 
        recipe.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        recipe.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filtrar por Provincia (si está seleccionada)
    if (filterProvince && filterRegion !== 'all') {
      const currentRegionProvinces = provincesGrouped[filterRegion] || [];
      filtered = filtered.filter(r => 
        (r.province === filterProvince) || 
        (r.province_id === filterProvince) ||
        (r.provincia?.toLowerCase() === currentRegionProvinces.find(p => p.id === filterProvince)?.name.toLowerCase())
      );
    }

    return filtered;
  };

  const filteredRecipes = getFilteredRecipes();

  return (
    <div className="recipes-page container">
      {/* Encabezado de la página */}
      <div className="recipes-header">
        <h1 className="page-title">{t('recipes.title')}</h1>
        <p className="page-subtitle">{t('recipes.subtitle', 'Explora recetas tradicionales de todo el Ecuador')}</p>
      </div>

      {/* Barra de Búsqueda y Filtros */}
      <div className="search-bar glass-card">
        {/* Input de búsqueda */}
        <div className="search-input-wrapper">
          <input
            type="text"
            className="search-input"
            placeholder={t('recipes.search_placeholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <span className="search-icon">🔍</span>
        </div>

        {/* Botones de filtro por región */}
        <div className="filter-buttons">
          <button
            className={`filter-btn ${filterRegion === 'all' ? 'active' : ''}`}
            onClick={() => { setFilterRegion('all'); setFilterProvince(null); }}
          >
            {t('home.all')}
          </button>
          <button
            className={`filter-btn btn-costa ${filterRegion === 'costa' ? 'active' : ''}`}
            onClick={() => { setFilterRegion('costa'); setFilterProvince(null); }}
          >
            🌊 {t('nav.region_costa')}
          </button>
          <button
            className={`filter-btn btn-sierra ${filterRegion === 'sierra' ? 'active' : ''}`}
            onClick={() => { setFilterRegion('sierra'); setFilterProvince(null); }}
          >
            ⛰️ {t('nav.region_sierra')}
          </button>
          <button
            className={`filter-btn btn-oriente ${filterRegion === 'oriente' ? 'active' : ''}`}
            onClick={() => { setFilterRegion('oriente'); setFilterProvince(null); }}
          >
            🌳 {t('nav.region_oriente')}
          </button>
          <button
            className={`filter-btn btn-insular ${filterRegion === 'insular' ? 'active' : ''}`}
            onClick={() => { setFilterRegion('insular'); setFilterProvince(null); }}
          >
            🏝️ {t('nav.region_insular')}
          </button>
        </div>
        
        {/* Filtros de Provincia (Sólo si hay región seleccionada) */}
        {filterRegion !== 'all' && (
          <div className="province-filters-row">
            <div className="province-filter-header">
              <h4 className="province-filter-label">{t('home.filter_by_province')}</h4>
              <button
                 className={`province-chip-all ${!filterProvince ? 'active' : ''}`}
                 onClick={() => setFilterProvince(null)}
              >
                {t('home.view_all')}
              </button>
            </div>
            
            <div className="provinces-list">
              {(provincesGrouped[filterRegion] || []).map(province => {
                const count = recipes.filter(r => 
                  (r.province === province.id) || 
                  (r.province_id === province.id) ||
                  (r.provincia?.toLowerCase() === province.name.toLowerCase())
                ).length;
                
                return (
                  <button
                    key={province.id}
                    className={`province-chip ${filterProvince === province.id ? 'active' : ''} ${count === 0 ? 'disabled' : ''}`}
                    onClick={() => count > 0 && setFilterProvince(province.id)}
                    disabled={count === 0}
                    title={province.name}
                  >
                     {province.name} ({count})
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Resultados de la búsqueda */}
      <div className="recipes-results">
        <p className="results-count">
          {filteredRecipes.length} {t('recipes.found_count', 'recetas encontradas')}
        </p>

        {loading ? (
           <div style={{ textAlign: 'center', padding: '3rem' }}>
              <h3>{t('common.loading')}</h3>
           </div>
        ) : filteredRecipes.length > 0 ? (
          <div className="recipes-grid grid grid-3">
            {filteredRecipes.map(recipe => (
              <RecipeCard 
                key={recipe.id}
                recipe={recipe}
                onClick={onRecipeClick}
              />
            ))}
          </div>
        ) : (
          <div className="no-results glass-card">
            <h3>😔 {t('recipes.no_results')}</h3>
            <p>{t('recipes.no_results_desc')}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default RecipesPage;
