import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { recipesAPI } from '../services/api';
import Layout from '../components/layout/Layout';
import { toast } from 'react-hot-toast';
import ConfirmModal from '../components/common/ConfirmModal';
import './RecipeList.css';

const RecipeList = () => {
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Estado para el modal de borrado
  const [showModal, setShowModal] = useState(false);
  const [recipeToDelete, setRecipeToDelete] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    loadRecipes();
  }, []);

  const loadRecipes = async () => {
    try {
      const response = await recipesAPI.getAll({ limit: 100 });
      setRecipes(response.data.data);
    } catch (error) {
      console.error('Error cargando recetas:', error);
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = (id, e) => {
    e.stopPropagation();
    setRecipeToDelete(id);
    setShowModal(true);
  };

  const executeDelete = async () => {
    if (!recipeToDelete) return;
    
    // Cerrar modal inmediatamente
    setShowModal(false);

    const toastId = toast.loading('Eliminando...');

    try {
      await recipesAPI.delete(recipeToDelete);
      
      toast.success('Receta eliminada correctamente', { id: toastId });
      setRecipes(recipes.filter(r => r.id !== recipeToDelete));
    } catch (error) {
      console.error(error);
      
      // Manejo inteligente del error 404
      if (error.response && error.response.status === 404) {
        toast.success('La receta ya no existía (actualizado)', { id: toastId });
        setRecipes(recipes.filter(r => r.id !== recipeToDelete));
      } else {
        toast.error('Error al eliminar la receta', { id: toastId });
      }
    }
  };

  return (
    <Layout title="Listado de Recetas">
      <div className="recipe-list-container">
        <div className="recipe-list-header" style={{ marginBottom: '20px' }}>
          <p>Recetas Totales: {recipes.length}</p>
        </div>

        {loading ? (
          <div className="loading-state">Cargando recetas...</div>
        ) : (
          <div className="recipe-grid">
            {recipes.map((recipe) => (
              <div 
                key={recipe.id} 
                className="recipe-card animate-fade-in"
                onClick={() => navigate(`/recipes/edit/${recipe.id}`)}
              >
                <div className="recipe-image-wrapper">
                  {recipe.url_foto ? (
                    <img src={recipe.url_foto} alt={recipe.name} />
                  ) : (
                    <div className="no-image-placeholder">
                      <span className="placeholder-icon">🍲</span>
                    </div>
                  )}
                  {recipe.url_video && (
                    <div className="video-badge" title="Esta receta tiene video">
                      🎬
                    </div>
                  )}
                  <div className="recipe-card-overlay">
                    <div className="overlay-content">
                      <button 
                        className="action-btn edit-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/recipes/edit/${recipe.id}`);
                        }}
                      >
                        ✏️ Editar
                      </button>
                      <button 
                        className="action-btn delete-btn"
                        onClick={(e) => confirmDelete(recipe.id, e)}
                      >
                        ❌ Eliminar
                      </button>
                    </div>
                  </div>
                </div>
                <div className="recipe-info">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className="recipe-region">{recipe.regiones?.name_regiones || 'General'}</span>
                    <span className="recipe-views" style={{ fontSize: '12px', color: '#666', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      👁️ {recipe.vistas || 0}
                    </span>
                  </div>
                  <h3>{recipe.name}</h3>
                  <p className="recipe-province">{recipe.provincias?.name_provincias}</p>
                  {recipe.users?.name && (
                    <p className="recipe-author" style={{ fontSize: '11px', color: '#999', marginTop: '4px' }}>
                      por {recipe.users.name}
                    </p>
                  )}
                </div>
              </div>
            ))}
            
            {/* Botón para agregar nueva si el grid está vacío o al final */}
            <div 
              className="recipe-card add-new-card"
              onClick={() => navigate('/recipes/new')}
            >
              <div className="add-icon">+</div>
              <p>Agregar Nueva</p>
            </div>
          </div>
        )}

        <ConfirmModal
          isOpen={showModal}
          title="¿Eliminar Receta?"
          message="Esta acción no se puede deshacer. ¿Seguro que quieres borrarla?"
          onConfirm={executeDelete}
          onCancel={() => setShowModal(false)}
        />
      </div>
    </Layout>
  );
};

export default RecipeList;
