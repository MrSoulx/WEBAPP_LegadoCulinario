const express = require('express');
const router = express.Router();
// Usamos fetch nativo para evitar problemas de versión con la librería
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

console.log('🤖 IA Activa: Modo Groq Ultra Rápido (Llama 3.3 70B)');

router.get('/test', (req, res) => {
  console.log('✅ Test route hit!');
  res.json({ message: 'AI routes working!' });
});

router.post('/substitutes', async (req, res) => {
  const { ingredients, country } = req.body;

  // Validar que ingredients sea un array
  if (!ingredients || !Array.isArray(ingredients) || ingredients.length === 0) {
    return res.status(400).json({ 
      error: 'Se requiere un array de ingredientes',
      substitutes: [] 
    });
  }

  // MODO GROQ (Llama 3.3 70B - Ultra Rápido)
  try {
      const apiKey = process.env.GROQ_API_KEY;
      
      if (!apiKey || apiKey === 'pon_tu_key_aqui') {
        console.warn('⚠️ GROQ_API_KEY no configurada. Usando modo mock/fallback.');
        return res.status(503).json({ error: 'Configuración de IA incompleta (Falta API Key)' });
      }

      console.log(`🚀 Consultando Groq AI (Llama 3.3) para ${country}...`);
      
      const prompt = `
        Eres un chef experto en gastronomía ecuatoriana e internacional.
        Tienes una lista de ingredientes originales de una receta ecuatoriana.
        Tu tarea es identificar cuáles de estos ingredientes son difíciles de conseguir o no existen en ${country}.
        
        Lista de ingredientes: ${ingredients.join(', ')}.
        
        Instrucciones:
        1. Analiza CADA ingrediente de la lista.
        2. Si un ingrediente es común y fácil de encontrar en ${country} (ej. arroz, sal, agua, huevos, cebolla), IGNÓRALO.
        3. Si un ingrediente es específico de Ecuador o difícil de hallar en ${country} (ej. achiote, panela, chifles, queso manaba), sugiere el MEJOR sustituto local disponible en ${country}.
        4. Responde ÚNICAMENTE con una lista en el formato exacto: "Ingrediente Original -> Sustituto".
        5. Si todos los ingredientes son fáciles de conseguir en ${country}, responde solo con la palabra "Ninguno".
        
        Ejemplo de formato:
        Achiote -> Pimentón dulce o Cúrcuma
        Queso Manaba -> Queso Feta suave
      `;

      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [
            { role: "system", content: "Eres un asistente culinario preciso y directo." },
            { role: "user", content: prompt }
          ],
          temperature: 0.3, // Bajo para ser más determinista y preciso
          max_tokens: 500
        })
      });

      if (!response.ok) {
          const errorData = await response.text();
          throw new Error(`Groq API Error: ${response.status} - ${errorData}`);
      }

      const data = await response.json();
      const text = data.choices[0]?.message?.content || "";
      
      console.log('⚡ Respuesta Groq:', text);
      
      if (text.trim().toLowerCase().includes('ninguno') && text.length < 20) {
           console.log('✅ Groq: No se necesitan sustitutos.');
           return res.json({ substitutes: [] });
      }

      // Procesar respuesta
      const aiSubstitutes = text.split('\n')
          .filter(line => line.includes('->'))
          .map(line => line.trim().replace(/^[-*•]\s*/, '')) // Limpiar viñetas si las hay
          .filter(line => line.length > 0);

      console.log('✅ Sustitutos procesados:', aiSubstitutes);
      return res.json({ substitutes: aiSubstitutes });

  } catch (e) {
      console.error(`❌ Error en Groq AI:`, e.message);
      res.status(503).json({ error: 'Error procesando la solicitud de IA', details: e.message });
  }
});

router.post('/translate', async (req, res) => {
  const { text, target_language } = req.body;

  if (!text || !target_language) {
    return res.status(400).json({ error: 'Se requieren text y target_language' });
  }

  try {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey || apiKey === 'pon_tu_key_aqui') {
      return res.status(503).json({ error: 'Configuración de IA incompleta' });
    }

    const prompt = `
      Traduce el siguiente texto de una receta de cocina al ${target_language}.
      Preserva el formato original (saltos de línea, números, símbolos).
      No agregues explicaciones ni texto adicional. Solo la traducción.

      Texto:
      ${text}
    `;

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: "Eres un traductor culinario preciso. Traduce solo el texto proporcionado." },
          { role: "user", content: prompt }
        ],
        temperature: 0.1,
        max_tokens: 2000
      })
    });

    if (!response.ok) throw new Error(`Groq API Error: ${response.status}`);

    const data = await response.json();
    const translated = data.choices[0]?.message?.content?.trim();

    res.json({ translated_text: translated });
  } catch (e) {
    console.error('❌ Error en traducción:', e.message);
    res.status(503).json({ error: 'Error traduciendo' });
  }
});

router.post('/calories', async (req, res) => {
  const { name, ingredients } = req.body;

  if (!ingredients) {
    return res.status(400).json({ error: 'Se requieren los ingredientes' });
  }

  try {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey || apiKey === 'pon_tu_key_aqui') {
      return res.status(503).json({ error: 'Configuración de IA incompleta' });
    }

    const prompt = `
      Eres un nutricionista especializado en gastronomía latinoamericana.
      Calcula las calorías aproximadas por porción para esta receta ecuatoriana.

      Nombre: "${name || 'Receta sin nombre'}"
      Ingredientes: "${ingredients}"

      Responde SOLO con un número entero (las calorías estimadas por porción).
      Nada más, ninguna explicación, solo el número.
    `;

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: "Eres un nutricionista preciso. Responde solo con números." },
          { role: "user", content: prompt }
        ],
        temperature: 0.1,
        max_tokens: 10
      })
    });

    if (!response.ok) throw new Error(`Groq API Error: ${response.status}`);

    const data = await response.json();
    const text = data.choices[0]?.message?.content?.trim();
    const calories = parseInt(text, 10);

    if (isNaN(calories) || calories < 0 || calories > 5000) {
      return res.json({ calorias: null, error: 'No se pudo calcular' });
    }

    res.json({ calorias: calories });
  } catch (e) {
    console.error('❌ Error calculando calorías:', e.message);
    res.status(503).json({ error: 'Error calculando calorías' });
  }
});

module.exports = router;
