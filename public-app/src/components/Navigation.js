/**
 * Componente Navigation (Barra de Navegación)
 * Muestra el menú principal, selector de tema y selector de idioma.
 * Es responsivo y se adapta a dispositivos móviles.
 */
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import './styles/Navigation.css';
import LanguageSelector from './LanguageSelector';

function Navigation({ currentPage, onNavigate }) {
  const { t } = useTranslation();
  // Estado para controlar la apertura del menú móvil
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Estado para el tema (oscuro/claro) - Leemos de localStorage o default 'light'
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('theme') || 'light';
  });

  // Efecto para aplicar el tema y guardarlo en localStorage
  useEffect(() => {
    if (theme === 'dark') {
      document.body.classList.add('dark-theme');
    } else {
      document.body.classList.remove('dark-theme');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  /**
   * Alterna entre el tema claro y oscuro.
   */
  const toggleTheme = () => {
    setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  // Elementos del menú de navegación (sin Contacto)
  const menuItems = [
    { id: 'recipes', label: t('nav.recipes'), icon: '🍽️', color: 'sierra' },
    { id: 'about', label: t('nav.about'), icon: 'ℹ️', color: 'oriente' },
    { id: 'suggestions', label: t('nav.suggestions'), icon: '💡', color: 'costa' }
  ];

  /**
   * Maneja el clic en un enlace de navegación.
   * Cambia la página y cierra el menú móvil si está abierto.
   */
  const handleNavClick = (pageId) => {
    onNavigate(pageId);
    setIsMobileMenuOpen(false);
  };

  return (
    <nav className="navigation glass-card">
      <div className="nav-container">
        {/* Logo y Título */}
        <div className="nav-logo" onClick={() => handleNavClick('home')}>
          <img 
            src="/logo-img/Logo-Legado_Culinario-removebg-preview.png" 
            alt="Culinario Ecuador Logo" 
            className="logo-image"
          />
          <span className="logo-text"> {t('about.sub_legacy', 'Legado Culinario')} <span className="logo-highlight">Ecuador</span></span>
        </div>

        {/* Menú de Escritorio */}
        <ul className="nav-menu">
          {menuItems.map(item => (
            <li key={item.id}>
              <button
                className={`nav-link ${currentPage === item.id ? 'active' : ''} nav-link-${item.color}`}
                onClick={() => handleNavClick(item.id)}
              >
                <span className="nav-icon">{item.icon}</span>
                <span>{item.label}</span>
              </button>
            </li>
          ))}
        </ul>

        {/* Sección Derecha: Selector de Tema e Idioma (sin botón de usuario) */}
        <div className="nav-actions">
          {/* Botón para cambiar tema con iconos reflejando el estado actual */}
          <button className="theme-toggle btn-3d" onClick={toggleTheme} title={theme === 'light' ? 'Cambiar a modo oscuro' : 'Cambiar a modo claro'}>
            <span style={{ fontSize: '1.2rem' }}>
               {theme === 'light' ? '☀️' : '🌙'}
            </span>
          </button>

          {/* Selector de Idioma Personalizado */}
          <LanguageSelector />

          {/* Botón de Menú Móvil (Hamburguesa) */}
          <button 
            className="mobile-menu-btn btn-3d"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? '✕' : '☰'}
          </button>
        </div>
      </div>

      {/* Menú Móvil Desplegable */}
      {isMobileMenuOpen && (
        <div className="mobile-menu">
          {menuItems.map(item => (
            <button
              key={item.id}
              className={`mobile-nav-link ${currentPage === item.id ? 'active' : ''} nav-link-${item.color}`}
              onClick={() => handleNavClick(item.id)}
            >
              <span className="nav-icon">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      )}
    </nav>
  );
}

export default Navigation;
