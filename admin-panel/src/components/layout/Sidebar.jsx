import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../utils/AuthContext';
import './Sidebar.css';

const Sidebar = ({ isOpen, toggle }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuItems = [
    { path: '/dashboard', label: 'Inicio', icon: '' },
    { path: '/recipes', label: 'Recetas', icon: '' },
    { path: '/feedback', label: 'Comentarios', icon: '' },
    { path: '/stats', label: 'Vistas mensuales', icon: '' },
    { path: '/profile', label: 'Mi Perfil', icon: '' },
  ];

  return (
    <>
      {/* Overlay para cerrar al hacer click fuera */}
      {isOpen && <div className="sidebar-overlay" onClick={toggle} style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        background: 'rgba(0,0,0,0.5)', zIndex: 999
      }} />}

      <div className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-header" style={{ position: 'relative', textAlign: 'center', padding: '20px' }}>
          <div className="sidebar-logo">
            <img src="/logo.jpg" alt="Legado Culinario" />
          </div>
          {/* Botón X para cerrar (visible solo si está abierto) */}
          <button 
            onClick={toggle} 
            style={{ 
              position: 'absolute',
              top: '15px',
              right: '15px',
              background: 'none', 
              border: 'none', 
              color: 'white', 
              fontSize: '24px', 
              cursor: 'pointer' 
            }}
          >
            ✕
          </button>
        </div>

        <nav className="sidebar-menu">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={toggle} // Cerrar al navegar
              className={`sidebar-item ${location.pathname === item.path ? 'active' : ''}`}
            >
              <span className="sidebar-icon">{item.icon}</span>
              <span className="sidebar-label">{item.label}</span>
            </Link>
          ))}
          
          <button onClick={handleLogout} className="sidebar-item sidebar-logout">
            <span className="sidebar-icon"></span>
            <span className="sidebar-label">Cerrar Sesión</span>
          </button>
        </nav>
      </div>
    </>
  );
};

export default Sidebar;
