import { describe, expect, test } from "bun:test";
import type { DecodedIdToken } from "firebase-admin/auth";
import { verifyBearerToken } from "./firebase-admin";
import { canAccessProtectedContent } from "./authorization";

const decoded = { uid: "firebase-user-1", aud: "project", auth_time: 1, exp: 2, firebase: {}, iat: 1, iss: "issuer", sub: "firebase-user-1" } as DecodedIdToken;

describe("Firebase bearer token verification", () => {
  test("accepts a verified Firebase ID token", async () => {
    let received = "";
    const result = await verifyBearerToken("Bearer valid-token", async (token) => { received = token; return decoded; });
    expect(received).toBe("valid-token");
    expect(result?.uid).toBe("firebase-user-1");
  });

  test("rejects missing, malformed, and verifier-rejected tokens", async () => {
    expect(await verifyBearerToken(undefined, async () => decoded)).toBeNull();
    expect(await verifyBearerToken("Basic abc", async () => decoded)).toBeNull();
    expect(await verifyBearerToken("Bearer expired", async () => { throw new Error("expired"); })).toBeNull();
  });
});

describe("approval authorization", () => {
  test("blocks pending and rejected users", () => {
    expect(canAccessProtectedContent({ role: "customer", isActive: true, approvalStatus: "pending" })).toBe(false);
    expect(canAccessProtectedContent({ role: "customer", isActive: true, approvalStatus: "rejected" })).toBe(false);
  });

  test("allows approved active users and preserves active administrators", () => {
    expect(canAccessProtectedContent({ role: "customer", isActive: true, approvalStatus: "approved" })).toBe(true);
    expect(canAccessProtectedContent({ role: "admin", isActive: true, approvalStatus: "pending" })).toBe(true);
    expect(canAccessProtectedContent({ role: "admin", isActive: false, approvalStatus: "approved" })).toBe(false);
  });
});
