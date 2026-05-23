const fs = require('fs');
const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const PROVINCIAS = [
  { id: 1,  nombre: 'Esmeraldas',          region_id: 1 },
  { id: 2,  nombre: 'Manabí',              region_id: 1 },
  { id: 3,  nombre: 'Santo Domingo de los Tsáchilas', region_id: 1 },
  { id: 4,  nombre: 'Los Ríos',            region_id: 1 },
  { id: 5,  nombre: 'Guayas',              region_id: 1 },
  { id: 6,  nombre: 'Santa Elena',         region_id: 1 },
  { id: 7,  nombre: 'El Oro',              region_id: 1 },
  { id: 8,  nombre: 'Carchi',              region_id: 2 },
  { id: 9,  nombre: 'Imbabura',            region_id: 2 },
  { id: 10, nombre: 'Pichincha',           region_id: 2 },
  { id: 11, nombre: 'Cotopaxi',            region_id: 2 },
  { id: 12, nombre: 'Tungurahua',          region_id: 2 },
  { id: 13, nombre: 'Bolívar',             region_id: 2 },
  { id: 14, nombre: 'Chimborazo',          region_id: 2 },
  { id: 15, nombre: 'Cañar',               region_id: 2 },
  { id: 16, nombre: 'Azuay',               region_id: 2 },
  { id: 17, nombre: 'Loja',                region_id: 2 },
  { id: 18, nombre: 'Sucumbíos',           region_id: 3 },
  { id: 19, nombre: 'Napo',                region_id: 3 },
  { id: 20, nombre: 'Orellana',            region_id: 3 },
  { id: 21, nombre: 'Pastaza',             region_id: 3 },
  { id: 22, nombre: 'Morona Santiago',     region_id: 3 },
  { id: 23, nombre: 'Zamora Chinchipe',    region_id: 3 },
  { id: 24, nombre: 'Galápagos',           region_id: 4 },
];

function buildPrompt() {
  const provinciasList = PROVINCIAS.map(p => `  - ${p.nombre} (region_id=${p.region_id}, provincia_id=${p.id})`).join('\n');
  return `Eres un experto en gastronomía ecuatoriana. Genera EXACTAMENTE 24 recetas tradicionales, UNA por cada provincia de Ecuador.

Para CADA receta, devuelve SOLO un objeto JSON con esta estructura exacta:
{
  "nombre": "Nombre de la receta",
  "ingredientes": "Lista de ingredientes separados por saltos de línea",
  "instrucciones": "Instrucciones de preparación paso a paso separadas por saltos de línea",
  "descripcion": "Una breve descripción de 1-2 oraciones",
  "region_id": (número de región 1-4),
  "provincia_id": (número de provincia),
  "tiempo_minutos": (número de minutos),
  "porciones": (número de porciones),
  "calorias": (número aproximado de calorías por porción),
  "como_servir": "Sugerencia de cómo servir"
}

Reglas IMPORTANTES:
- Cada provincia debe tener UNA receta TÍPICA de esa provincia.
- El nombre y descripción deben ser en español.
- Los ingredientes deben ser reales y ecuatorianos.
- Las instrucciones deben ser completas y en español.

Provincias a generar (EN ESE ORDEN):
${provinciasList}

Devuelve SOLO un array JSON válido con exactamente 24 objetos, sin texto adicional, sin markdown, sin explicaciones.`;
}

async function callGroq(prompt) {
  console.log('🤖 Enviando prompt a Groq AI (Llama 3.3 70B)...');
  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 8000,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Groq API error ${response.status}: ${text.slice(0, 200)}`);
  }

  const data = await response.json();
  const content = data.choices[0].message.content.trim();
  const cleaned = content.replace(/^```json?\n?/i, '').replace(/\n?```$/i, '').trim();
  return JSON.parse(cleaned);
}

async function insertRecipe(recipe) {
  const body = {
    name: recipe.nombre,
    ingredientes: recipe.ingredientes,
    instrucciones: recipe.instrucciones,
    description: recipe.descripcion || null,
    region_id: recipe.region_id,
    provincias_id: recipe.provincia_id,
    tiempo_preparacion: recipe.tiempo_minutos || null,
    porciones: recipe.porciones || null,
    calorias: recipe.calorias || null,
    como_servir: recipe.como_servir || null,
  };

  const response = await fetch(`${SUPABASE_URL}/rest/v1/recetas`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      'apikey': SUPABASE_SERVICE_ROLE_KEY,
      'Prefer': 'return=representation',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`HTTP ${response.status}: ${text.slice(0, 150)}`);
  }

  const result = await response.json();
  return result[0]?.id;
}

async function main() {
  console.log('🚀 Generando 24 recetas con Groq AI...\n');

  // Paso 1: Generar con Groq
  let recetas;
  try {
    const prompt = buildPrompt();
    recetas = await callGroq(prompt);
    console.log(`✅ Recibidas ${recetas.length} recetas de Groq\n`);

    if (!Array.isArray(recetas) || recetas.length !== 24) {
      throw new Error(`Se esperaban 24 recetas, se recibieron ${Array.isArray(recetas) ? recetas.length : 'no-array'}`);
    }
  } catch (err) {
    console.error('❌ Error generando:', err.message);
    process.exit(1);
  }

  // Paso 2: Insertar en Supabase vía REST API
  let inserted = 0;
  let errors = 0;

  for (let i = 0; i < recetas.length; i++) {
    const r = recetas[i];
    const prov = PROVINCIAS[i];

    try {
      // Validar provincia_id
      r.provincia_id = prov.id;
      r.region_id = prov.region_id;

      const id = await insertRecipe(r);
      console.log(`  ✅ [${i + 1}/24] ${r.nombre.padEnd(45)} ${prov.nombre.padEnd(30)} ID: ${id}`);
      inserted++;
    } catch (err) {
      console.error(`  ❌ [${i + 1}/24] ${r.nombre?.padEnd(45) || 'N/A'} ${prov.nombre.padEnd(30)} ${err.message}`);
      errors++;
    }
  }

  console.log(`\n📊 Resultado final: ${inserted} insertadas, ${errors} errores`);
}

main();
