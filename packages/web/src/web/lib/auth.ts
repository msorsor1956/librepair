import { useEffect, useState } from "react";
import {
  GoogleAuthProvider,
  confirmPasswordReset,
  createUserWithEmailAndPassword,
  onIdTokenChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
  updateProfile,
} from "firebase/auth";
import { firebaseAuth } from "./firebase";

export const TOKEN_KEY = "firebase_id_token";

export function getToken(): string {
  return localStorage.getItem(TOKEN_KEY) ?? "";
}

const AUTH_BASE = (import.meta.env.VITE_API_URL ?? window.location.origin).replace(/\/$/, "");
type ApplicationUser = { id: string; name: string; email: string; role: string; approvalStatus: "pending" | "approved" | "rejected"; approvalNotes?: string | null; profilePhoto?: string | null };
type SessionData = { user: ApplicationUser; session: { uid: string; issuedAt: number; expiresAt: number }; approvalStatus: ApplicationUser["approvalStatus"] };
type AuthCallbacks = { onSuccess?: (context: any) => void; onError?: (context: any) => void; onResponse?: (context: { response: Response }) => void };

let currentSession: SessionData | null = null;
let sessionPending = true;
const subscribers = new Set<() => void>();
const publish = (session: SessionData | null, pending = false) => {
  currentSession = session;
  sessionPending = pending;
  subscribers.forEach((listener) => listener());
};

async function loadApplicationSession(forceRefresh = false) {
  const user = firebaseAuth.currentUser;
  if (!user) { clearToken(); publish(null); return null; }
  const token = await user.getIdToken(forceRefresh);
  localStorage.setItem(TOKEN_KEY, token);
  const response = await fetch(`${AUTH_BASE}/api/auth/status`, { headers: { Authorization: `Bearer ${token}` } });
  if (!response.ok) throw new Error((await response.json().catch(() => null))?.message ?? "Unable to load account status");
  const data = await response.json() as SessionData;
  publish(data);
  return data;
}

onIdTokenChanged(firebaseAuth, () => { void loadApplicationSession().catch(() => publish(null)); });

function useSession() {
  const [, redraw] = useState(0);
  useEffect(() => {
    const listener = () => redraw((value) => value + 1);
    subscribers.add(listener);
    return () => { subscribers.delete(listener); };
  }, []);
  return { data: currentSession, isPending: sessionPending, error: null };
}

async function finish(result: { user: import("firebase/auth").User }, callbacks?: AuthCallbacks) {
  try {
    const data = await loadApplicationSession(true);
    callbacks?.onSuccess?.({ data });
    return { data, error: null };
  } catch (error: any) {
    const normalized = { message: error.message ?? "Authentication failed" };
    callbacks?.onError?.({ error: normalized });
    return { data: null, error: normalized };
  }
}

export const authClient = {
  useSession,
  getSession: async () => ({ data: await loadApplicationSession(), error: null }),
  signIn: {
    email: async ({ email, password }: { email: string; password: string }, callbacks?: AuthCallbacks) => {
      try { return finish(await signInWithEmailAndPassword(firebaseAuth, email, password), callbacks); }
      catch (error: any) { callbacks?.onError?.({ error: { message: error.message } }); return { data: null, error }; }
    },
    social: async (_input: { provider: string; callbackURL?: string }, callbacks?: AuthCallbacks) => {
      try { return finish(await signInWithPopup(firebaseAuth, new GoogleAuthProvider()), callbacks); }
      catch (error: any) { callbacks?.onError?.({ error: { message: error.message } }); return { data: null, error }; }
    },
  },
  signUp: {
    email: async ({ name, email, password }: { name: string; email: string; password: string }, callbacks?: AuthCallbacks) => {
      try {
        const credential = await createUserWithEmailAndPassword(firebaseAuth, email, password);
        await updateProfile(credential.user, { displayName: name });
        return finish(credential, callbacks);
      } catch (error: any) { callbacks?.onError?.({ error: { message: error.message } }); return { data: null, error }; }
    },
  },
  signOut: () => firebaseSignOut(firebaseAuth),
  updateUser: async ({ name }: { name: string }) => {
    if (!firebaseAuth.currentUser) throw new Error("Not signed in");
    await updateProfile(firebaseAuth.currentUser, { displayName: name });
    return loadApplicationSession(true);
  },
  forgetPassword: ({ email }: { email: string; redirectTo?: string }) => sendPasswordResetEmail(firebaseAuth, email, { url: `${window.location.origin}/sign-in` }),
  resetPassword: ({ newPassword, token }: { newPassword: string; token: string }) => confirmPasswordReset(firebaseAuth, token, newPassword),
};

export function captureToken(ctx: { response: Response }) {
  void ctx;
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}
