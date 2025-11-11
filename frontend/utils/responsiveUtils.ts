import { Dimensions, PixelRatio } from "react-native";

// Get screen dimensions
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

// Base dimensions (iPhone 12/13/14 dimensions as reference)
const BASE_WIDTH = 390;
const BASE_HEIGHT = 844;

// Scale factors
const widthScale = SCREEN_WIDTH / BASE_WIDTH;
const heightScale = SCREEN_HEIGHT / BASE_HEIGHT;

// Device size categories
export const isSmallScreen = SCREEN_WIDTH < 375;
export const isMediumScreen = SCREEN_WIDTH >= 375 && SCREEN_WIDTH <= 414;
export const isLargeScreen = SCREEN_WIDTH > 414;

/**
 * Scale width based on screen width
 * @param size - The size to scale
 * @returns Scaled width
 */
export const scaleWidth = (size: number): number => {
  const newSize = size * widthScale;
  return Math.round(PixelRatio.roundToNearestPixel(newSize));
};

/**
 * Scale height based on screen height
 * @param size - The size to scale
 * @returns Scaled height
 */
export const scaleHeight = (size: number): number => {
  const newSize = size * heightScale;
  return Math.round(PixelRatio.roundToNearestPixel(newSize));
};

/**
 * Get responsive font size based on screen width
 * @param size - Base font size
 * @returns Responsive font size
 */
export const getResponsiveFontSize = (size: number): number => {
  const scale = Math.min(widthScale, heightScale);
  const newSize = size * scale;

  // Ensure minimum font size for readability
  const minSize = isSmallScreen ? size * 0.9 : size;
  const maxSize = isLargeScreen ? size * 1.1 : size;

  return Math.max(
    minSize,
    Math.min(maxSize, Math.round(PixelRatio.roundToNearestPixel(newSize)))
  );
};

/**
 * Get responsive padding/margin
 * @param size - Base size
 * @returns Responsive size
 */
export const getResponsiveSize = (size: number): number => {
  if (isSmallScreen) return size * 0.9;
  if (isLargeScreen) return size * 1.1;
  return size;
};

/**
 * Get device-specific dimensions
 */
export const getDeviceDimensions = () => ({
  width: SCREEN_WIDTH,
  height: SCREEN_HEIGHT,
  isSmallScreen,
  isMediumScreen,
  isLargeScreen,
  widthScale,
  heightScale,
});
