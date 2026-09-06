import {
  GoogleAuthProvider,
  onIdTokenChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
} from "firebase/auth";
import { api, setToken } from "./api";
import { firebaseAuth } from "./firebase";

onIdTokenChanged(firebaseAuth, async (user) => setToken(user ? await user.getIdToken() : null));

async function requireAdminSession() {
  const result = await api.get("/auth/status");
  if (result.user?.role !== "admin") {
    await firebaseSignOut(firebaseAuth);
    setToken(null);
    throw new Error("This account is not authorized for the admin application.");
  }
  return result;
}

export async function signIn(email: string, password: string) {
  const credential = await signInWithEmailAndPassword(firebaseAuth, email, password);
  setToken(await credential.user.getIdToken());
  return requireAdminSession();
}

export async function signInWithGoogle() {
  const credential = await signInWithPopup(firebaseAuth, new GoogleAuthProvider());
  setToken(await credential.user.getIdToken());
  return requireAdminSession();
}

export async function signOut() {
  await firebaseSignOut(firebaseAuth);
  setToken(null);
  localStorage.removeItem("admin_session");
}

export async function getSession() {
  await firebaseAuth.authStateReady();
  const currentUser = firebaseAuth.currentUser;
  if (!currentUser) return null;
  setToken(await currentUser.getIdToken());
  return requireAdminSession();
}
