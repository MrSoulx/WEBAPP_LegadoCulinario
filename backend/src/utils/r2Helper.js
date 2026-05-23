const { S3Client, PutObjectCommand, DeleteObjectCommand, ListObjectsV2Command } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const fs = require('fs');

const R2_ENDPOINT = process.env.R2_ENDPOINT;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const R2_BUCKET = process.env.R2_BUCKET;
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL;

const s3Client = new S3Client({
  region: 'auto',
  endpoint: R2_ENDPOINT,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
});

function getKey(folder, filename) {
  const timestamp = Date.now();
  const safe = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
  return `${folder}/${timestamp}-${safe}`;
}

async function uploadToR2(filePath, folder = 'recetas') {
  try {
    const fileBuffer = fs.readFileSync(filePath);
    const filename = filePath.split('/').pop() || 'file';
    const key = getKey(folder, filename);
    const ext = filename.split('.').pop()?.toLowerCase() || 'jpg';
    const mimeMap = {
      jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', gif: 'image/gif',
      webp: 'image/webp', mp4: 'video/mp4', webm: 'video/webm', mov: 'video/quicktime',
      ogg: 'video/ogg',
    };
    const contentType = mimeMap[ext] || 'application/octet-stream';

    await s3Client.send(new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: key,
      Body: fileBuffer,
      ContentType: contentType,
    }));

    const url = `${R2_PUBLIC_URL}/${key}`;
    console.log(`✅ Subido a R2: ${url}`);
    fs.unlink(filePath, () => {});

    return { url, key };
  } catch (error) {
    console.error('❌ Error en uploadToR2:', error.message);
    fs.unlink(filePath, () => {});
    throw error;
  }
}

async function deleteFromR2(key) {
  try {
    if (!key) return false;
    await s3Client.send(new DeleteObjectCommand({
      Bucket: R2_BUCKET,
      Key: key,
    }));
    console.log(`🗑️ Eliminado de R2: ${key}`);
    return true;
  } catch (error) {
    console.error('Error eliminando de R2:', error.message);
    return false;
  }
}

async function uploadMultipleToR2(filePaths, folder = 'recetas') {
  const promises = filePaths.map(fp => uploadToR2(fp, folder));
  return Promise.all(promises);
}

async function deleteMultipleFromR2(keys) {
  const promises = keys.filter(Boolean).map(k => deleteFromR2(k));
  await Promise.all(promises);
  return true;
}

async function generatePresignedUrl(filename, contentType, folder = 'recetas') {
  const key = getKey(folder, filename);

  const command = new PutObjectCommand({
    Bucket: R2_BUCKET,
    Key: key,
    ContentType: contentType,
  });

  const presignedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });

  return {
    presignedUrl,
    publicUrl: `${R2_PUBLIC_URL}/${key}`,
    key,
  };
}

module.exports = {
  uploadToR2,
  deleteFromR2,
  uploadMultipleToR2,
  deleteMultipleFromR2,
  generatePresignedUrl,
};
