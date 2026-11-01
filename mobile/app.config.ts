import type { ExpoConfig } from "expo/config";
import { withAppBuildGradle, type ConfigPlugin } from "expo/config-plugins";
const localTesting = process.env.EXPO_PUBLIC_ALLOW_HTTP === "true";
const withWindowsNativePathSupport: ConfigPlugin = (config) => {
  if (process.platform !== "win32") return config;
  return withAppBuildGradle(config, (modConfig) => {
    const gradle = modConfig.modResults;
    if (gradle.language !== "groovy")
      throw new Error("Expected Expo to generate an Android Groovy build file.");
    if (gradle.contents.includes("CMAKE_OBJECT_PATH_MAX")) return modConfig;

    const marker = "defaultConfig {";
    const markerIndex = gradle.contents.indexOf(marker);
    if (markerIndex < 0)
      throw new Error("Could not locate Android defaultConfig.");

    const insertionIndex = markerIndex + marker.length;
    gradle.contents =
      gradle.contents.slice(0, insertionIndex) +
      `
        externalNativeBuild {
            cmake { arguments "-DCMAKE_OBJECT_PATH_MAX=180" }
        }` +
      gradle.contents.slice(insertionIndex);
    return modConfig;
  });
};
if (
  process.env.EAS_BUILD_PROFILE === "production" &&
  (localTesting || !process.env.EXPO_PUBLIC_API_URL?.startsWith("https://"))
)
  throw new Error(
    "Production requires EXPO_PUBLIC_API_URL=https://... and HTTP testing disabled.",
  );
const config: ExpoConfig = {
  name: "Agri-Solution",
  slug: "agri-solution-mobile",
  version: "1.0.0",
  scheme: "agrisolution",
  orientation: "default",
  userInterfaceStyle: "light",
  icon: "./assets/icon.png",
  ios: {
    bundleIdentifier: "com.agrisolution.portal",
    supportsTablet: true,
    infoPlist: {
      ITSAppUsesNonExemptEncryption: false,
      ...(localTesting
        ? {
            NSAppTransportSecurity: {
              NSAllowsLocalNetworking: true,
              NSAllowsArbitraryLoads: true,
            },
          }
        : {}),
    },
  },
  android: {
    package: "com.agrisolution.portal",
    adaptiveIcon: {
      foregroundImage: "./assets/icon.png",
      backgroundColor: "#ffffff",
    },
    blockedPermissions: [
      "android.permission.SYSTEM_ALERT_WINDOW",
      "android.permission.VIBRATE",
      "android.permission.RECORD_AUDIO",
      "android.permission.READ_EXTERNAL_STORAGE",
      "android.permission.WRITE_EXTERNAL_STORAGE",
      "android.permission.ACCESS_BACKGROUND_LOCATION",
    ],
  },
  plugins: [
    "expo-router",
    "expo-secure-store",
    [
      "expo-splash-screen",
      {
        image: "./assets/icon.png",
        imageWidth: 160,
        backgroundColor: "#eaf3eb",
      },
    ],
    [
      "expo-location",
      {
        locationWhenInUsePermission:
          "Show weather for your current location when you request it.",
      },
    ],
    [
      "expo-build-properties",
      { android: { usesCleartextTraffic: localTesting } },
    ],
  ],
  extra: {
    ...(process.env.EAS_PROJECT_ID
      ? { eas: { projectId: process.env.EAS_PROJECT_ID } }
      : {}),
  },
};
export default withWindowsNativePathSupport(config);
