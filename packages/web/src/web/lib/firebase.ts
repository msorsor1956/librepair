import { initializeApp, getApps } from "firebase/app";
import {
  getAuth,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  type ConfirmationResult,
} from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyCNMz4Gh65dgyoQOFIFz_u0r-b59Hifq_I",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "librepair-77afa.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "librepair-77afa",
  storageBucket: "librepair-77afa.firebasestorage.app",
  messagingSenderId: "86955698956",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:86955698956:web:2211ccf5087b05810c3729",
  measurementId: "G-8T9W7EN38M",
};

// Avoid re-initializing on HMR
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
export const firebaseAuth = getAuth(app);

// Hold a single reCAPTCHA verifier instance
let recaptchaVerifier: RecaptchaVerifier | null = null;

export function getRecaptchaVerifier(buttonId: string): RecaptchaVerifier {
  if (recaptchaVerifier) {
    try { recaptchaVerifier.clear(); } catch {}
    recaptchaVerifier = null;
  }
  recaptchaVerifier = new RecaptchaVerifier(firebaseAuth, buttonId, {
    size: "invisible",
    callback: () => {},
    "expired-callback": () => {
      recaptchaVerifier = null;
    },
  });
  return recaptchaVerifier;
}

export async function sendFirebaseOTP(
  phone: string,
  buttonId: string
): Promise<ConfirmationResult> {
  const verifier = getRecaptchaVerifier(buttonId);
  return await signInWithPhoneNumber(firebaseAuth, phone, verifier);
}

export type { ConfirmationResult };
