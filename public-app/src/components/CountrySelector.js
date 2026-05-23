import React, { useState } from 'react';
import './styles/CountrySelector.css';

const COUNTRIES = [
  { code: 'US', name: 'Estados Unidos', flag: 'us' },
  { code: 'GB', name: 'Reino Unido', flag: 'gb' },
  { code: 'ES', name: 'España', flag: 'es' },
  { code: 'FR', name: 'Francia', flag: 'fr' },
  { code: 'DE', name: 'Alemania', flag: 'de' },
  { code: 'IT', name: 'Italia', flag: 'it' },
  { code: 'CN', name: 'China', flag: 'cn' },
  { code: 'JP', name: 'Japón', flag: 'jp' },
  { code: 'MX', name: 'México', flag: 'mx' },
  { code: 'AR', name: 'Argentina', flag: 'ar' },
  { code: 'CO', name: 'Colombia', flag: 'co' },
  { code: 'EC', name: 'Ecuador', flag: 'ec' },
  { code: 'AU', name: 'Australia', flag: 'au' },
  { code: 'CA', name: 'Canadá', flag: 'ca' },
];

function CountrySelector({ userCountry, onCountryChange }) {
  const [isOpen, setIsOpen] = useState(false);

  const current = COUNTRIES.find(c => c.name === userCountry) || COUNTRIES[0];

  return (
    <div className="country-selector">
      <button
        className="country-current glass-card"
        onClick={() => setIsOpen(!isOpen)}
        title="Simular ubicación"
      >
        <img
          src={`https://flagcdn.com/24x18/${current.flag}.png`}
          srcSet={`https://flagcdn.com/48x36/${current.flag}.png 2x`}
          width="24"
          height="18"
          alt={current.name}
          className="country-flag-img"
        />
        <span className="country-name">{current.name}</span>
        <span className="country-arrow">{isOpen ? '▲' : '▼'}</span>
      </button>

      {isOpen && (
        <div className="country-dropdown glass-card">
          <div className="country-dropdown-header">Simular ubicación en:</div>
          {COUNTRIES.map(c => (
            <button
              key={c.code}
              className={`country-option ${userCountry === c.name ? 'active' : ''}`}
              onClick={() => {
                onCountryChange(c.name);
                setIsOpen(false);
              }}
            >
              <img
                src={`https://flagcdn.com/24x18/${c.flag}.png`}
                srcSet={`https://flagcdn.com/48x36/${c.flag}.png 2x`}
                width="24"
                height="18"
                alt={c.name}
                className="country-flag-img"
              />
              <span className="country-name">{c.name}</span>
              {userCountry === c.name && <span className="country-check">✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default CountrySelector;
