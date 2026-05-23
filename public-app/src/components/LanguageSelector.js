/**
 * Componente LanguageSelector (Selector de Idioma)
 * Permite cambiar el idioma de la aplicación utilizando la librería i18next
 * y sincronizándola con la API de Google Translate para el contenido dinámico.
 */
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import './styles/LanguageSelector.css';

function LanguageSelector() {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  
  const currentLang = i18n.language || 'es';

  const languages = [
    { code: 'es', name: 'Español', flag: 'es' },
    { code: 'en', name: 'English', flag: 'us' }
  ];

  /**
   * Sincroniza el cambio de idioma con el widget de Google Translate
   */
  const triggerGoogleTranslate = (langCode) => {
    // 1. Intentar por combo de Google
    const googleCombo = document.querySelector('.goog-te-combo');
    if (googleCombo) {
      googleCombo.value = langCode;
      googleCombo.dispatchEvent(new Event('change'));
    }

    // 2. Forzar Cookie para persistencia y SPA (es -> langCode)
    document.cookie = `googtrans=/es/${langCode}; path=/`;
    document.cookie = `googtrans=/es/${langCode}; domain=${window.location.hostname}; path=/`;
  };

  /**
   * Maneja el cambio de idioma.
   */
  const handleLanguageChange = (langCode) => {
    i18n.changeLanguage(langCode);
    triggerGoogleTranslate(langCode);
    setIsOpen(false);
  };

  // Efecto para asegurar que al cargar, si el idioma no es español, se intente disparar Google Translate
  useEffect(() => {
    if (currentLang !== 'es') {
      // Pequeño delay para asegurar que el widget de Google haya cargado
      const timer = setTimeout(() => {
        triggerGoogleTranslate(currentLang);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [currentLang]);

  const currentLanguage = languages.find(lang => currentLang.startsWith(lang.code)) || languages[0];

  return (
    <div className="language-selector-custom">
      <button 
        className="lang-current glass-card"
        onClick={() => setIsOpen(!isOpen)}
        title="Cambiar idioma / Change language"
      >
        <img 
          src={`https://flagcdn.com/24x18/${currentLanguage.flag}.png`}
          srcSet={`https://flagcdn.com/48x36/${currentLanguage.flag}.png 2x`}
          width="24"
          height="18"
          alt={currentLanguage.name}
          className="lang-flag-img"
        />
        <span className="lang-name">{currentLanguage.name}</span>
        <span className="lang-arrow">{isOpen ? '▲' : '▼'}</span>
      </button>

      {isOpen && (
        <div className="lang-dropdown glass-card">
          {languages.map(lang => (
            <button
              key={lang.code}
              className={`lang-option ${currentLang.startsWith(lang.code) ? 'active' : ''}`}
              onClick={() => handleLanguageChange(lang.code)}
            >
              <img 
                src={`https://flagcdn.com/24x18/${lang.flag}.png`}
                srcSet={`https://flagcdn.com/48x36/${lang.flag}.png 2x`}
                width="24"
                height="18"
                alt={lang.name}
                className="lang-flag-img"
              />
              <span className="lang-name">{lang.name}</span>
              {currentLang.startsWith(lang.code) && <span className="lang-check">✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default LanguageSelector;
