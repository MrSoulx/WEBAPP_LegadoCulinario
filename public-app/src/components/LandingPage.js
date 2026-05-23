import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import './styles/LandingPage.css';

function LandingPage({ onEnter }) {
  const { t } = useTranslation();
  const [currentBgIndex, setCurrentBgIndex] = useState(0);

  const backgroundImages = [
    '/images/Costa/costa.jpg',
    '/images/Sierra/Sierra.jpg',
    '/images/Oriente/Oriente.jpg',
    '/images/Insular/Insular.jpg'
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentBgIndex((prev) => (prev + 1) % backgroundImages.length);
    }, 4000); // Cambio cada 4 segundos
    return () => clearInterval(interval);
  }, [backgroundImages.length]);

  return (
    <div className="landing-page">
      {/* Slideshow de fondo */}
      <div className="landing-slideshow">
        {backgroundImages.map((img, index) => (
          <div 
            key={index}
            className={`ls-slide ${index === currentBgIndex ? 'active' : ''}`}
            style={{ backgroundImage: `url(${img})` }}
          />
        ))}
        <div className="ls-overlay" />
      </div>

      {/* Tarjeta central */}
      <div className="landing-card container glass-card">
        <div className="landing-badge">
          <img 
            src="/logo-img/Logo-Legado_Culinario-removebg-preview.png"
            alt="Legado Culinario"
            className="landing-logo"
          />
        </div>
        <h1 className="landing-title">
          {t('home.hero_title_p1', 'Explora la')} <span className="highlight">{t('home.hero_title_p2', 'Gastronomía Ecuatoriana')}</span>
        </h1>
        <p className="landing-subtitle">
          {t('home.hero_subtitle', 'Descubre las recetas tradicionales de cada región del Ecuador')}
        </p>
        <button className="landing-start-btn btn-3d" onClick={onEnter}>
          {t('common.start', 'Empezar')}
        </button>
      </div>
    </div>
  );
}

export default LandingPage;
