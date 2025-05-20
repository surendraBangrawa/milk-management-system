import "dotenv/config";
import { ExpoConfig } from "expo/config";

const APP_ENV = process.env.APP_ENV || "dev";

require("dotenv").config({
  path: `.env.${APP_ENV}`,
});

export default ({ config }: { config: ExpoConfig }): ExpoConfig => {
  const originalConfig = config;

  return {
    ...originalConfig,

    name: APP_ENV === "dev" ? "DigiDairy Dev" : "DigiDairy",
    extra: {
      ...originalConfig.extra,
      eas: {
        projectId: "ae84bce9-8bf9-4114-be17-a42d0137a42e",
      },
      APP_ENV: APP_ENV,
      API_BASE_URL: process.env.API_BASE_URL,
    },

    slug: originalConfig.slug || "frontend",
    version: originalConfig.version || "1.0.0",
    orientation: originalConfig.orientation || "portrait",
    icon: originalConfig.icon || "./assets/images/icon.png",
    scheme: originalConfig.scheme || "myapp",
    userInterfaceStyle: originalConfig.userInterfaceStyle || "automatic",

    ios: {
      ...originalConfig.ios,
      supportsTablet: originalConfig.ios?.supportsTablet || true,
    },
    android: {
      ...originalConfig.android,
      adaptiveIcon: {
        foregroundImage:
          originalConfig.android?.adaptiveIcon?.foregroundImage ||
          "./assets/images/adaptive-icon.png",
        backgroundColor:
          originalConfig.android?.adaptiveIcon?.backgroundColor || "#ffffff",
      },
    },
    web: {
      ...originalConfig.web,
      bundler: originalConfig.web?.bundler || "metro",
      output: originalConfig.web?.output || "static",
      favicon: originalConfig.web?.favicon || "./assets/images/favicon.png",
    },
    plugins: originalConfig.plugins || [
      "expo-router",
      [
        "expo-splash-screen",
        {
          image: "./assets/images/splash-icon.png",
          imageWidth: 200,
          resizeMode: "contain",
          backgroundColor: "#ffffff",
        },
      ],
      "expo-secure-store",
    ],
    experiments: {
      ...originalConfig.experiments,
      typedRoutes: originalConfig.experiments?.typedRoutes || true,
    },
    newArchEnabled: true,
  };
};
