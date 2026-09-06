import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getAuth,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  type ConfirmationResult,
} from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Only initialise once
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const firebaseAuth = getAuth(app);
export { app as firebaseApp };

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
