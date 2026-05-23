const { supabase } = require('../config/database');

// @desc    Registrar nuevo usuario (via Supabase Auth)
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
  try {
    const { name, correo, password } = req.body;

    if (!name || !correo || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, correo y password son requeridos'
      });
    }

    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: correo,
      password: password,
      user_metadata: { name }
    });

    if (authError) {
      if (authError.message?.includes('already registered')) {
        return res.status(400).json({
          success: false,
          message: 'El correo ya está registrado'
        });
      }
      throw authError;
    }

    const { data: user, error } = await supabase
      .from('users')
      .select('id, name, correo, role')
      .eq('id', authData.user.id)
      .single();

    if (error) throw error;

    const { data: { session }, error: signInError } = await supabase.auth.signInWithPassword({
      email: correo,
      password
    });

    if (signInError) throw signInError;

    res.status(201).json({
      success: true,
      message: 'Usuario registrado exitosamente',
      data: {
        user,
        token: session.access_token,
        refreshToken: session.refresh_token
      }
    });
  } catch (error) {
    console.error('Error en register:', error);
    res.status(500).json({
      success: false,
      message: 'Error al registrar usuario',
      error: error.message
    });
  }
};

// @desc    Login de usuario (via Supabase Auth)
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    const { correo, password } = req.body;

    if (!correo || !password) {
      return res.status(400).json({
        success: false,
        message: 'Por favor ingrese correo y contraseña'
      });
    }

    const { data: { session }, error: authError } = await supabase.auth.signInWithPassword({
      email: correo,
      password
    });

    if (authError) {
      return res.status(401).json({
        success: false,
        message: 'Credenciales inválidas'
      });
    }

    const { data: user, error } = await supabase
      .from('users')
      .select('id, name, correo, role')
      .eq('id', session.user.id)
      .single();

    if (error) throw error;

    res.json({
      success: true,
      message: 'Login exitoso',
      data: {
        user,
        token: session.access_token,
        refreshToken: session.refresh_token
      }
    });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({
      success: false,
      message: 'Error al iniciar sesión',
      error: error.message
    });
  }
};

// @desc    Obtener usuario actual
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('id, name, correo, role, created_at, updated_at')
      .eq('id', req.user.id)
      .single();

    if (error || !user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Error en getMe:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener usuario',
      error: error.message
    });
  }
};

// @desc    Actualizar perfil (nombre y/o password)
// @route   PUT /api/auth/profile
// @access  Private
exports.updateProfile = async (req, res) => {
  try {
    const { name, currentPassword, newPassword } = req.body;

    if (name) {
      const { error: updateError } = await supabase
        .from('users')
        .update({ name })
        .eq('id', req.user.id);

      if (updateError) throw updateError;
    }

    if (currentPassword && newPassword) {
      const { error: passError } = await supabase.auth.admin.updateUserById(
        req.user.id,
        { password: newPassword }
      );

      if (passError) {
        return res.status(400).json({
          success: false,
          message: 'Error al actualizar contraseña',
          error: passError.message
        });
      }
    }

    const { data: user, error } = await supabase
      .from('users')
      .select('id, name, correo, role, created_at, updated_at')
      .eq('id', req.user.id)
      .single();

    if (error) throw error;

    res.json({
      success: true,
      message: 'Perfil actualizado exitosamente',
      data: user
    });
  } catch (error) {
    console.error('Error en updateProfile:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar perfil',
      error: error.message
    });
  }
};

// @desc    Logout
// @route   POST /api/auth/logout
// @access  Private
exports.logout = async (req, res) => {
  res.json({
    success: true,
    message: 'Logout exitoso'
  });
};
