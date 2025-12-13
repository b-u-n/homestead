import { makeAutoObservable } from 'mobx';

// Baseline dimensions (1080p)
const BASELINE_WIDTH = 1920;
const BASELINE_HEIGHT = 1080;

class UXStore {
  // Screen dimensions (scaled canvas size)
  screenWidth = BASELINE_WIDTH;
  screenHeight = BASELINE_HEIGHT;

  // Full screen dimensions after rotation (before aspect ratio scaling)
  fullWidth = BASELINE_WIDTH;
  fullHeight = BASELINE_HEIGHT;

  // Whether device is in portrait mode (needs rotation)
  isPortrait = false;

  // Whether device is considered mobile
  isMobile = false;

  // Render scale relative to 1080p baseline
  renderScale = 1;

  // Letterbox dimensions (unused space due to aspect ratio)
  letterboxWidth = 0;
  letterboxHeight = 0;

  constructor() {
    makeAutoObservable(this);
  }

  // Update dimensions and calculate derived values
  updateDimensions(width, height) {
    // Only enable portrait rotation on mobile browsers (check user agent)
    const isMobileBrowser = typeof navigator !== 'undefined' && /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const portrait = height > width && isMobileBrowser;
    this.isPortrait = portrait;

    // Effective dimensions after rotation
    const effectiveWidth = portrait ? height : width;
    const effectiveHeight = portrait ? width : height;

    // Store full screen dimensions
    this.fullWidth = effectiveWidth;
    this.fullHeight = effectiveHeight;

    // Mobile if smaller dimension < 768
    this.isMobile = Math.min(width, height) < 768;

    // Calculate scale based on 1080p baseline
    const scaleX = effectiveWidth / BASELINE_WIDTH;
    const scaleY = effectiveHeight / BASELINE_HEIGHT;

    if (portrait) {
      // Mobile portrait: maintain aspect ratio (uniform scale) to allow for side panel
      this.renderScale = Math.min(scaleX, scaleY);
      this.screenWidth = BASELINE_WIDTH * this.renderScale;
      this.screenHeight = BASELINE_HEIGHT * this.renderScale;
      this.letterboxWidth = effectiveWidth - this.screenWidth;
      this.letterboxHeight = effectiveHeight - this.screenHeight;
    } else {
      // Desktop/landscape: fill the full window (no letterboxing)
      this.renderScale = Math.min(scaleX, scaleY); // Still track for UI scaling purposes
      this.screenWidth = effectiveWidth;
      this.screenHeight = effectiveHeight;
      this.letterboxWidth = 0;
      this.letterboxHeight = 0;
    }
  }

  // Check if we should apply mobile UI scaling (scale < 0.8)
  get shouldScaleUI() {
    return this.renderScale < 0.8;
  }

  // UI scale multiplier for avatars/emotes (50% larger on mobile)
  get avatarSizeMultiplier() {
    return this.shouldScaleUI ? 1.5 : 1;
  }

  // Base avatar size
  get avatarSize() {
    return 64 * this.avatarSizeMultiplier;
  }
}

const uxStore = new UXStore();
export default uxStore;
export { BASELINE_WIDTH, BASELINE_HEIGHT };
