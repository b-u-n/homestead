import { makeAutoObservable } from 'mobx';

// Baseline dimensions (1080p)
const BASELINE_WIDTH = 1920;
const BASELINE_HEIGHT = 1080;

class UXStore {
  // Screen dimensions
  screenWidth = BASELINE_WIDTH;
  screenHeight = BASELINE_HEIGHT;

  // Whether device is in portrait mode (needs rotation)
  isPortrait = false;

  // Whether device is considered mobile
  isMobile = false;

  // Render scale relative to 1080p baseline
  renderScale = 1;

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

    // Calculate scale based on 1080p baseline (uniform scale to maintain aspect ratio)
    const scaleX = effectiveWidth / BASELINE_WIDTH;
    const scaleY = effectiveHeight / BASELINE_HEIGHT;
    this.renderScale = Math.min(scaleX, scaleY);

    // Scale canvas dimensions uniformly to maintain 16:9 aspect ratio
    this.screenWidth = BASELINE_WIDTH * this.renderScale;
    this.screenHeight = BASELINE_HEIGHT * this.renderScale;

    // Mobile if smaller dimension < 768
    this.isMobile = Math.min(width, height) < 768;
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
