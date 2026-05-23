/**
 * Componente RecipeCard (Tarjeta de Receta)
 * Muestra una vista previa de una receta individual.
 * Incluye imagen, nombre, descripción y metadatos.
 */
import React from 'react';
import { useTranslation } from 'react-i18next';
import './styles/RecipeCard.css';

function RecipeCard({ recipe, onClick }) {
  const { t } = useTranslation();
  // Clase CSS dinámica basada en la región para estilos específicos
  const regionClass = `region-${recipe.region}`;

  return (
    // Al hacer clic en la tarjeta, se ejecuta la función onClick pasada desde el padre
    <div className={`recipe-card glass-card ${regionClass}`} onClick={() => onClick(recipe)}>
      <div className="recipe-image-container">
        <img 
          src={recipe.image} 
          alt={recipe.name}
          className="recipe-image"
          onError={(e) => {
            // Imagen de respaldo si la imagen principal falla
            e.target.src = 'https://via.placeholder.com/400x300/1e2330/00d4ff?text=' + encodeURIComponent(recipe.name);
          }}
        />
        {/* Badge que muestra la región de la receta */}
        <div className="recipe-region-badge">
          <span className="region-emoji">{getRegionEmoji(recipe.region)}</span>
          <span>{t(`nav.region_${recipe.region}`, getRegionName(recipe.region))}</span>
        </div>
      </div>
      
      <div className="recipe-content">
        <h3 className="recipe-name notranslate">{recipe.name}</h3>
        <p className="recipe-description">{recipe.description}</p>
        
        <button className={`recipe-view-btn btn-3d btn-${recipe.region}`}>
          {t('common.view_recipe', 'Ver receta')}
        </button>
      </div>
    </div>
  );
}

// Funciones Auxiliares para formateo de datos

function getRegionEmoji(region) {
  const emojis = {
    costa: '🌊',
    sierra: '⛰️',
    oriente: '🌳',
    insular: '🏝️'
  };
  return emojis[region] || '🍽️';
}

function getRegionName(region) {
  const names = {
    costa: 'Costa',
    sierra: 'Sierra',
    oriente: 'Oriente',
    insular: 'Insular'
  };
  return names[region] || region;
}



export default RecipeCard;
