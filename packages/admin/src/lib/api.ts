const API = import.meta.env.VITE_API_URL ?? "https://librepair-backend-production.up.railway.app";

let _token: string | null = localStorage.getItem("admin_token");

export function getToken() { return _token; }
export function setToken(t: string | null) {
  _token = t;
  if (t) localStorage.setItem("admin_token", t);
  else localStorage.removeItem("admin_token");
}

async function request(method: string, path: string, body?: unknown) {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (_token) headers["Authorization"] = `Bearer ${_token}`;

  const res = await fetch(`${API}/api${path}`, {
    method,
    headers,
    credentials: "include",
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: `HTTP ${res.status}` }));
    throw new Error(err.message ?? `HTTP ${res.status}`);
  }
  return res.json();
}

export const api = {
  get: (path: string) => request("GET", path),
  post: (path: string, body: unknown) => request("POST", path, body),
  patch: (path: string, body: unknown) => request("PATCH", path, body),
  put: (path: string, body: unknown) => request("PUT", path, body),
  delete: (path: string) => request("DELETE", path),
};

/** Raw fetch wrapper that forwards the admin auth token. Accepts absolute URLs. */
export async function apiFetch(url: string, init: RequestInit = {}): Promise<any> {
  const headers: Record<string, string> = { ...(init.headers as Record<string, string> ?? {}) };
  if (_token && !headers["Authorization"]) headers["Authorization"] = `Bearer ${_token}`;
  const res = await fetch(url, { ...init, headers, credentials: "include" });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: `HTTP ${res.status}` }));
    throw new Error(err.message ?? `HTTP ${res.status}`);
  }
  // Return empty object for 204 No Content
  if (res.status === 204) return {};
  return res.json();
}
