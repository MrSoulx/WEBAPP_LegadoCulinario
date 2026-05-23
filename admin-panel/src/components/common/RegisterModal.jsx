import { useState } from 'react';
import { supabase } from '../../utils/supabaseClient';
import './RegisterModal.css';

const RegisterModal = ({ isOpen, onClose }) => {
  const [formData, setFormData] = useState({
    name: '',
    correo: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      return setError('Las contraseñas no coinciden');
    }

    setLoading(true);
    try {
      const { error: signUpError } = await supabase.auth.signUp({
        email: formData.correo,
        password: formData.password,
        options: {
          data: { name: formData.name }
        }
      });

      if (signUpError) {
        throw signUpError;
      }
      
      setSuccess(true);
      
      setTimeout(() => {
        setSuccess(false);
        onClose();
        setFormData({ name: '', correo: '', password: '', confirmPassword: '' });
      }, 3000);

    } catch (error) {
      setError(error.message || 'Error al registrar usuario');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content register-modal">
        <button className="modal-close" onClick={onClose}>✕</button>
        
        <div className="modal-header">
          <img src="/logo.jpg" alt="Logo" className="modal-logo" />
          <h2>{success ? '¡Bienvenido!' : 'Crear nueva cuenta'}</h2>
          <p>{success ? 'Tu cuenta ha sido creada con éxito.' : 'Únete a la administración del Legado Culinario'}</p>
        </div>

        {success ? (
          <div className="success-container animate-fade-in">
            <div className="success-icon">✅</div>
            <p className="success-text">Redirigiendo al login...</p>
          </div>
        ) : (
          <>
            {error && <div className="login-error">{error}</div>}

            <form onSubmit={handleSubmit} className="login-form">
              <div className="form-group">
                <input
                  type="text"
                  placeholder="Nombre Completo"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <input
                  type="email"
                  placeholder="Correo Electrónico"
                  value={formData.correo}
                  onChange={(e) => setFormData({ ...formData, correo: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <input
                  type="password"
                  placeholder="Contraseña"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <input
                  type="password"
                  placeholder="Confirmar Contraseña"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  required
                />
              </div>

              <button 
                type="submit" 
                className="btn btn-success btn-large"
                disabled={loading}
              >
                {loading ? 'Creando cuenta...' : 'Registrarme'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default RegisterModal;
