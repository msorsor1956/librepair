const API = import.meta.env.VITE_API_URL ?? "https://librepair-backend.onrender.com";

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

  // Capture token from response header (better-auth bearer)
  const newToken = res.headers.get("set-auth-token");
  if (newToken) setToken(newToken);

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
