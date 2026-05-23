/**
 * Componente SuggestionsPage (Página de Sugerencias)
 * Permite a los usuarios enviar sus propias recetas a través de un formulario detallado.
 */
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { API_BASE_URL } from '../data/apiClient';
import { fetchProvincesData } from '../data/provincesData';
import CustomAlert from './CustomAlert';

function SuggestionsPage() {
  const { t } = useTranslation();
  
  // Estado para el modal personalizado
  const [alertConfig, setAlertConfig] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'success'
  });

  // Estado para las provincias (cargadas del backend)
  const [provincesGrouped, setProvincesGrouped] = useState({});

  useEffect(() => {
    fetchProvincesData().then(({ grouped }) => {
      setProvincesGrouped(grouped);
    });
  }, []);

  // Estado para manejar los datos del formulario de sugerencias
  const [formData, setFormData] = useState({
    recipeName: '',
    region: 'costa',
    province: '',
    ingredients: '',
    instructions: '',
    description: '',
    userEmail: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const API_URL = API_BASE_URL + '/suggestions';

  /**
   * Maneja el envío del formulario.
   * Envía los datos al backend para que se procese y envíe un correo.
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        // En lugar de alert(), usamos nuestro Modal
        setAlertConfig({
          isOpen: true,
          title: '¡Receta Enviada!',
          message: 'Muchas gracias por compartir tu legado culinario. Lo revisaremos y te avisaremos pronto.',
          type: 'success'
        });

        setFormData({
          recipeName: '',
          region: 'costa',
          province: '',
          ingredients: '',
          instructions: '',
          description: '',
          userEmail: ''
        });
      } else {
        setAlertConfig({
          isOpen: true,
          title: 'Error',
          message: 'No pudimos enviar tu receta. Por favor, intenta de nuevo más tarde.',
          type: 'error'
        });
      }
    } catch (error) {
      console.error('Error:', error);
      setAlertConfig({
        isOpen: true,
        title: 'Error de Conexión',
        message: 'Parece que hay un problema con la red. Verifica tu conexión e intenta de nuevo.',
        type: 'error'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
  /**
   * Obtiene la lista de provincias correspondientes a la región seleccionada actualmente.
   */
  const getProvincesForRegion = () => {
    return provincesGrouped[formData.region] || [];
  };

  return (
    <div className="container" style={{ padding: '4rem 2rem', maxWidth: '800px', margin: '0 auto' }}>
      
      {/* Integración del Modal Personalizado */}
      <CustomAlert 
        isOpen={alertConfig.isOpen}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        onClose={() => setAlertConfig({...alertConfig, isOpen: false})}
      />

      <div className="glass-card" style={{ padding: '3rem' }}>
        <h1 style={{ textAlign: 'center', marginBottom: '1rem' }}>{t('suggestions.title')}</h1>
        <p style={{ textAlign: 'center', color: 'var(--text-secondary)', marginBottom: '3rem' }}>
          {t('suggestions.subtitle')}
        </p>

        {/* Formulario de envío de recetas */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Honeypot (invisible para humanos) */}
          <div style={{ position: 'absolute', left: '-9999px', opacity: 0 }} aria-hidden="true">
            <label>No llenar</label>
            <input
              type="text"
              tabIndex={-1}
              autoComplete="off"
              value={formData._hp || ''}
              onChange={(e) => setFormData({...formData, _hp: e.target.value})}
            />
          </div>
          {/* Campo Nombre de la Receta */}
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>
              {t('suggestions.form_recipe_name')}
            </label>
            <input
              type="text"
              required
              value={formData.recipeName}
              onChange={(e) => setFormData({...formData, recipeName: e.target.value})}
              placeholder="Ej: ceviche de camarón"
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                background: 'var(--bg-secondary)',
                border: '2px solid var(--glass-border-current)',
                borderRadius: 'var(--radius-md)',
                fontSize: '1rem',
                color: 'var(--text-primary)',
                fontFamily: 'var(--font-family)'
              }}
            />
          </div>

          {/* Campo Correo Electrónico */}
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>
              Tu correo electrónico
            </label>
            <input
              type="email"
              required
              value={formData.userEmail}
              onChange={(e) => setFormData({...formData, userEmail: e.target.value})}
              placeholder="tu@correo.com"
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                background: 'var(--bg-secondary)',
                border: '2px solid var(--glass-border-current)',
                borderRadius: 'var(--radius-md)',
                fontSize: '1rem',
                color: 'var(--text-primary)',
                fontFamily: 'var(--font-family)'
              }}
            />
          </div>

          {/* Selección de Región y Provincia */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>
                {t('suggestions.form_region')}
              </label>
              <select
                required
                value={formData.region}
                onChange={(e) => setFormData({...formData, region: e.target.value, province: ''})}
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  background: 'var(--bg-secondary)',
                  border: '2px solid var(--glass-border-current)',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '1rem',
                  color: 'var(--text-primary)',
                  fontFamily: 'var(--font-family)'
                }}
              >
                <option value="costa">🌊 {t('nav.region_costa')}</option>
                <option value="sierra">⛰️ {t('nav.region_sierra')}</option>
                <option value="oriente">🌳 {t('nav.region_oriente')}</option>
                <option value="insular">🏝️ {t('nav.region_insular')}</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>
                {t('suggestions.form_province')}
              </label>
              <select
                required
                value={formData.province}
                onChange={(e) => setFormData({...formData, province: e.target.value})}
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  background: 'var(--bg-secondary)',
                  border: '2px solid var(--glass-border-current)',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '1rem',
                  color: 'var(--text-primary)',
                  fontFamily: 'var(--font-family)'
                }}
              >
                <option value="">{t('suggestions.select_province')}</option>
                {getProvincesForRegion().map(province => (
                  <option key={province.id} value={province.id}>
                    {province.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Campo Descripción */}
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>
              {t('suggestions.form_description')}
            </label>
            <textarea
              required
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              placeholder="Describe brevemente el plato..."
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                background: 'var(--bg-secondary)',
                border: '2px solid var(--glass-border-current)',
                borderRadius: 'var(--radius-md)',
                fontSize: '1rem',
                color: 'var(--text-primary)',
                fontFamily: 'var(--font-family)',
                resize: 'vertical'
              }}
            />
          </div>

          {/* Campo Ingredientes */}
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>
              {t('suggestions.form_ingredients')}
            </label>
            <textarea
              required
              rows={6}
              value={formData.ingredients}
              onChange={(e) => setFormData({...formData, ingredients: e.target.value})}
              placeholder="500g de camarones..."
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                background: 'var(--bg-secondary)',
                border: '2px solid var(--glass-border-current)',
                borderRadius: 'var(--radius-md)',
                fontSize: '1rem',
                color: 'var(--text-primary)',
                fontFamily: 'var(--font-family)',
                resize: 'vertical'
              }}
            />
          </div>

          {/* Campo Instrucciones */}
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>
              {t('suggestions.form_instructions')}
            </label>
            <textarea
              required
              rows={8}
              value={formData.instructions}
              onChange={(e) => setFormData({...formData, instructions: e.target.value})}
              placeholder="Describe paso a paso..."
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                background: 'var(--bg-secondary)',
                border: '2px solid var(--glass-border-current)',
                borderRadius: 'var(--radius-md)',
                fontSize: '1rem',
                color: 'var(--text-primary)',
                fontFamily: 'var(--font-family)',
                resize: 'vertical'
              }}
            />
          </div>

          {/* Botón de Envío Centrado */}
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: '1rem' }}>
            <button 
              type="submit" 
              className="btn-3d btn-oriente" 
              style={{ padding: '0.8rem 3rem' }}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Enviando...' : 'Enviar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default SuggestionsPage;
