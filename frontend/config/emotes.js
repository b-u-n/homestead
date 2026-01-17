// Emote configuration
// Maps emote values to display settings

const heartImage = require('../assets/images/heart.png');
const happyMoetImage = require('../assets/images/happy-moet.png');
const blankMoetImage = require('../assets/images/blank-moet.png');
const fireMoetImage = require('../assets/images/fier-moet.png');

// Standard emote list
export const EMOTES = [
  '😊', '😂', '😍', '😐',
  '🤔', '😢', '😠', '🎉',
  '👍', '👋', '❤️', '🔥'
];

// Emotes that should render as images instead of text
// Maps the emote value to image config
export const EMOTE_IMAGES = {
  '❤️': {
    image: heartImage,
    // Size multiplier relative to font size
    sizeMultiplier: 1.32,
    // CSS filter for canvas rendering (30% more red-pink, cottagecore bright)
    filter: 'brightness(1.12) saturate(1.3) hue-rotate(-5deg)',
  },
  '😊': {
    image: happyMoetImage,
    sizeMultiplier: 1.8,
  },
  '😐': {
    image: blankMoetImage,
    sizeMultiplier: 1.5,
  },
  '🔥': {
    image: fireMoetImage,
    sizeMultiplier: 1.44,
  }
};

// Preloaded image cache for canvas rendering
export const emoteImageCache = {};

// Initialize image cache for web
if (typeof window !== 'undefined') {
  Object.entries(EMOTE_IMAGES).forEach(([emote, config]) => {
    const img = new Image();
    const src = typeof config.image === 'string'
      ? config.image
      : config.image.default || config.image.uri || config.image;
    img.src = src;
    emoteImageCache[emote] = img;
  });
}

/**
 * Check if an emote should be rendered as an image
 */
export const isImageEmote = (emote) => {
  return emote in EMOTE_IMAGES;
};

/**
 * Get the cached image for an emote (for canvas rendering)
 */
export const getEmoteImage = (emote) => {
  return emoteImageCache[emote] || null;
};

/**
 * Draw an emote on a canvas context
 * Handles both text emotes and image emotes
 *
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {string} emote - The emote to draw
 * @param {number} x - X position (center)
 * @param {number} y - Y position (center)
 * @param {number} fontSize - Font size for text emotes (image size derived from this)
 */
export const drawEmote = (ctx, emote, x, y, fontSize) => {
  const img = getEmoteImage(emote);
  const config = EMOTE_IMAGES[emote];

  // Capture current globalAlpha before save (for fade animations)
  const currentAlpha = ctx.globalAlpha;

  if (img && img.complete && config) {
    // Draw as image with optional filter
    const size = fontSize * config.sizeMultiplier;
    ctx.save();
    // Restore the alpha that was set before this call
    ctx.globalAlpha = currentAlpha;
    if (config.filter) {
      ctx.filter = config.filter;
    }
    ctx.drawImage(img, x - size / 2, y - size / 2, size, size);
    ctx.restore();
  } else {
    // Draw as text - no save/restore needed, just draw
    ctx.font = `${fontSize}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#000';
    ctx.fillText(emote, x, y);
  }
};

/**
 * Measure an emote's display width
 *
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {string} emote - The emote to measure
 * @param {number} fontSize - Font size
 * @returns {number} Width of the emote
 */
export const measureEmote = (ctx, emote, fontSize) => {
  const config = EMOTE_IMAGES[emote];

  if (config) {
    // Image emote - return image size
    return fontSize * config.sizeMultiplier;
  } else {
    // Text emote - measure text
    ctx.font = `${fontSize}px Arial`;
    return ctx.measureText(emote).width;
  }
};

export default EMOTES;
