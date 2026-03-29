const sharp = require('sharp');
const { saveImage } = require('./shopContentService');

/**
 * Generate a lossless PNG buffer from a pixel array.
 * @param {Array} pixels - Flat array of hex color strings (null = transparent), length = width * height
 * @param {Number} width - Grid width
 * @param {Number} height - Grid height
 * @returns {Buffer} PNG buffer
 */
async function generatePNG(pixels, width, height) {
  const buffer = Buffer.alloc(width * height * 4);

  for (let i = 0; i < width * height; i++) {
    const offset = i * 4;
    const color = pixels[i];

    if (color) {
      const hex = color.replace('#', '');
      buffer[offset] = parseInt(hex.slice(0, 2), 16);     // R
      buffer[offset + 1] = parseInt(hex.slice(2, 4), 16); // G
      buffer[offset + 2] = parseInt(hex.slice(4, 6), 16); // B
      buffer[offset + 3] = 255;                            // A (opaque)
    } else {
      // Transparent pixel (RGBA = 0,0,0,0)
      buffer[offset] = 0;
      buffer[offset + 1] = 0;
      buffer[offset + 2] = 0;
      buffer[offset + 3] = 0;
    }
  }

  return sharp(buffer, {
    raw: { width, height, channels: 4 }
  })
    .png({ compressionLevel: 9 })
    .toBuffer();
}

/**
 * Generate a PNG from pixel data and save to GCS.
 * Returns the proxy URL for the saved image.
 * @param {Array} pixels - Flat pixel array
 * @param {Number} width - Grid width
 * @param {Number} height - Grid height
 * @param {String} userId - Account ID for filename
 * @returns {String} URL path like /api/bazaar-content/bazaar_xxx.png
 */
async function savePixelArtPNG(pixels, width, height, userId) {
  const pngBuffer = await generatePNG(pixels, width, height);
  const base64 = `data:image/png;base64,${pngBuffer.toString('base64')}`;
  return saveImage(base64, userId);
}

module.exports = { generatePNG, savePixelArtPNG };
