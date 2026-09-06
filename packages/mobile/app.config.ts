import baseConfig from "./app.json";

export default {
  ...baseConfig.expo,
  android: {
    ...baseConfig.expo.android,
    ...(process.env.GOOGLE_SERVICES_JSON ? { googleServicesFile: process.env.GOOGLE_SERVICES_JSON } : {}),
  },
  ios: {
    ...baseConfig.expo.ios,
    ...(process.env.GOOGLE_SERVICE_INFO_PLIST ? { googleServicesFile: process.env.GOOGLE_SERVICE_INFO_PLIST } : {}),
  },
  extra: {
    ...baseConfig.expo.extra,
    apiUrl: process.env.EXPO_PUBLIC_API_URL ?? baseConfig.expo.extra.apiUrl,
    firebaseWebClientId: process.env.EXPO_PUBLIC_FIREBASE_WEB_CLIENT_ID,
  },
  plugins: ["expo-router", "expo-secure-store", "@react-native-firebase/app", "@react-native-firebase/auth"],
};
