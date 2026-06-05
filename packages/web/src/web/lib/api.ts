import { hc } from "hono/client";
import type { AppType } from "../../api";
import { getToken } from "./auth";

const API_BASE = import.meta.env.VITE_API_URL ?? "/";

const client = hc<AppType>(API_BASE, {
  headers: () => {
    const token = getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  },
});

export const api = client.api;
