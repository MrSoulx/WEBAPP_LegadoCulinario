/**
 * Componente AboutPage (Página "Acerca de")
 * Muestra información sobre el proyecto "Legado Culinario", su misión y las regiones de Ecuador.
 */
import React from 'react';
import { useTranslation } from 'react-i18next';

function AboutPage() {
  const { t } = useTranslation();

  return (
    // Contenedor principal con estilos en línea para centrado y espaciado
    <div className="container" style={{ padding: '4rem 2rem', maxWidth: '900px', margin: '0 auto' }}>
      {/* Tarjeta con efecto de vidrio (glassmorphism) */}
      <div className="glass-card" style={{ padding: '3rem' }}>
        <h1 style={{ textAlign: 'center', marginBottom: '2rem' }}>{t('about.header')}</h1>
        
        <div style={{ fontSize: '1.125rem', lineHeight: '1.8' }}>
          <p>{t('about.p1')}</p>

          <h3 style={{ marginTop: '2rem' }}>🇪🇨 {t('about.sub_legacy')}</h3>
          <p>{t('about.p2')}</p>

          <h3 style={{ marginTop: '2rem' }}>🗺️ {t('about.sub_regions')}</h3>
          <ul style={{ lineHeight: '1.8' }}>
            <li><strong>{t('about.reg_costa')}</strong></li>
            <li><strong>{t('about.reg_sierra')}</strong></li>
            <li><strong>{t('about.reg_oriente')}</strong></li>
            <li><strong>{t('about.reg_insular')}</strong></li>
          </ul>

          <h3 style={{ marginTop: '2rem' }}>🍽️ {t('about.sub_diversity')}</h3>
          <p>{t('about.p3')}</p>

          <h3 style={{ marginTop: '2rem' }}>🌍 {t('about.sub_world')}</h3>
          <p>{t('about.p4')}</p>
        </div>
      </div>
    </div>
  );
}

export default AboutPage;
