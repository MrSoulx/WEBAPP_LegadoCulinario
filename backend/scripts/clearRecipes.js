const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY requeridos en backend/.env');
  process.exit(1);
}

async function main() {
  console.log('Eliminando todas las recetas de Supabase...');

  const response = await fetch(`${SUPABASE_URL}/rest/v1/recetas?id=gte.0`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      'apikey': SUPABASE_SERVICE_ROLE_KEY,
      'Prefer': 'return=minimal',
    },
  });

  if (!response.ok) {
    const text = await response.text();
    console.error(`Error ${response.status}: ${text.slice(0, 200)}`);
    process.exit(1);
  }

  console.log('Todas las recetas eliminadas correctamente');
}

main();
