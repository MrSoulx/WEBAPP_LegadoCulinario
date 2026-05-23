import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { recipesAPI, regionsAPI } from '../services/api';
import Layout from '../components/layout/Layout';
import { toast } from 'react-hot-toast';
import { ImageUploader, VideoUploader } from '../components/common/MediaUploaders';
import './RecipeForm.css';

import { buildFormData } from '../utils/r2Uploader';
import api from '../services/api';

const RecipeForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [formData, setFormData] = useState({
    name: '',
    ingredientes: '',
    instrucciones: '',
    region_id: '',
    provincias_id: '',
    tiempo_preparacion: '',
    porciones: '',
    como_servir: '',
    calorias: ''
  });

  const [images, setImages] = useState([]); // Array de archivos
  const [imagePreviews, setImagePreviews] = useState([]); // Array de URLs base64
  const [video, setVideo] = useState(null);
  const [videoPreview, setVideoPreview] = useState(null);
  
  const [regions, setRegions] = useState([]);
  const [provinces, setProvinces] = useState([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(isEdit);

  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => {
    loadRegions();
    if (isEdit) {
      loadRecipe();
    }
  }, [id]);

  const loadRegions = async () => {
    try {
      const response = await regionsAPI.getAll();
      setRegions(response.data.data);
    } catch (error) {
      console.error('Error cargando regiones:', error);
    }
  };

  const loadRecipe = async () => {
    try {
      const response = await recipesAPI.getById(id);
      const recipe = response.data.data;
      
      setFormData({
        name: recipe.name,
        ingredientes: recipe.ingredientes,
        instrucciones: recipe.instrucciones,
        region_id: recipe.region_id,
        provincias_id: recipe.provincias_id,
        tiempo_preparacion: recipe.tiempo_preparacion || '',
        porciones: recipe.porciones || '',
        como_servir: recipe.como_servir || '',
        calorias: recipe.calorias || ''
      });
      
      if (recipe.url_foto) {
        setImagePreviews([recipe.url_foto]);
      }

      if (recipe.url_video) {
        setVideoPreview(recipe.url_video);
      }
      
      // Cargar provincias de la región actual
      if (recipe.region_id) {
        const provincesResp = await regionsAPI.getProvinces(recipe.region_id);
        setProvinces(provincesResp.data.data);
      }
    } catch (error) {
      console.error('Error cargando receta:', error);
    } finally {
      setInitialLoading(false);
    }
  };

  const handleRegionChange = async (e) => {
    const regionId = e.target.value;
    setFormData({ ...formData, region_id: regionId, provincias_id: '' });
    
    if (regionId) {
      try {
        const response = await regionsAPI.getProvinces(regionId);
        setProvinces(response.data.data);
      } catch (error) {
        console.error('Error cargando provincias:', error);
      }
    } else {
      setProvinces([]);
    }
  };

  const handleImageFiles = (files) => {
    const newFiles = Array.from(files);
    setImages(prev => [...prev, ...newFiles].slice(0, 5));

    newFiles.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviews(prev => [...prev, reader.result].slice(0, 5));
      };
      reader.readAsDataURL(file);
    });
  };

  const onImageDrop = (e) => {
    e.preventDefault();
    handleImageFiles(e.dataTransfer.files);
  };

  const removeImage = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleVideoFile = (file) => {
    if (file && file.type.startsWith('video/')) {
      setVideo(file);
      setVideoPreview(URL.createObjectURL(file));
    } else {
      alert('Por favor selecciona un archivo de video válido');
    }
  };

  const onVideoDrop = (e) => {
    e.preventDefault();
    handleVideoFile(e.dataTransfer.files[0]);
  };

  const [calculatingCalories, setCalculatingCalories] = useState(false);

  const handleCalculateCalories = async () => {
    if (!formData.ingredientes) {
      toast.error('Primero ingresa los ingredientes');
      return;
    }
    setCalculatingCalories(true);
    try {
      const response = await api.post('/ai/calories', {
        name: formData.name,
        ingredients: formData.ingredientes
      });
      if (response.data.calorias) {
        setFormData(prev => ({ ...prev, calorias: response.data.calorias }));
        toast.success(`Calorías estimadas: ${response.data.calorias} kcal`);
      } else {
        toast.error('No se pudieron calcular las calorías');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al calcular calorías');
    } finally {
      setCalculatingCalories(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setUploadProgress(10);

    try {
      setUploadProgress(30);

      // Construir FormData con archivos + datos
      const submitData = {
        name: formData.name,
        ingredientes: formData.ingredientes,
        instrucciones: formData.instrucciones,
        region_id: formData.region_id,
        provincias_id: formData.provincias_id,
        tiempo_preparacion: formData.tiempo_preparacion,
        porciones: formData.porciones,
        como_servir: formData.como_servir,
        calorias: formData.calorias ? parseInt(formData.calorias, 10) : '',
      };

      const formDataPayload = buildFormData(submitData, images, video);

      setUploadProgress(60);

      if (id) {
        await recipesAPI.update(id, formDataPayload);
        toast.success('Receta actualizada correctamente');
      } else {
        await recipesAPI.create(formDataPayload);
        toast.success('Receta publicada exitosamente');
      }

      setUploadProgress(100);
      navigate('/recipes');
    } catch (error) {
      console.error('Error al guardar:', error);
      toast.error('Error al guardar. Verifique conexión o tamaño de archivos.');
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) return <Layout><div className="loading">Cargando datos...</div></Layout>;

  return (
    <Layout>
      <div className="form-modal-container">
        <div className="form-card">
          <div className="form-header">
            <h2>{isEdit ? 'Editar Receta' : 'Agregar Nueva Receta'}</h2>
            <button className="close-btn" onClick={() => navigate('/recipes')}>✕</button>
          </div>

          <form onSubmit={handleSubmit} className="recipe-form">
            <div className="form-section">
              <input
                type="text"
                placeholder="Título de la receta"
                className="title-input"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div className="media-section">
              {/* Fotos (Multiple + Drag & Drop) */}
              <ImageUploader 
                images={images}
                imagePreviews={imagePreviews}
                onImageDrop={onImageDrop}
                handleImageFiles={handleImageFiles}
                removeImage={removeImage}
              />

              {/* Video (Single + Drag & Drop) */}
              <VideoUploader 
                video={video}
                videoPreview={videoPreview}
                onVideoDrop={onVideoDrop}
                handleVideoFile={handleVideoFile}
              />
            </div>

            <div className="dropdowns-section">
              <div className="input-group">
                <select 
                  value={formData.region_id} 
                  onChange={handleRegionChange} 
                  required
                >
                  <option value="">Región de la Receta</option>
                  {regions.map(r => (
                    <option key={r.id} value={r.id}>{r.name_regiones}</option>
                  ))}
                </select>
              </div>

              <div className="input-group">
                <select 
                  value={formData.provincias_id} 
                  onChange={(e) => setFormData({ ...formData, provincias_id: e.target.value })}
                  required
                  disabled={!formData.region_id}
                >
                  <option value="">Provincia de la Receta</option>
                  {provinces.map(p => (
                    <option key={p.id} value={p.id}>{p.name_provincias}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="content-section">
              <div className="input-group">
                <label>Ingredientes</label>
                <textarea
                  placeholder="Ingrese los ingredientes de la receta..."
                  value={formData.ingredientes}
                  onChange={(e) => setFormData({ ...formData, ingredientes: e.target.value })}
                  required
                />
              </div>

              <div className="input-group">
                <label>Preparación</label>
                <textarea
                  placeholder="Ingrese el modo de preparación..."
                  value={formData.instrucciones}
                  onChange={(e) => setFormData({ ...formData, instrucciones: e.target.value })}
                  required
                />
              </div>

              <div className="input-group">
                <label>Sugerencia de Presentación (Opcional)</label>
                <textarea
                  placeholder="Ej: Acompañar con chifle, canguil, limón y ají casero..."
                  value={formData.como_servir}
                  onChange={(e) => setFormData({ ...formData, como_servir: e.target.value })}
                />
              </div>
            </div>

            <div className="details-row">
              <input 
                type="text" 
                placeholder="Tiempo (ej: 45 min)"
                value={formData.tiempo_preparacion}
                onChange={(e) => setFormData({ ...formData, tiempo_preparacion: e.target.value })}
              />
              <input 
                type="text" 
                placeholder="Porciones (ej: 4)"
                value={formData.porciones}
                onChange={(e) => setFormData({ ...formData, porciones: e.target.value })}
              />
              <div className="calorias-input-group">
                <input 
                  type="number" 
                  placeholder="Calorías"
                  value={formData.calorias}
                  onChange={(e) => setFormData({ ...formData, calorias: e.target.value })}
                  min="0"
                />
                <button 
                  type="button" 
                  className="btn-ai-calc"
                  onClick={handleCalculateCalories}
                  disabled={calculatingCalories}
                  title="Calcular con IA"
                >
                  {calculatingCalories ? '⌛' : '🤖'}
                </button>
              </div>
            </div>

            <div className="footer-section">
              <button 
                type="submit" 
                className={`btn btn-primary btn-large ${loading ? 'uploading' : ''}`}
                disabled={loading}
                style={{ 
                  width: '100%', 
                  padding: '15px', 
                  marginTop: '20px',
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                <span style={{ position: 'relative', zIndex: 2 }}>
                  {loading ? `Subiendo... ${uploadProgress}%` : (id ? 'Actualizar Receta' : 'Publicar Receta')}
                </span>

                {loading && (
                  <div 
                    style={{ 
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      height: '100%',
                      width: `${uploadProgress}%`,
                      background: 'rgba(0, 0, 0, 0.2)',
                      zIndex: 1,
                      transition: 'width 0.2s linear'
                    }} 
                  />
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
};

export default RecipeForm;
