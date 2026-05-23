/**
 * Punto de entrada principal de la aplicación React.
 * Renderiza el componente App en el elemento DOM con id 'root'.
 */
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css'; // Estilos globales
import App from './App'; // Componente raíz
import './i18n'; // Configuración de internacionalización

// Parche de compatibilidad para Google Translate y React
// Evita que React falle cuando Google Translate modifica nodos en el DOM
if (typeof Node !== 'undefined' && Node.prototype) {
  const originalRemoveChild = Node.prototype.removeChild;
  Node.prototype.removeChild = function(child) {
    if (child.parentNode !== this) return child;
    return originalRemoveChild.apply(this, arguments);
  };
  const originalInsertBefore = Node.prototype.insertBefore;
  Node.prototype.insertBefore = function(newNode, referenceNode) {
    if (referenceNode && referenceNode.parentNode !== this) return newNode;
    return originalInsertBefore.apply(this, arguments);
  };
}

// Crear la raíz de React
const root = ReactDOM.createRoot(document.getElementById('root'));

// Renderizar la aplicación dentro de StrictMode para comprobaciones adicionales
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
