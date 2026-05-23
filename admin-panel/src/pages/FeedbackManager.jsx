import { useState, useEffect } from 'react';
import Layout from '../components/layout/Layout';
import { feedbackAPI } from '../services/api';
import { toast } from 'react-hot-toast';
import ConfirmModal from '../components/common/ConfirmModal';
import './FeedbackManager.css';

const FeedbackManager = () => {
  // Force rebuild timestamp: 2026-01-02-FINAL-V2
  const [feedbackList, setFeedbackList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Estado para búsqueda y eliminación
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, feedbackId: null, count: 0 });
  
  // Selección múltiple
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);

  useEffect(() => {
    fetchFeedback();
  }, []);

  const fetchFeedback = async () => {
    try {
      setLoading(true);
      const response = await feedbackAPI.getAll({ limit: 1000 }); // Traer suficientes para filtrar localmente
      if (response.data.success) {
        setFeedbackList(response.data.data);
      } else {
         setFeedbackList(response.data.data || []);
      }
    } catch (err) {
      console.error('Error fetching feedback:', err);
      setError('Error al cargar los comentarios');
      toast.error('No se pudieron cargar los comentarios');
    } finally {
      setLoading(false);
    }
  };

  // Toggle selection
  const toggleSelection = (id) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(pid => pid !== id) : [...prev, id]
    );
  };

  // Helper para color avatar
  const stringToColor = (string) => {
    let hash = 0;
    for (let i = 0; i < string.length; i++) {
        hash = string.charCodeAt(i) + ((hash << 5) - hash);
    }
    const c = (hash & 0x00FFFFFF).toString(16).toUpperCase();
    return '#' + '00000'.substring(0, 6 - c.length) + c;
  };

  // Confirmar eliminación (Bulk)
  const handleConfirmDelete = async () => {
    try {
      const idsToDelete = deleteModal.feedbackId ? [deleteModal.feedbackId] : selectedIds;
      
      // Ejecutar eliminaciones en paralelo
      await Promise.all(idsToDelete.map(id => feedbackAPI.delete(id)));
      
      // Cerrar modal
      setDeleteModal({ isOpen: false, feedbackId: null, count: 0 });
      setIsSelectionMode(false);
      setSelectedIds([]);
      
      // Actualizar lista localmente
      setFeedbackList(prev => prev.filter(item => !idsToDelete.includes(item.id)));
      
      // Notificación de éxito
      toast.success('Comentarios eliminados correctamente');
    } catch (err) {
      console.error('Error deleting feedback:', err);
      toast.error('Error al eliminar comentarios');
    }
  };

  const renderStars = (rating) => {
    return '⭐'.repeat(rating);
  };

  // Filtrar y Agrupar
  const filteredFeedback = feedbackList.filter(item => {
    const searchLower = searchTerm.toLowerCase();
    const recipeName = item.recetas?.name || '';
    const userName = item.user_name || '';
    const comment = item.comentario || '';
    
    return recipeName.toLowerCase().includes(searchLower) ||
           userName.toLowerCase().includes(searchLower) ||
           comment.toLowerCase().includes(searchLower);
  });

  const groupedFeedback = filteredFeedback.reduce((acc, item) => {
    const recipeName = item.recetas?.name || 'Receta Desconocida';
    if (!acc[recipeName]) {
      acc[recipeName] = [];
    }
    acc[recipeName].push(item);
    return acc;
  }, {});

  if (loading) return <Layout><div className="loading">Cargando comentarios...</div></Layout>;
  if (error) return <Layout><div className="error">{error}</div></Layout>;

  return (
    <Layout>
      <div className="feedback-manager">
        <div className="feedback-header-actions">
          <h1 className="page-title">Gestión de Comentarios</h1>
          
          <div className="action-buttons">
            {!isSelectionMode ? (
              <button 
                className="btn-action btn-toggle-delete" 
                onClick={() => setIsSelectionMode(true)}
                style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
                  <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                </svg>
                Borrar
              </button>
            ) : (
              <div className="selection-actions">
                <span className="selection-count">{selectedIds.length} seleccionados</span>
                <button 
                  className="btn-action btn-cancel" 
                  onClick={() => {
                    setIsSelectionMode(false);
                    setSelectedIds([]);
                  }}
                >
                  Cancelar
                </button>
                <button 
                  className="btn-action btn-confirm-delete" 
                  onClick={() => selectedIds.length > 0 && setDeleteModal({ isOpen: true, count: selectedIds.length })}
                  disabled={selectedIds.length === 0}
                >
                  Eliminar ({selectedIds.length})
                </button>
              </div>
            )}
          </div>
        </div>
        
        {/* Barra de Búsqueda */}
        <div className="search-container">
          <input
            type="text"
            placeholder="🔍 Buscar por receta, usuario o comentario..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>

        {Object.keys(groupedFeedback).length === 0 ? (
          <p className="no-feedback">
            {searchTerm ? 'No se encontraron comentarios con esa búsqueda.' : 'No hay comentarios registrados.'}
          </p>
        ) : (
          <div className="feedback-groups">
            {Object.entries(groupedFeedback).map(([recipeName, items]) => (
              <div key={recipeName} className="recipe-feedback-group">
                <h2 className="recipe-group-title">
                  {recipeName} 
                  <span className="badge">{items.length}</span>
                </h2>
                
                <div className="feedback-grid">
                  {items.map(item => {
                    const isSelected = selectedIds.includes(item.id);
                    return (
                      <div 
                        key={item.id} 
                        className={`google-review-card ${isSelectionMode ? 'selectable' : ''} ${isSelected ? 'selected' : ''}`}
                        onClick={() => {
                          if (isSelectionMode) {
                            toggleSelection(item.id);
                          }
                        }}
                      >
                        <div className="card-header">
                          <div className="user-avatar" style={{ backgroundColor: stringToColor(item.user_name || 'A') }}>
                            {(item.user_name || 'A')[0].toUpperCase()}
                          </div>
                          <div className="header-info">
                            <span className="header-name">{item.user_name || 'Anónimo'}</span>
                            <span className="header-email">({item.correo})</span>
                          </div>
                        </div>

                        <div className="card-rating" style={{ display: 'flex', gap: '1px' }}>
                          {[...Array(5)].map((_, i) => (
                            <svg 
                              key={i}
                              width="18" 
                              height="18" 
                              viewBox="0 0 24 24" 
                              fill={i < item.puntuacion ? "#FBC02D" : "#E0E0E0"}
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
                            </svg>
                          ))}
                        </div>

                        <div className="card-content">
                          <p>{item.comentario || 'Sin comentario'}</p>
                        </div>

                        {/* Selection Checkbox Overlay */}
                        {isSelectionMode && (
                          <div className="selection-overlay">
                            <div className={`checkbox ${isSelected ? 'checked' : ''}`}>
                              {isSelected && '✓'}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal de Confirmación */}
        <ConfirmModal
          isOpen={deleteModal.isOpen}
          title="Eliminar Comentarios"
          message={`¿Estás seguro de eliminar ${deleteModal.count > 1 ? `estos ${deleteModal.count} comentarios` : 'este comentario'}? Esta acción no se puede deshacer.`}
          onConfirm={handleConfirmDelete}
          onCancel={() => setDeleteModal({ isOpen: false, feedbackId: null, count: 0 })}
        />
      </div>
    </Layout>
  );
};

export default FeedbackManager;
