import type { DecodedIdToken } from "firebase-admin/auth";
import type { users } from "./database/schema";

type ApplicationUser = typeof users.$inferSelect;

export type HonoVariables = {
  user: ApplicationUser | null;
  session: DecodedIdToken | null;
};
