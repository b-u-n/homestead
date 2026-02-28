const path = require('path');
const crypto = require('crypto');
const { Storage } = require('@google-cloud/storage');
require('dotenv').config();

const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB

const storage = new Storage({
  keyFilename: path.join(__dirname, '../../config/gcs-credentials.json')
});
const bucket = storage.bucket(process.env.GCS_BUCKET_NAME);

/**
 * Save a base64-encoded image to Google Cloud Storage.
 * Returns the public URL.
 */
async function saveImage(base64Data, userId) {
  const base64Clean = base64Data.replace(/^data:image\/\w+;base64,/, '');
  const buffer = Buffer.from(base64Clean, 'base64');

  if (buffer.length > MAX_IMAGE_SIZE) {
    throw new Error('Image exceeds maximum size of 5MB');
  }

  // Detect extension from data URL or default to png
  let ext = 'png';
  let contentType = 'image/png';
  const match = base64Data.match(/^data:image\/(\w+);base64,/);
  if (match) {
    ext = match[1] === 'jpeg' ? 'jpg' : match[1];
    contentType = `image/${match[1]}`;
  }

  const filename = `bazaar_${userId}_${Date.now()}_${crypto.randomBytes(8).toString('hex')}.${ext}`;
  const file = bucket.file(filename);

  await file.save(buffer, {
    metadata: { contentType }
  });

  return `/api/bazaar-content/${filename}`;
}

/**
 * Save video content (future use).
 */
async function saveVideo(base64Data, userId) {
  const base64Clean = base64Data.replace(/^data:video\/\w+;base64,/, '');
  const buffer = Buffer.from(base64Clean, 'base64');

  const filename = `bazaar_${userId}_${Date.now()}_${crypto.randomBytes(8).toString('hex')}.mp4`;
  const file = bucket.file(filename);

  await file.save(buffer, {
    metadata: { contentType: 'video/mp4' }
  });

  return `/api/bazaar-content/${filename}`;
}

/**
 * Get a readable stream for a file in the bucket.
 */
function getFileStream(filename) {
  return bucket.file(filename);
}

module.exports = { saveImage, saveVideo, getFileStream };
