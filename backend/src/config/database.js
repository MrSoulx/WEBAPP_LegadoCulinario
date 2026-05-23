const { createClient } = require('@supabase/supabase-js');

// Configuración de Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.warn('⚠️ Advertencia: SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY no están definidos.');
  console.log('SUPABASE_URL:', supabaseUrl ? 'Definida' : 'Faltante');
  console.log('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? 'Definida' : 'Faltante');
}

// Crear cliente de Supabase con service role key (para operaciones del backend)
let supabase;
if (supabaseUrl && supabaseServiceKey) {
  supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
} else {
  console.error('❌ Error: No se puede inicializar Supabase sin URL o Key.');
}

// Función para verificar conexión
const testConnection = async () => {
  try {
    if (!supabase) {
      console.warn('⚠️ testConnection cancelado: Supabase no está inicializado.');
      return false;
    }
    const { data, error } = await supabase.from('users').select('count').limit(1);
    
    if (error && error.code !== 'PGRST116') { // PGRST116 = tabla no existe aún
      throw error;
    }
    
    console.log('✅ Supabase conectado correctamente');
    return true;
  } catch (error) {
    console.error('❌ Error conectando a Supabase:', error.message);
    return false;
  }
};

module.exports = { supabase, testConnection };
