import { useState } from 'react';
import { useAuth } from '../utils/AuthContext';
import { authAPI } from '../services/api';
import Layout from '../components/layout/Layout';
import { toast } from 'react-hot-toast';
import './Profile.css';

const Profile = () => {
  const { user, session, setUser } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async (e) => {
    e.preventDefault();

    if (newPassword && newPassword !== confirmPassword) {
      toast.error('Las contraseñas no coinciden');
      return;
    }

    if (newPassword && newPassword.length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    setSaving(true);
    try {
      const data = { name };
      if (currentPassword && newPassword) {
        data.currentPassword = currentPassword;
        data.newPassword = newPassword;
      }

      const response = await authAPI.updateProfile(data);
      setUser(response.data.data);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      toast.success('Perfil actualizado');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al actualizar');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Layout title="Mi Perfil">
      <div className="profile-container">
        <div className="profile-card">
          <div className="profile-avatar">
            {user?.name?.charAt(0).toUpperCase() || 'U'}
          </div>
          <h2>{user?.name}</h2>
          <p className="profile-email">{user?.correo}</p>
          <span className="profile-role">{user?.role}</span>
        </div>

        <form className="profile-form" onSubmit={handleSave}>
          <h3>Actualizar datos</h3>

          <div className="form-group">
            <label>Nombre</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Tu nombre"
              required
            />
          </div>

          <hr />

          <h4>Cambiar contraseña (opcional)</h4>

          <div className="form-group">
            <label>Contraseña actual</label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Dejar vacío si no deseas cambiarla"
            />
          </div>

          <div className="form-group">
            <label>Nueva contraseña</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Mínimo 6 caracteres"
            />
          </div>

          <div className="form-group">
            <label>Confirmar nueva contraseña</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repite la nueva contraseña"
            />
          </div>

          <button type="submit" className="btn btn-primary" disabled={saving} style={{ width: '100%', padding: '12px', marginTop: '10px' }}>
            {saving ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </form>
      </div>
    </Layout>
  );
};

export default Profile;
