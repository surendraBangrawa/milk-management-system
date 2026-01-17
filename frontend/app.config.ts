import "dotenv/config";
import { ExpoConfig } from "expo/config";

const APP_ENV = process.env.APP_ENV || "dev";

// Load environment variables based on APP_ENV (for local development)
// During EAS build, environment variables from eas.json are available directly
require("dotenv").config({
  path: `.env.${APP_ENV}`,
});

export default ({ config }: { config: ExpoConfig }): ExpoConfig => {
  const originalConfig = config;

  const basePackageName = "com.yourcompany.digidairy";
  const baseBundleIdentifier = "com.yourcompany.digidairy";

  // Determine the package/bundle identifier based on APP_ENV
  const androidPackage =
    APP_ENV === "dev"
      ? `${basePackageName}.dev` // e.g., com.yourcompany.digidairy.dev
      : basePackageName; // e.g., com.yourcompany.digidairy

  // The iOS bundle identifier logic remains the same.
  const iosBundleIdentifier =
    APP_ENV === "dev"
      ? `${baseBundleIdentifier}.dev` // e.g., com.yourcompany.digidairy.dev
      : baseBundleIdentifier; // e.g., com.yourcompany.digidairy

  // Get API_BASE_URL from environment (EAS build sets this from eas.json)
  // Fallback to process.env.API_BASE_URL for local development
  const API_BASE_URL = process.env.API_BASE_URL || "";

  return {
    ...originalConfig,

    name: APP_ENV === "dev" ? "DigiDairy Dev" : "DigiDairy",
    extra: {
      ...originalConfig.extra,
      eas: {
        projectId: "ae84bce9-8bf9-4114-be17-a42d0137a42e",
      },
      APP_ENV: APP_ENV,
      API_BASE_URL: API_BASE_URL,
    },

    slug: originalConfig.slug || "frontend",
    version: originalConfig.version || "1.0.0",
    orientation: originalConfig.orientation || "portrait",
    icon: originalConfig.icon || "./assets/images/logo.png",
    scheme: originalConfig.scheme || "myapp",
    userInterfaceStyle: originalConfig.userInterfaceStyle || "automatic",

    ios: {
      ...originalConfig.ios,
      supportsTablet: originalConfig.ios?.supportsTablet || true,
      bundleIdentifier: iosBundleIdentifier,
      buildNumber: originalConfig.ios?.buildNumber || "1",
    },
    android: {
      ...originalConfig.android,
      package: androidPackage,
      adaptiveIcon: {
        foregroundImage:
          originalConfig.android?.adaptiveIcon?.foregroundImage ||
          "./assets/images/logo.png",
        backgroundColor:
          originalConfig.android?.adaptiveIcon?.backgroundColor || "#ffffff",
      },
    },
    plugins: originalConfig.plugins || [
      "expo-router",
      [
        "expo-splash-screen",
        {
          image: "./assets/images/logo.png",
          imageWidth: 200,
          resizeMode: "contain",
          backgroundColor: "#ffffff",
        },
      ],
      "expo-secure-store",
      "expo-localization",
      "expo-font",
      [
        "expo-build-properties",
        {
          android: {
            usesCleartextTraffic: true,
          },
        },
      ],
    ],
    experiments: {
      ...originalConfig.experiments,
      typedRoutes: originalConfig.experiments?.typedRoutes || true,
    },
    newArchEnabled: true,
  };
};
