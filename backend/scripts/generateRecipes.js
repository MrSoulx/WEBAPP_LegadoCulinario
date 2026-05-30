const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const PROVINCIAS = [
  { id: 1,  nombre: 'Esmeraldas',                     region_id: 1, receta: 'Encocado de pescado o camarón' },
  { id: 2,  nombre: 'Manabí',                         region_id: 1, receta: 'Viche de pescado o camarón' },
  { id: 3,  nombre: 'Santo Domingo de los Tsáchilas',  region_id: 1, receta: 'Pandado de pescado' },
  { id: 4,  nombre: 'Los Ríos',                       region_id: 1, receta: 'Encanutado de bocachico' },
  { id: 5,  nombre: 'Guayas',                         region_id: 1, receta: 'Encebollado de pescado' },
  { id: 6,  nombre: 'Santa Elena',                    region_id: 1, receta: 'Ceviche de concha negra' },
  { id: 7,  nombre: 'El Oro',                         region_id: 1, receta: 'Tigrillo' },
  { id: 8,  nombre: 'Carchi',                         region_id: 2, receta: 'Cuy con papas' },
  { id: 9,  nombre: 'Imbabura',                       region_id: 2, receta: 'Fritada imbabureña' },
  { id: 10, nombre: 'Pichincha',                      region_id: 2, receta: 'Locro de papas' },
  { id: 11, nombre: 'Cotopaxi',                       region_id: 2, receta: 'Chugchucaras' },
  { id: 12, nombre: 'Tungurahua',                     region_id: 2, receta: 'Llapingachos' },
  { id: 13, nombre: 'Bolívar',                        region_id: 2, receta: 'Chigüiles' },
  { id: 14, nombre: 'Chimborazo',                     region_id: 2, receta: 'Hornado riobambeño' },
  { id: 15, nombre: 'Cañar',                          region_id: 2, receta: 'Cascaritas' },
  { id: 16, nombre: 'Azuay',                          region_id: 2, receta: 'Mote pillo' },
  { id: 17, nombre: 'Loja',                           region_id: 2, receta: 'Repet' },
  { id: 18, nombre: 'Sucumbíos',                      region_id: 3, receta: 'Ceviche de palmito' },
  { id: 19, nombre: 'Napo',                           region_id: 3, receta: 'Maito de tilapia o carachama' },
  { id: 20, nombre: 'Orellana',                       region_id: 3, receta: 'Uchumanka' },
  { id: 21, nombre: 'Pastaza',                        region_id: 3, receta: 'Ico de palmito con pescado' },
  { id: 22, nombre: 'Morona Santiago',                region_id: 3, receta: 'Ayampaco' },
  { id: 23, nombre: 'Zamora Chinchipe',               region_id: 3, receta: 'Caldo de caracha' },
  { id: 24, nombre: 'Galápagos',                      region_id: 4, receta: 'Arroz marinero' },
];

function buildPrompt() {
  const provinciasList = PROVINCIAS.map(
    (p, i) => `${i + 1}. ${p.nombre} (region_id=${p.region_id}, provincia_id=${p.id}) -> ${p.receta}`
  ).join('\n');
  return `Eres un experto en gastronomia ecuatoriana. Te dare EXACTAMENTE 24 recetas tradicionales con su nombre ya definido, una por cada provincia de Ecuador.

Para CADA receta, devuelve SOLO un objeto JSON con esta estructura exacta:
{
  "nombre": "El nombre exacto de la receta (USA EL QUE TE DOY, NO LO CAMBIES)",
  "ingredientes": "Lista de ingredientes separados por saltos de linea",
  "instrucciones": "Instrucciones de preparacion paso a paso separadas por saltos de linea",
  "descripcion": "Una breve descripcion de 1-2 oraciones",
  "tiempo_minutos": (numero de minutos),
  "porciones": (numero de porciones),
  "calorias": (numero aproximado de calorias por porcion),
  "como_servir": "Sugerencia de como servir"
}

Reglas IMPORTANTES:
- NO cambies el nombre de la receta -- usa el nombre exacto que te proporciono.
- Los ingredientes deben ser reales y ecuatorianos.
- Las instrucciones deben ser completas y en espanol.
- Cada objeto debe incluir el nombre exacto.

Provincias y sus recetas (DEBES GENERARLAS EN ESTE ORDEN EXACTO):
${provinciasList}

Devuelve SOLO un array JSON valido con exactamente 24 objetos, sin texto adicional, sin markdown, sin explicaciones.`;
}

async function callGroq(prompt) {
  console.log('Enviando prompt a Groq AI (Llama 3.3 70B)...');
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

const CREATED_BY = '27b3cef9-b90a-4c7f-bfab-b2a055cb2de8';

async function insertRecipe(recipe) {
  const body = {
    created_by: CREATED_BY,
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
  console.log('Generando 24 recetas con Groq AI...\n');

  let recetas;
  try {
    const prompt = buildPrompt();
    recetas = await callGroq(prompt);
    console.log(`Recibidas ${recetas.length} recetas de Groq\n`);

    if (!Array.isArray(recetas) || recetas.length !== 24) {
      throw new Error(`Se esperaban 24 recetas, se recibieron ${Array.isArray(recetas) ? recetas.length : 'no-array'}`);
    }
  } catch (err) {
    console.error('Error generando:', err.message);
    process.exit(1);
  }

  let inserted = 0;
  let errors = 0;

  for (let i = 0; i < recetas.length; i++) {
    const r = recetas[i];
    const prov = PROVINCIAS[i];

    try {
      r.nombre = prov.receta;
      r.provincia_id = prov.id;
      r.region_id = prov.region_id;

      const id = await insertRecipe(r);
      console.log(`  [${i + 1}/24] ${r.nombre.padEnd(45)} ${prov.nombre.padEnd(30)} ID: ${id}`);
      inserted++;
    } catch (err) {
      console.error(`  [${i + 1}/24] ${prov.receta.padEnd(45)} ${prov.nombre.padEnd(30)} ${err.message}`);
      errors++;
    }
  }

  console.log(`\nResultado final: ${inserted} insertadas, ${errors} errores`);
}

main();
