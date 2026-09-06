import { hc } from "hono/client";
import type { AppType } from "../../api";
import { getToken } from "./auth";

export const API_BASE = (import.meta.env.VITE_API_URL ?? "").replace(/\/$/, "");

// Hono RPC client — used by dashboard/vehicles/appointments etc.
const client = hc<AppType>(API_BASE || "/", {
  headers: () => {
    const token = getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  },
});

export const api = client.api;

// Generic fetch helper — points all /api/* calls to Render in production
export function apiFetch(path: string, init?: RequestInit): Promise<Response> {
  const url = path.startsWith("http") ? path : `${API_BASE}${path}`;
  const headers = new Headers(init?.headers);
  const token = getToken();
  if (token && !headers.has("Authorization")) headers.set("Authorization", `Bearer ${token}`);
  return fetch(url, {
    ...init,
    headers,
    credentials: "include",
  });
}
