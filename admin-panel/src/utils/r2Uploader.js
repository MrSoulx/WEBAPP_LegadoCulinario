/**
 * Sube archivos a R2 a través del backend (vía multer + S3 SDK)
 * Esto evita problemas de CORS con subidas directas del navegador a R2
 */

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
