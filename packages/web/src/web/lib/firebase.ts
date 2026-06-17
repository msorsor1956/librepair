import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getAuth,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  type ConfirmationResult,
} from "firebase/auth";
import { initializeAppCheck, ReCaptchaEnterpriseProvider } from "firebase/app-check";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyCNMz4Gh65dgyoQOFIFz_u0r-b59Hifq_I",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "librepair-77afa.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "librepair-77afa",
  storageBucket: "librepair-77afa.firebasestorage.app",
  messagingSenderId: "86955698956",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:86955698956:web:2211ccf5087b05810c3729",
  measurementId: "G-8T9W7EN38M",
};

// Only initialise once
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const firebaseAuth = getAuth(app);

// App Check — run once, guard with a flag so HMR doesn't double-init
let appCheckInitialized = false;
if (typeof window !== "undefined" && !appCheckInitialized) {
  try {
    initializeAppCheck(app, {
      provider: new ReCaptchaEnterpriseProvider("6LedoSItAAAAAB8vTrGfccfxkVbCKL_LRTtRLhoc"),
      isTokenAutoRefreshEnabled: true,
    });
    appCheckInitialized = true;
  } catch {
    // Already initialized or reCAPTCHA not loaded yet — safe to ignore
  }
}

let recaptchaVerifier: RecaptchaVerifier | null = null;

export function clearRecaptcha() {
  if (recaptchaVerifier) {
    try { recaptchaVerifier.clear(); } catch {}
    recaptchaVerifier = null;
  }
  // Also remove any leftover widget divs
  document.querySelectorAll("#__recaptcha_widget__").forEach((el) => el.remove());
}

export async function sendFirebaseOTP(phone: string): Promise<ConfirmationResult> {
  clearRecaptcha();

  const div = document.createElement("div");
  div.id = "__recaptcha_widget__";
  div.style.display = "none";
  document.body.appendChild(div);

  recaptchaVerifier = new RecaptchaVerifier(firebaseAuth, div, {
    size: "invisible",
    callback: () => {},
    "expired-callback": () => { clearRecaptcha(); },
  });

  try {
    return await signInWithPhoneNumber(firebaseAuth, phone, recaptchaVerifier);
  } catch (e) {
    clearRecaptcha();
    throw e;
  }
}

export type { ConfirmationResult };
