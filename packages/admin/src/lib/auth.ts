import { api, setToken } from "./api";

export async function signIn(email: string, password: string) {
  const res = await api.post("/auth/sign-in/email", { email, password });
  if (res?.token) setToken(res.token);
  return res;
}

export async function signOut() {
  try { await api.post("/auth/sign-out", {}); } catch {}
  setToken(null);
  localStorage.removeItem("admin_session");
}

export async function getSession() {
  return api.get("/auth/get-session");
}
