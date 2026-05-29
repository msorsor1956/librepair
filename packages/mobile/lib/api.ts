import { hc } from "hono/client";
import Constants from "expo-constants";
import type { AppType } from "@template/web";
import { getToken } from "./auth";

const baseUrl =
  Constants.expoConfig?.extra?.apiUrl ??
  process.env.EXPO_PUBLIC_API_URL ??
  "http://localhost:4200/";

const client = hc<AppType>(baseUrl, {
  headers: (): Record<string, string> => {
    const token = getToken();
    if (token) return { Authorization: `Bearer ${token}` };
    return {};
  },
});

export const api = client.api;
