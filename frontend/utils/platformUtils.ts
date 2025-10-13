import { Platform } from "react-native";

/**
 * Get platform-specific shadow styles
 * @param shadowColor - Color of the shadow
 * @param elevation - Android elevation (default: 2)
 * @param shadowOpacity - iOS shadow opacity (default: 0.1)
 * @param shadowRadius - iOS shadow radius (default: 3)
 * @param shadowOffset - iOS shadow offset (default: { width: 0, height: 1 })
 */
export const getShadowStyle = (
  shadowColor: string = "#000",
  elevation: number = 2,
  shadowOpacity: number = 0.1,
  shadowRadius: number = 3,
  shadowOffset: { width: number; height: number } = { width: 0, height: 1 }
) => {
  if (Platform.OS === "ios") {
    return {
      shadowColor,
      shadowOffset,
      shadowOpacity,
      shadowRadius,
    };
  } else {
    return {
      elevation,
    };
  }
};

/**
 * Get platform-specific keyboard offset
 * @param baseOffset - Base offset value
 * @returns Platform-specific offset
 */
export const getKeyboardOffset = (baseOffset: number = 0): number => {
  return Platform.OS === "ios" ? baseOffset : baseOffset + 20;
};

/**
 * Get platform-specific button style
 * @param baseStyle - Base button style
 * @returns Platform-specific button style
 */
export const getButtonStyle = (baseStyle: any) => {
  if (Platform.OS === "ios") {
    return {
      ...baseStyle,
      ...getShadowStyle("#000", 0, 0.15, 4, { width: 0, height: 2 }),
    };
  } else {
    return {
      ...baseStyle,
      ...getShadowStyle("#000", 4),
    };
  }
};

/**
 * Get platform-specific border radius
 * @param baseRadius - Base border radius
 * @returns Platform-specific border radius
 */
export const getBorderRadius = (baseRadius: number): number => {
  return Platform.OS === "ios" ? baseRadius : baseRadius;
};

/**
 * Get platform-specific input style
 * @param baseStyle - Base input style
 * @returns Platform-specific input style
 */
export const getInputStyle = (baseStyle: any) => {
  if (Platform.OS === "ios") {
    return {
      ...baseStyle,
      ...getShadowStyle("#000", 0, 0.1, 3, { width: 0, height: 1 }),
    };
  } else {
    return {
      ...baseStyle,
      ...getShadowStyle("#000", 3),
    };
  }
};
