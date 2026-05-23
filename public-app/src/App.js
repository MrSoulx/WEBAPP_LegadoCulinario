import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import './App.css';

// Importación de componentes de páginas y secciones
import Navigation from './components/Navigation';
import Home from './components/Home';
import RecipesPage from './components/RecipesPage';
import AboutPage from './components/AboutPage';
import SuggestionsPage from './components/SuggestionsPage';
import LandingPage from './components/LandingPage';

// Importación de funciones auxiliares para obtener datos
import { getRecipeById } from './data/recipesData';
import { API_BASE_URL } from './data/apiClient';
import { translateRecipe } from './data/translateService';

function App() {
  const { t } = useTranslation();
  
  // Estado para controlar la página actual que se muestra (con persistencia)
  const [currentPage, setCurrentPage] = useState(() => {
    // Si no ha empezado nunca (primera visita), forzar landing
    if (!localStorage.getItem('hasStarted')) {
       return 'landing';
    }
    return localStorage.getItem('currentPage') || 'home';
  });
  
  // Estado para la receta seleccionada (modal)
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [commentRating, setCommentRating] = useState(5);
  const [notification, setNotification] = useState({ show: false, message: '', type: '' });
  const [resetKey, setResetKey] = useState(0);

  // Estados para Inteligencia Artificial y Geocalización
  const [userCountry, setUserCountry] = useState(() => {
    return localStorage.getItem('simulatedCountry') || 'Estados Unidos';
  });
  const [simulationEnabled, setSimulationEnabled] = useState(() => {
    return localStorage.getItem('simulationEnabled') !== 'false'; // default true
  });
  const [realCountry, setRealCountry] = useState(null);
  const [aiSubstitutes, setAiSubstitutes] = useState([]);
  const [isAiLoading, setIsAiLoading] = useState(false);

  // Leer país desde URL params (cuando viene del simulador)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const country = params.get('country');
    const sim = params.get('sim');
    if (country) {
      localStorage.setItem('simulatedCountry', country);
      setUserCountry(country);
    }
    if (sim !== null) {
      const enabled = sim === 'true';
      localStorage.setItem('simulationEnabled', String(enabled));
      setSimulationEnabled(enabled);
    }
    // Limpiar URL sin recargar
    if (country || sim !== null) {
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  // Persistir la página actual
  useEffect(() => {
    localStorage.setItem('currentPage', currentPage);
  }, [currentPage]);

  // Persistir simulación
  useEffect(() => {
    localStorage.setItem('simulationEnabled', simulationEnabled);
  }, [simulationEnabled]);

  // Sincronizar país desde localStorage al enfocar la ventana (viniendo del simulador)
  useEffect(() => {
    const syncFromStorage = () => {
      const stored = localStorage.getItem('simulatedCountry');
      if (stored && stored !== userCountry) {
        setUserCountry(stored);
      }
      const sim = localStorage.getItem('simulationEnabled');
      setSimulationEnabled(sim !== 'false');
    };
    window.addEventListener('focus', syncFromStorage);
    // También escuchar storage event por si otra pestaña cambia los valores
    window.addEventListener('storage', syncFromStorage);
    return () => {
      window.removeEventListener('focus', syncFromStorage);
      window.removeEventListener('storage', syncFromStorage);
    };
  }, [userCountry]);

  // Detectar ubicación real cuando la simulación está desactivada
  useEffect(() => {
    if (!simulationEnabled && !realCountry) {
      fetch(`${API_BASE_URL}/geoip`)
        .then(res => res.json())
        .then(data => {
          if (data.success && data.country) {
            setRealCountry(data.country);
            setUserCountry(data.country);
          }
        })
        .catch(err => console.error('Error detectando ubicación:', err));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [simulationEnabled]);

  // País activo (simulado o real) - refresca desde localStorage en cada render
  const activeCountry = (simulationEnabled ? localStorage.getItem('simulatedCountry') || userCountry : (realCountry || userCountry));

  // 2. Obtener sustitutos de IA cuando se abre una receta fuera de Ecuador
  useEffect(() => {
    const fetchSubstitutes = async () => {
      if (!selectedRecipe || !activeCountry || selectedRecipe.ingredients?.length === 0) {
        setAiSubstitutes([]);
        return;
      }

      setIsAiLoading(true);
      try {
        const response = await fetch(`${API_BASE_URL}/ai/substitutes`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ingredients: selectedRecipe.ingredients,
            country: activeCountry
          })
        });

        if (response.ok) {
          const data = await response.json();
          setAiSubstitutes(data.substitutes || []);
        }
      } catch (error) {
        console.error("Error obteniendo sustitutos IA:", error);
      } finally {
        setIsAiLoading(false);
      }
    };

    fetchSubstitutes();
  }, [selectedRecipe, activeCountry]);

  // Traducción IA del contenido de la receta
  const [translatedRecipe, setTranslatedRecipe] = useState(null);
  // eslint-disable-next-line no-unused-vars
  const [isTranslating, setIsTranslating] = useState(false);
  const { i18n: i18n_instance } = useTranslation();

  useEffect(() => {
    if (!selectedRecipe) {
      setTranslatedRecipe(null);
      return;
    }

    const lang = i18n_instance.language;
    if (lang === 'es') {
      setTranslatedRecipe(selectedRecipe);
      return;
    }

    setIsTranslating(true);
    setTranslatedRecipe(selectedRecipe);
    translateRecipe(selectedRecipe, lang).then(translated => {
      setTranslatedRecipe(translated);
      setIsTranslating(false);
    });
  }, [selectedRecipe, i18n_instance.language]);

  /**
   * Navegación entre páginas
   */
  const handleNavigate = (page) => {
    if (page === 'home') {
      // Si entramos a home desde landing, marcamos como iniciado
      if (currentPage === 'landing') {
        localStorage.setItem('hasStarted', 'true');
      }
      
      // Limpiar filtros de home al volver al inicio
      localStorage.removeItem('home_selectedRegion');
      localStorage.removeItem('home_selectedProvince');
      
      // Forzar re-render de Home si ya estábamos allí
      if (currentPage === 'home') {
        setResetKey(prev => prev + 1);
      }
    }
    
    setCurrentPage(page);
    setSelectedRecipe(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  /**
   * Muestra notificaciones temporales
   */
  const showNotification = (message, type = 'success') => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification({ show: false, message: '', type: '' }), 3000);
  };

  /**
   * Manejador de clics en recetas (Abre el modal con datos frescos del backend)
   */
  const handleRecipeClick = (recipe) => {
    if (typeof recipe === 'string') {
      handleNavigate(recipe);
    } else if (recipe.id) {
      // Incrementar vistas en el backend
      fetch(`${API_BASE_URL}/recipes/${recipe.id}/view`, { method: 'POST' })
        .catch(err => console.error("Error incrementando vistas:", err));

      getRecipeById(recipe.id).then(fullRecipe => {
        setSelectedRecipe(fullRecipe || recipe);
        setCommentRating(5);
      }).catch(err => {
        console.error("Error cargando detalle receta:", err);
        setSelectedRecipe(recipe);
      });
    } else {
      setSelectedRecipe(recipe);
    }
  };

  /**
   * Envío de comentarios al backend
   */
  const handleCommentSubmit = async (e, recipeId) => {
    e.preventDefault();
    
    const nameInput = document.getElementById('comment-name');
    const emailInput = document.getElementById('comment-email');
    const textInput = document.getElementById('comment-text');

    if (!nameInput || !emailInput || !textInput) return;

    try {
      const response = await fetch(`${API_BASE_URL}/recipes/${recipeId}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_name: nameInput.value,
          correo: emailInput.value,
          comentario: textInput.value,
          puntuacion: commentRating
        })
      });

      if (response.ok) {
        // Refrescar datos de la receta (para ver el nuevo comentario)
        const updatedRecipe = await getRecipeById(recipeId);
        setSelectedRecipe(updatedRecipe);
        
        // Limpiar campos
        nameInput.value = '';
        emailInput.value = '';
        textInput.value = '';
        setCommentRating(5);
        
        showNotification(t('suggestions.alert_success', '¡Comentario enviado exitosamente!'), 'success');
      } else {
        showNotification('Error al enviar el comentario.', 'error');
      }
    } catch (error) {
      console.error('Error enviando comentario:', error);
      showNotification('Error de conexión con el servidor.', 'error');
    }
  };

  /**
   * Renderizado de la página actual
   */
  const renderPage = () => {
    switch (currentPage) {
      case 'landing':
        return <LandingPage onEnter={() => handleNavigate('home')} />;
      case 'home':
        return <Home key={resetKey} onRecipeClick={handleRecipeClick} />;
      case 'recipes':
        return <RecipesPage onRecipeClick={handleRecipeClick} />;
      case 'about':
        return <AboutPage />;
      case 'suggestions':
        return <SuggestionsPage />;
      default:
        return <Home key={resetKey} onRecipeClick={handleRecipeClick} />;
    }
  };

  return (
    <div className="App">
      {/* Navegación (Solo fuera de landing) */}
      {currentPage !== 'landing' && (
        <Navigation currentPage={currentPage} onNavigate={handleNavigate} />
      )}
      
      {/* Notificaciones */}
      {notification.show && (
        <div className={`notification notification-${notification.type}`}>
          <span className="notification-icon">{notification.type === 'success' ? '✓' : '⚠'}</span>
          <span className="notification-message">{notification.message}</span>
        </div>
      )}
      
      <main className={currentPage === 'landing' ? "" : "main-content"}>
        {renderPage()}
      </main>

      {/* Modal de Detalle */}
      {selectedRecipe && (() => {
        const recipe = translatedRecipe || selectedRecipe;
        return (
        <div className="modal-overlay" onClick={() => setSelectedRecipe(null)}>
          <div className="modal-content glass-card" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setSelectedRecipe(null)}>✕</button>
            
            <div className="recipe-detail">
              <div className="recipe-detail-header">
                {recipe.video || recipe.url_video ? (
                  <video controls autoPlay muted className="recipe-video" poster={recipe.image}>
                    <source src={recipe.video || recipe.url_video} type="video/mp4" />
                  </video>
                ) : (
                  <img 
                    src={recipe.image} 
                    alt={recipe.name} 
                    className="recipe-detail-image"
                    onError={(e) => e.target.src = 'https://via.placeholder.com/800x400/1e2330/00d4ff?text=' + encodeURIComponent(recipe.name)}
                  />
                )}
                <div className={`recipe-detail-badge region-${recipe.region}`}>
                  {getRegionEmoji(recipe.region)} {t(`nav.region_${recipe.region}`)}
                </div>
              </div>

              <div className="recipe-detail-body">
                <h2 className="recipe-detail-title">{recipe.name}</h2>
                <div className="recipe-info-row">
                  {recipe.preparationTime && (
                    <div className="recipe-info-item">
                      <span>⏱️ {t('common.time')}: {recipe.preparationTime} min</span>
                    </div>
                  )}
                  <div className="recipe-info-item">
                    <span>👥 {t('common.servings')}: {recipe.servings || 'N/A'}</span>
                  </div>
                  {recipe.calorias && (
                  <div className="recipe-info-item">
                    <span>🔥 Calorías: {recipe.calorias} kcal</span>
                  </div>
                  )}
                  <div className="recipe-info-item">
                    <span>📍 {t('common.province')}: {getProvinceName(recipe.province)}</span>
                  </div>
                </div>

                <div className="recipe-detail-section">
                  <h3>🥘 {t('common.ingredients')}</h3>
                  <ul className="ingredients-list">
                    {recipe.ingredients?.map((ing, i) => <li key={i}>{ing}</li>)}
                  </ul>
                </div>

                {/* Sección de Sustitutos Globales (IA) */}
                {isAiLoading ? (
                  <div className="recipe-detail-section substitution-section">
                    <h3>🌍 {t('common.substitutes_for', 'Sustitutos para')} {activeCountry}</h3>
                    {simulationEnabled && <span className="sub-simulation-badge">🔄 Simulado</span>}
                    <div className="ai-loading">
                      <div className="ai-loader"></div>
                      <p>Buscando alternativas locales...</p>
                    </div>
                  </div>
                ) : aiSubstitutes.length > 0 ? (
                  <div className="recipe-detail-section substitution-section">
                    <h3>🌍 {t('common.substitutes_for', 'Sustitutos para')} {activeCountry}</h3>
                    {simulationEnabled && <span className="sub-simulation-badge">🔄 Simulado</span>}
                    <div className="substitutes-grid">
                      {aiSubstitutes.map((sub, i) => {
                        const parts = sub.split('->');
                        const original = parts[0]?.trim() || sub;
                        const replacement = parts[1]?.trim() || '';
                        return (
                          <div key={i} className="substitute-card">
                            <div className="sub-original">
                              <span className="sub-label">Ingrediente Original</span>
                              <span className="sub-text">{original}</span>
                            </div>
                            <div className="sub-arrow">➔</div>
                            <div className="sub-replacement">
                              <span className="sub-label">Sustituto</span>
                              <span className="sub-text">{replacement}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : selectedRecipe.ingredients?.length > 0 ? (
                  <div className="recipe-detail-section substitution-section">
                    <h3>🌍 {t('common.substitutes_for', 'Sustitutos para')} {activeCountry}</h3>
                    {simulationEnabled && <span className="sub-simulation-badge">🔄 Simulado</span>}
                    <p className="no-substitutes">✅ Todos los ingredientes están disponibles en {activeCountry}</p>
                  </div>
                ) : null}

                  <div className="recipe-detail-section">
                    <h3>👨‍🍳 {t('common.preparation')}</h3>
                    <div className="instructions">
                      <div className="instructions-list">
                        {recipe.instructions?.split(/\r?\n/).filter(line => line.trim() !== "").map((step, i) => (
                          <p key={i} className="instruction-step">
                            <span className="step-number">{i + 1}.</span> {step}
                          </p>
                        ))}
                      </div>
                    </div>
                  </div>

                {recipe.howToServe && (
                  <div className="recipe-detail-section">
                    <h3>🍽️ {t('common.how_to_serve')}</h3>
                    <div className="serving-instructions">
                      {recipe.howToServe.split(/\n/).filter(l => l.trim()).map((line, i) => (
                        <p key={i} className="serving-step">{line}</p>
                      ))}
                    </div>
                  </div>
                )}
                
              </div>

              {/* Comentarios */}
              <div className="recipe-detail-section recipe-section-comments">
                <h3>💬 {t('common.comments')}</h3>
                <div className="comments-list">
                  {recipe.comments && recipe.comments.length > 0 ? (
                    recipe.comments.map((c, i) => (
                      <div key={i} className="comment-item">
                        {/* Avatar a la izquierda */}
                        <div className="comment-avatar">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="avatar-icon">
                            <path fillRule="evenodd" d="M18.685 19.097A9.723 9.723 0 0021.75 12c0-5.385-4.365-9.75-9.75-9.75S2.25 6.615 2.25 12a9.723 9.723 0 003.065 7.097A9.716 9.716 0 0012 21.75a9.716 9.716 0 006.685-2.653zm-12.54-1.285A7.486 7.486 0 0112 15a7.486 7.486 0 015.855 2.812A8.224 8.224 0 0112 20.25a8.224 8.224 0 01-5.855-2.438zM15.75 9a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                        
                        {/* Contenido a la derecha */}
                        <div className="comment-content-wrapper">
                          <div className="comment-header">
                            <span className="comment-author">{c.user_name}</span>
                            <div className="comment-rating">
                              {[...Array(5)].map((_, starI) => (
                                <span key={starI} className={`star ${starI < c.puntuacion ? 'filled' : ''}`}>★</span>
                              ))}
                            </div>
                          </div>
                          <p className="comment-text">{c.comentario}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="no-comments-message">
                      <p>✨ {t('common.be_first_comment', '¡Sé el primero en comentar esta receta!')}</p>
                    </div>
                  )}
                </div>

                <div className="comment-form">
                  <h4>{t('common.add_comment')}</h4>
                  <form onSubmit={(e) => handleCommentSubmit(e, selectedRecipe.id)}>
                    
                    {/* 1. Estrellas (Primero) */}
                    <div className="rating-input">
                      <div className="stars-input">
                        {[1,2,3,4,5].map(s => (
                          <span key={s} className={`star-input ${commentRating >= s ? 'selected' : ''}`} onClick={() => setCommentRating(s)}>★</span>
                        ))}
                      </div>
                    </div>

                    {/* 2. Inputs de Nombre y Email */}
                    <div className="form-row">
                      <input type="text" id="comment-name" className="form-input" placeholder={t('common.name')} required />
                      <input type="email" id="comment-email" className="form-input" placeholder={t('common.email')} required />
                    </div>

                    {/* 3. Textarea de Comentario */}
                    <textarea 
                      id="comment-text" 
                      className="form-textarea" 
                      placeholder="Comentario" 
                      required 
                      rows="4"
                    ></textarea>

                    <button type="submit" className="btn btn-primary btn-3d">ENVIAR</button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      )})()}

      {/* Footer (Fuera de landing) */}
      {currentPage !== 'landing' && (
        <footer className="app-footer">
          <div className="container">
            <div className="footer-content">
              <div className="footer-section">
                <h4>🇪🇨 {t('about.sub_legacy', 'Legado Culinario')} Ecuador</h4>
                <p>{t('footer.description')}</p>
              </div>
              <div className="footer-section">
                <h4>{t('footer.regions')}</h4>
                <ul>
                  <li>🌊 {t('nav.region_costa')}</li>
                  <li>⛰️ {t('nav.region_sierra')}</li>
                  <li>🌳 {t('nav.region_oriente')}</li>
                  <li>🏝️ {t('nav.region_insular')}</li>
                </ul>
              </div>
            </div>
            <div className="footer-bottom">
              <p>© 2025 Culinario Ecuador. {t('footer.made_with')}</p>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}

// Helpers
function getRegionEmoji(region) {
  const emojis = { costa: '🌊', sierra: '⛰️', oriente: '🌳', insular: '🏝️' };
  return emojis[region] || '🍽️';
}



function getProvinceName(provinceId) {
  const provinceNames = {
    esmeraldas: 'Esmeraldas', manabi: 'Manabí', santo_domingo: 'Santo Domingo',
    los_rios: 'Los Ríos', guayas: 'Guayas', santa_elena: 'Santa Elena', el_oro: 'El Oro',
    carchi: 'Carchi', imbabura: 'Imbabura', pichincha: 'Pichincha', cotopaxi: 'Cotopaxi',
    tungurahua: 'Tungurahua', bolivar: 'Bolívar', chimborazo: 'Chimborazo', canar: 'Cañar',
    azuay: 'Azuay', loja: 'Loja', sucumbios: 'Sucumbíos', napo: 'Napo',
    orellana: 'Orellana', pastaza: 'Pastaza', morona_santiago: 'Morona Santiago',
    zamora_chinchipe: 'Zamora Chinchipe', galapagos: 'Galápagos'
  };
  return provinceNames[provinceId] || provinceId;
}

export default App;
