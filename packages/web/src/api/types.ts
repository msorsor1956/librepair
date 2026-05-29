import type { auth } from "./auth";

// Infer the session type from better-auth
type AuthSession = typeof auth.$Infer.Session;

export type HonoVariables = {
  user: AuthSession["user"] | null;
  session: AuthSession["session"] | null;
};
