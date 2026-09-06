import { useEffect, useState } from "react";
import auth from "@react-native-firebase/auth";
import { GoogleSignin } from "@react-native-google-signin/google-signin";
import Constants from "expo-constants";
import * as SecureStore from "expo-secure-store";

export const TOKEN_KEY = "librepair_firebase_id_token";

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

export type MobileSession = { user: { id: string; name: string; email: string; role: string; approvalStatus: "pending" | "approved" | "rejected"; approvalNotes?: string | null; createdAt?: string | number | Date | null }; session: { uid: string } };
let session: MobileSession | null = null;
let pending = true;
const listeners = new Set<() => void>();
const publish = (next: MobileSession | null, loading = false) => { session = next; pending = loading; listeners.forEach((listener) => listener()); };

GoogleSignin.configure({ webClientId: process.env.EXPO_PUBLIC_FIREBASE_WEB_CLIENT_ID });

async function loadSession(forceRefresh = false) {
  const firebaseUser = auth().currentUser;
  if (!firebaseUser) { await clearToken(); publish(null); return null; }
  const token = await firebaseUser.getIdToken(forceRefresh);
  await setToken(token);
  const response = await fetch(`${baseURL.replace(/\/$/, "")}/api/auth/status`, { headers: { Authorization: `Bearer ${token}` } });
  if (!response.ok) throw new Error((await response.json().catch(() => null))?.message ?? "Unable to load account status");
  const data = await response.json() as MobileSession;
  publish(data);
  return data;
}

auth().onIdTokenChanged(() => { void loadSession().catch(() => publish(null)); });

function useSession() {
  const [, redraw] = useState(0);
  useEffect(() => {
    const listener = () => redraw((value) => value + 1);
    listeners.add(listener);
    return () => { listeners.delete(listener); };
  }, []);
  return { data: session, isPending: pending };
}

export async function signInWithGoogle() {
  await GoogleSignin.hasPlayServices();
  const response: any = await GoogleSignin.signIn();
  const idToken = response.data?.idToken ?? response.idToken;
  if (!idToken) throw new Error("Google did not return an ID token");
  const credential = auth.GoogleAuthProvider.credential(idToken);
  await auth().signInWithCredential(credential);
  return loadSession(true);
}

export const authClient = {
  useSession,
  getSession: async () => ({ data: await loadSession(), error: null }),
  signIn: {
    email: async ({ email, password }: { email: string; password: string }, options?: any) => {
      try { const result = await auth().signInWithEmailAndPassword(email, password); await setToken(await result.user.getIdToken()); options?.onResponse?.({ response: new Response() }); return { data: await loadSession(true), error: null }; }
      catch (error: any) { return { data: null, error: { message: error.message } }; }
    },
  },
  signUp: {
    email: async ({ name, email, password }: { name: string; email: string; password: string }, options?: any) => {
      try { const result = await auth().createUserWithEmailAndPassword(email, password); await result.user.updateProfile({ displayName: name }); await setToken(await result.user.getIdToken(true)); options?.onResponse?.({ response: new Response() }); return { data: await loadSession(true), error: null }; }
      catch (error: any) { return { data: null, error: { message: error.message } }; }
    },
  },
  signOut: async () => { await auth().signOut(); await clearToken(); publish(null); },
  updateUser: async ({ name }: { name: string }) => { if (!auth().currentUser) throw new Error("Not signed in"); await auth().currentUser!.updateProfile({ displayName: name }); return loadSession(true); },
  forgetPassword: ({ email }: { email: string; redirectTo?: string }) => auth().sendPasswordResetEmail(email),
};

export function captureToken(response: Response) {
  void response;
}
