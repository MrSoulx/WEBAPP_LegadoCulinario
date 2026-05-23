/**
 * Componente EcuadorMap (Mapa de Ecuador)
 * Renderiza un mapa interactivo.
 * Estado normal: Plano.
 * Estado activo: Extrusión 3D con SOMBRA COLOREADA.
 * Fix: Etiquetas centradas CORREGIDAS (Costa y Sierra).
 */
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import './styles/EcuadorMap.css';
import { mapPaths } from './EcuadorMapPaths';

// Función helper para calcular el centro aproximado de un path
const getPathBBox = (pathData) => {
  // Extraer todos los números del path
  const coords = pathData.match(/[\d.]+/g).map(Number);
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  
  // Procesar coordenadas en pares (x, y)
  for (let i = 0; i < coords.length; i += 2) {
    const x = coords[i];
    const y = coords[i + 1];
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  }
  
  // Tamaño fijo "mediano" para todas las provincias como pidió el usuario
  const fontSize = 14; 
  
  return {
    cx: (minX + maxX) / 2,
    cy: (minY + maxY) / 2,
    fontSize: `${fontSize}px`
  };
};

function EcuadorMap({ selectedRegion, onRegionClick, onProvinceClick }) {
  const { t } = useTranslation();
  const [hoveredRegion, setHoveredRegion] = useState(null);
  const [hoveredProvince, setHoveredProvince] = useState(null);

  const handleRegionClick = (regionId) => {
    if (onRegionClick) onRegionClick(regionId);
  };

  const handleProvinceClick = (provinceId, regionId) => {
    console.log('🗺️ Click en provincia:', provinceId, 'Región:', regionId, 'Región seleccionada:', selectedRegion);
    
    // Si la región NO está seleccionada, primero seleccionarla
    if (selectedRegion !== regionId) {
      console.log('📍 Seleccionando región primero:', regionId);
      if (onRegionClick) {
        onRegionClick(regionId);
      }
      return;
    }
    
    // Si la región YA está seleccionada, navegar a las recetas de la provincia
    if (onProvinceClick) {
      console.log('✅ Navegando a recetas de provincia:', provinceId);
      onProvinceClick(provinceId, regionId);
    }
  };

  const handleProvinceHover = (provinceId, regionId) => {
    // Solo permitir hover en provincias si la región está seleccionada
    if (selectedRegion === regionId) {
      setHoveredProvince(provinceId);
    }
  };

  const handleProvinceLeave = () => {
    setHoveredProvince(null);
  };

  const regionColors = {
    costa: { top: '#FFD100', side: '#E6BC00', shadow: 'rgba(255, 209, 0, 0.6)' },
    sierra: { top: '#0033CC', side: '#002288', shadow: 'rgba(0, 51, 204, 0.6)' },
    oriente: { top: '#007700', side: '#005500', shadow: 'rgba(0, 119, 0, 0.6)' },
    insular: { top: '#E60000', side: '#990000', shadow: 'rgba(230, 0, 0, 0.6)' }
  };

  // Coordenadas RE-AJUSTADAS manualmente
  const labelPositions = {
    costa: { x: "320", y: "420" },    // Movido arriba y a la derecha (estaba muy abajo/izq)
    sierra: { x: "490", y: "410" },   // Movido abajo y derecha para centrar en la franja azul
    oriente: { x: "740", y: "380" },  // (Se mantiene, usuario dijo OK)
    insular: { x: "120", y: "200" }   // (Se mantiene)
  };

  const renderExtrusion = (provinces, colorSide) => {
    const layers = [];
    const depth = 16; 
    const step = 1; 
    
    for (let i = 1; i <= depth; i+=step) {
        layers.push(
          <path 
            key={`layer-${i}`} 
            d={provinces.map(p => p.d).join(' ')}
            transform={`translate(0, ${i * 1.5})`}
            fill={colorSide} 
            stroke="none"
            className="extrusion-path"
          />
        );
    }
    return layers;
  };

  // Función para renderizar extrusión de una sola provincia
  const renderProvinceExtrusion = (province, colorSide) => {
    const layers = [];
    const depth = 16; 
    const step = 1; 
    
    for (let i = 1; i <= depth; i+=step) {
        layers.push(
          <path 
            key={`layer-${i}`} 
            d={province.d}
            transform={`translate(0, ${i * 1.5})`}
            fill={colorSide} 
            stroke="none"
            className="extrusion-path"
          />
        );
    }
    return layers;
  };

  return (
    <div 
      className="ecuador-map-container"
      onDoubleClick={() => {
        // Doble click para deseleccionar región
        if (selectedRegion && onRegionClick) {
          onRegionClick(null);
        }
      }}
    >
      <div className="map-header">
        <h2 className="map-title">
          {selectedRegion 
            ? `${t('common.region')}: ${t(`nav.region_${selectedRegion}`)}` 
            : t('home.select_region')}
        </h2>
      </div>

      <div className="ecuador-map-perspective-wrapper">
        <div className={`ecuador-map-svg-container ${selectedRegion ? 'has-selection' : ''}`}>
          <svg viewBox="0 0 1000 800" className="ecuador-map-svg">
            <defs>
              <filter id="glossy-relief" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur in="SourceAlpha" stdDeviation="1.5" result="blur" />
                <feSpecularLighting in="blur" surfaceScale="4" specularConstant="0.7" specularExponent="35" lightingColor="#ffffff" result="specOut">
                  <fePointLight x="-5000" y="-10000" z="20000" />
                </feSpecularLighting>
                <feComposite in="specOut" in2="SourceAlpha" operator="in" result="specOut" />
                <feComposite in="SourceGraphic" in2="specOut" operator="arithmetic" k1="0" k2="1" k3="0.8" k4="0" result="litGraphic" />
              </filter>
            </defs>

            <g className="map-base-floor" transform="translate(0, 5)">
              {Object.values(mapPaths).flat().map((p, i) => (
                 <path key={`floor-${i}`} d={p.d} fill="#111" opacity="0.4" />
              ))}
            </g>

            {/* Ordenar regiones: la región con provincia hover al final */}
            {Object.entries(mapPaths)
              .sort(([regionIdA], [regionIdB]) => {
                // Si alguna región tiene una provincia con hover, ponerla al final
                const regionAHasHoveredProvince = hoveredProvince && 
                  mapPaths[regionIdA]?.some(p => p.id === hoveredProvince);
                const regionBHasHoveredProvince = hoveredProvince && 
                  mapPaths[regionIdB]?.some(p => p.id === hoveredProvince);
                
                if (regionAHasHoveredProvince) return 1;  // A al final
                if (regionBHasHoveredProvince) return -1; // B al final
                return 0; // mantener orden original
              })
              .map(([regionId, provinces]) => {
                const isSelected = selectedRegion === regionId;
                const isHovered = hoveredRegion === regionId;
                // Solo mostrar efecto 3D en región si NO está seleccionada
                const showRegion3D = !isSelected && isHovered;
                const colors = regionColors[regionId];
                const pos = labelPositions[regionId] || { x: 500, y: 500 };
                
                const zIndexClass = (isSelected || isHovered) ? 'z-top' : 'z-base';
                
                // Determinar si esta región tiene la provincia con hover
                const hasHoveredProvince = hoveredProvince && 
                  provinces.some(p => p.id === hoveredProvince);

                return (
                  <g
                    key={`${regionId}-${hasHoveredProvince ? 'hovered' : 'normal'}`}
                    className={`region-group ${regionId} ${zIndexClass} ${isSelected ? 'selected' : ''} ${isHovered && !isSelected ? 'hovered' : ''}`}
                    onClick={() => handleRegionClick(regionId)}
                    onMouseEnter={() => !isSelected && setHoveredRegion(regionId)}
                    onMouseLeave={() => setHoveredRegion(null)}
                    style={{ '--region-shadow': colors.shadow }}
                  >
                  {/* Extrusión 3D de toda la región (solo si NO está seleccionada) */}
                  <g className="extrusion-stack" style={{ opacity: showRegion3D ? 1 : 0, transition: 'opacity 0.1s' }}>
                    {showRegion3D && renderExtrusion(provinces, colors.side)}
                  </g>

                  {/* Renderizar cada provincia individualmente */}
                  {/* Ordenar provincias: las que no tienen hover primero, la que tiene hover al final */}
                  {[...provinces]
                    .sort((a, b) => {
                      const aHovered = hoveredProvince === a.id && isSelected;
                      const bHovered = hoveredProvince === b.id && isSelected;
                      if (aHovered) return 1;  // a al final
                      if (bHovered) return -1; // b al final
                      return 0; // mantener orden original
                    })
                    .map(p => {
                      const isProvinceHovered = hoveredProvince === p.id && isSelected;
                      
                      return (
                        <g 
                          key={p.id}
                          className={`province-group ${isProvinceHovered ? 'province-hovered' : ''}`}
                          onClick={(e) => {
                            e.stopPropagation(); // Evitar que el click se propague a la región
                            handleProvinceClick(p.id, regionId);
                          }}
                          onMouseEnter={() => handleProvinceHover(p.id, regionId)}
                          onMouseLeave={handleProvinceLeave}
                          style={{ 
                            transform: isProvinceHovered ? 'translateY(-20px)' : 'translateY(0)',
                            transition: 'transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                            filter: isProvinceHovered ? 'drop-shadow(0 20px 25px rgba(0, 0, 0, 0.4)) brightness(1.1)' : 'none'
                          }}
                        >
                          {/* Extrusión 3D de provincia individual (solo si está seleccionada la región y hay hover) */}
                          <g className="province-extrusion-stack" style={{ opacity: isProvinceHovered ? 1 : 0, transition: 'opacity 0.1s' }}>
                            {isProvinceHovered && renderProvinceExtrusion(p, colors.side)}
                          </g>
                          
                          {/* Cara superior de la provincia */}
                          <path
                            d={p.d}
                            fill={colors.top}
                            filter="url(#glossy-relief)"
                            stroke="#000" 
                            strokeWidth="1.5"
                          />
                        </g>
                      );
                    })
                  }
                  
                  <text 
                    x={pos.x} 
                    y={pos.y} 
                    className="region-label"
                  >
                    {t(`nav.region_${regionId}`)}
                  </text>
                  
                  <g className="province-labels">
                    {provinces.map(p => {
                      const bbox = getPathBBox(p.d);
                      // Lógica de salto de línea para nombres largos
                      const nameParts = p.name.includes(' ') && p.name.length > 15 
                        ? (p.name === 'Santo Domingo de los Tsachilas' 
                            ? ['Santo Domingo', 'de los Tsachilas'] 
                            : p.name.split(' '))
                        : [p.name];

                      return (
                        <text 
                          key={`label-${p.id}`}
                          x={bbox.cx} 
                          y={bbox.cy} 
                          className="province-label"
                          style={{ fontSize: bbox.fontSize }}
                          textAnchor="middle"
                        >
                          {nameParts.map((part, index) => (
                            <tspan 
                              key={index}
                              x={bbox.cx}
                              dy={index === 0 ? `-${(nameParts.length - 1) * 0.6}em` : "1.2em"}
                            >
                              {part}
                            </tspan>
                          ))}
                        </text>
                      );
                    })}
                  </g>
                </g>
              );
            })}
          </svg>
        </div>
      </div>
    </div>
  );
}

export default EcuadorMap;
