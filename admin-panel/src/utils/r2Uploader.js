/**
 * Sube archivos a R2 a través del backend (vía multer + S3 SDK)
 * Esto evita problemas de CORS con subidas directas del navegador a R2
 */
import api from '../services/api';

/**
 * Convierte File[] a FormData para enviar al backend
 * @param {File[]} images
 * @param {File|null} video
 * @param {Object} data - resto de campos del formulario
 * @returns {FormData}
 */
export const buildFormData = (data, images = [], video = null) => {
  const formData = new FormData();

  // Campos de texto
  Object.entries(data).forEach(([key, value]) => {
    if (value !== null && value !== undefined) {
      formData.append(key, value);
    }
  });

  // Imágenes
  images.forEach(file => {
    formData.append('imagenes', file);
  });

  // Video
  if (video) {
    formData.append('video', video);
  }

  return formData;
};

/**
 * Sube un archivo directamente a R2 usando presigned URL (evita límite de 4.5MB de Vercel)
 * @param {File} file - Archivo a subir
 * @param {string} folder - Carpeta destino en R2 ('recetas' o 'videos')
 * @returns {Promise<{url: string, key: string}>}
 */
async function uploadFileToR2(file, folder = 'recetas') {
  const response = await api.post('/upload/presign', {
    filename: file.name,
    contentType: file.type,
    folder,
  });

  const { presignedUrl, publicUrl, key } = response.data.data;

  const uploadRes = await fetch(presignedUrl, {
    method: 'PUT',
    body: file,
    headers: { 'Content-Type': file.type },
  });

  if (!uploadRes.ok) {
    throw new Error(`Error subiendo archivo a R2: ${uploadRes.status}`);
  }

  return { url: publicUrl, key };
}

/**
 * Sube un video directamente a R2
 * @param {File} videoFile
 * @returns {Promise<{url: string, key: string}>}
 */
export const uploadVideoDirect = (videoFile) => uploadFileToR2(videoFile, 'videos');

/**
 * Sube múltiples imágenes directamente a R2
 * @param {File[]} imageFiles
 * @returns {Promise<{url: string, key: string}[]>}
 */
export const uploadImagesDirect = async (imageFiles) => {
  const results = [];
  for (const file of imageFiles) {
    const result = await uploadFileToR2(file, 'recetas');
    results.push(result);
  }
  return results;
};
