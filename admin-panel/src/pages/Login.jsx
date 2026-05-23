import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../utils/AuthContext';
import RegisterModal from '../components/common/RegisterModal';
import './Login.css';

const Login = () => {
  const [correo, setCorreo] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await login({ correo, password });

    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.error);
    }
    
    setLoading(false);
  };

  return (
    <div className="login-container">
      <div className={`login-card ${error ? 'shake-card' : ''}`}>
        <div className="login-logo">
          <img src="/logo.jpg" alt="Legado Culinario" />
        </div>
        
        <h1 className="login-title">Panel Administrativo</h1>
        <h2 className="login-subtitle">Legado Culinario</h2>

        {error && (
          <div className="login-error">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <input
              type="email"
              placeholder="Usuario"
              value={correo}
              onChange={(e) => {
                setCorreo(e.target.value);
                if (error) setError('');
              }}
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <input
              type="password"
              placeholder="Contraseña"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (error) setError('');
              }}
              required
              disabled={loading}
            />
          </div>

          <button 
            type="submit" 
            className="btn btn-primary btn-large"
            disabled={loading}
          >
            {loading ? 'Iniciando...' : 'Iniciar Sesión'}
          </button>
        </form>

        <div className="mt-4">
          <p style={{ fontSize: '14px', color: 'var(--texto-secundario)' }}>
            ¿No tienes cuenta? <button 
              onClick={() => setIsRegisterOpen(true)}
              style={{ background: 'none', border: 'none', color: 'var(--azul-editar)', fontWeight: 'bold', cursor: 'pointer', padding: 0 }}
            >Regístrate aquí</button>
          </p>
        </div>
      </div>

      <div className="login-footer">
        Legado culinario
      </div>

      <RegisterModal 
        isOpen={isRegisterOpen} 
        onClose={() => setIsRegisterOpen(false)} 
      />
    </div>
  );
};

export default Login;
