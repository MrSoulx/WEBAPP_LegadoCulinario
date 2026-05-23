import { useState } from 'react';
import Sidebar from './Sidebar';
import './Layout.css';
import { Toaster } from 'react-hot-toast';

const Layout = ({ children, title }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="layout-container">
      <Sidebar isOpen={isSidebarOpen} toggle={() => setIsSidebarOpen(!isSidebarOpen)} />
      
      <main className="main-content">
        {/* Header integrado: Botón + Título alineados */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '20px', 
          marginBottom: '40px' // Margen hacia el contenido
        }}>
          {/* Botón de Hamburguesa */}
          <button 
            onClick={() => setIsSidebarOpen(true)}
            style={{
              background: 'white',
              border: 'none',
              borderRadius: '12px', // Bordes suaves
              padding: '10px',
              cursor: 'pointer',
              fontSize: '24px', // Icono tamaño normal dentro de la caja
              color: '#333',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(0,0,0,0.08)', // Sombra elegante
              minWidth: '50px',
              height: '50px'
            }}
          >
            ☰
          </button>

          {/* Título de la página */}
          {title && (
            <h1 style={{ 
              fontSize: '40px', 
              fontWeight: '800', 
              color: '#1a1a1a', 
              margin: 0, 
              lineHeight: 1 
            }}>
              {title}
            </h1>
          )}
        </div>

        <Toaster 
          position="top-right" 
          toastOptions={{
            success: {
              style: {
                background: '#FF9800',
                color: '#fff',
              },
              iconTheme: {
                primary: '#fff',
                secondary: '#FF9800',
              },
            },
          }}
        />
        {children}
      </main>
    </div>
  );
};

export default Layout;
