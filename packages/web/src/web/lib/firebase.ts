import { initializeApp, getApps } from "firebase/app";
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

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
export const firebaseAuth = getAuth(app);

// Initialize App Check with reCAPTCHA Enterprise
if (typeof window !== "undefined" && getApps().length === 1) {
  try {
    initializeAppCheck(app, {
      provider: new ReCaptchaEnterpriseProvider("6LedoSItAAAAAB8vTrGfccfxkVbCKL_LRTtRLhoc"),
      isTokenAutoRefreshEnabled: true,
    });
  } catch {}
}

let recaptchaVerifier: RecaptchaVerifier | null = null;

export function clearRecaptcha() {
  if (recaptchaVerifier) {
    try { recaptchaVerifier.clear(); } catch {}
    recaptchaVerifier = null;
  }
}

export async function sendFirebaseOTP(phone: string): Promise<ConfirmationResult> {
  clearRecaptcha();

  const existingDiv = document.getElementById("__recaptcha_widget__");
  if (existingDiv) existingDiv.remove();

  const div = document.createElement("div");
  div.id = "__recaptcha_widget__";
  div.style.display = "none";
  document.body.appendChild(div);

  recaptchaVerifier = new RecaptchaVerifier(firebaseAuth, div, {
    size: "invisible",
    callback: () => {},
    "expired-callback": () => { clearRecaptcha(); },
  });

  return await signInWithPhoneNumber(firebaseAuth, phone, recaptchaVerifier);
}

export type { ConfirmationResult };
