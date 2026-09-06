import { applicationDefault, cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth, type DecodedIdToken } from "firebase-admin/auth";

function getFirebaseAdminApp() {
  const existing = getApps()[0];
  if (existing) return existing;

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!projectId) {
    throw new Error("FIREBASE_PROJECT_ID is required for server-side token verification");
  }

  return initializeApp({
    projectId,
    credential: clientEmail && privateKey
      ? cert({ projectId, clientEmail, privateKey })
      : applicationDefault(),
  });
}

export function firebaseAdminAuth() {
  return getAuth(getFirebaseAdminApp());
}

export type FirebaseTokenVerifier = (token: string) => Promise<DecodedIdToken>;

export async function verifyBearerToken(
  authorization: string | undefined,
  verifier: FirebaseTokenVerifier = (token) => firebaseAdminAuth().verifyIdToken(token, true),
): Promise<DecodedIdToken | null> {
  const match = authorization?.match(/^Bearer\s+(.+)$/i);
  if (!match?.[1]) return null;
  try {
    return await verifier(match[1]);
  } catch {
    return null;
  }
}
