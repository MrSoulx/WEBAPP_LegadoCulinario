import React from 'react';
import './styles/CustomAlert.css';

const CustomAlert = ({ isOpen, onClose, title, message, type = 'success' }) => {
  if (!isOpen) return null;

  return (
    <div className="custom-alert-overlay">
      <div className="custom-alert-content glass-card animate-pop">
        <div className={`alert-icon-circle ${type}`}>
          {type === 'success' ? '✓' : 'ℹ'}
        </div>
        <h2 className="alert-title">{title}</h2>
        <p className="alert-message">{message}</p>
        <button className="btn-3d btn-insular alert-button" onClick={onClose}>
          Entendido
        </button>
      </div>
    </div>
  );
};

export default CustomAlert;
