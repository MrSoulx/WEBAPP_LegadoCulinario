const { supabase } = require('../config/database');

exports.protect = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No autorizado, token no proporcionado'
      });
    }

    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !authUser) {
      return res.status(401).json({
        success: false,
        message: 'Token inválido o expirado'
      });
    }

    const { data: user, error } = await supabase
      .from('users')
      .select('id, name, correo, role')
      .eq('id', authUser.id)
      .single();

    if (error || !user) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Error en protect middleware:', error);
    res.status(401).json({
      success: false,
      message: 'No autorizado',
      error: error.message
    });
  }
};
