import { API_BASE_URL } from './apiClient';

const translationCache = new Map();

function cacheKey(text, lang) {
  let hash = 0;
  const str = text.slice(0, 100) + '|' + lang;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return hash + '|' + lang;
}

export async function translateRecipe(recipe, targetLang) {
  if (targetLang === 'es') return recipe;

  const fieldsToTranslate = ['name', 'ingredientes', 'instrucciones', 'description', 'como_servir'];
  const result = { ...recipe };

  for (const field of fieldsToTranslate) {
    const original = recipe[field] || recipe[field === 'name' ? 'name' : field];
    if (!original) continue;

    const key = cacheKey(original, targetLang);
    if (translationCache.has(key)) {
      result[field] = translationCache.get(key);
      continue;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/ai/translate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: original,
          target_language: targetLang === 'en' ? 'inglés' : targetLang,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const translated = data.translated_text;
        translationCache.set(key, translated);
        result[field] = translated;
      }
    } catch (err) {
      console.error(`Error translating ${field}:`, err);
    }
  }

  return result;
}
