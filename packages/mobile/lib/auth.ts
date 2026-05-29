import { createAuthClient } from "better-auth/client";
import Constants from "expo-constants";
import * as SecureStore from "expo-secure-store";

export const TOKEN_KEY = "librepair_bearer_token";

export const baseURL =
  Constants.expoConfig?.extra?.apiUrl ??
  process.env.EXPO_PUBLIC_API_URL ??
  "http://localhost:4200";

export function getToken(): string {
  try {
    return SecureStore.getItem(TOKEN_KEY) ?? "";
  } catch {
    return "";
  }
}

export async function getTokenAsync(): Promise<string> {
  try {
    return (await SecureStore.getItemAsync(TOKEN_KEY)) ?? "";
  } catch {
    return "";
  }
}

export async function setToken(token: string) {
  try {
    await SecureStore.setItemAsync(TOKEN_KEY, token);
  } catch {}
}

export async function clearToken() {
  try {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
  } catch {}
}

export const authClient = createAuthClient({
  baseURL: baseURL,
  basePath: "/api/auth",
  fetchOptions: {
    auth: {
      type: "Bearer",
      token: () => getToken(),
    },
  },
});

export function captureToken(response: Response) {
  const token = response.headers.get("set-auth-token");
  if (token) setToken(token);
}
