# Firebase Authentication setup

LIBrepair uses Firebase Authentication for the public web app, admin app, and Expo native app. Firebase proves identity; the existing `users` table remains the source of application roles and approval status.

## 1. Create and configure Firebase

1. In Firebase Console, create or select the production project.
2. Open **Project settings → General → Your apps**, add a Web app, and copy its configuration values into the `VITE_FIREBASE_*` variables in `.env.template`. These identifiers are public client configuration, not service-account secrets.
3. Open **Authentication → Sign-in method** and enable:
   - **Email/Password** (Email link is optional and is not required by this app).
   - **Google**, selecting a project support email.
   - **Phone**, after reviewing Firebase SMS pricing, quotas, and allowed SMS regions.
4. Open **Authentication → Settings → Authorized domains** and add `localhost`, `librepair.wasmer.app`, `librepair-admin.wasmer.app`, and each real custom or deployment domain. Enter hostnames only—no protocol or port.
5. For a custom password-reset screen, update the Firebase email action template/action URL so reset links reach `/reset-password`; this page accepts Firebase's `oobCode` query parameter. The default Firebase-hosted reset handler also works.

## 2. Configure the server-only Admin SDK

1. Open **Project settings → Service accounts → Generate new private key**.
2. Store `project_id`, `client_email`, and `private_key` as `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, and `FIREBASE_PRIVATE_KEY` in the backend secret manager.
3. Encode private-key line breaks as literal `\\n` when the host requires a one-line value. Never prefix these variables with `VITE_` or `EXPO_PUBLIC_`, and never commit the downloaded JSON key.

The backend verifies every bearer ID token with revocation checking. A valid Firebase token alone is not sufficient: protected APIs also require an active application user whose `approvalStatus` is `approved` (administrators are preserved as approved during identity linking).

## 3. Configure native Expo apps

1. Add an Android Firebase app with package `com.librepair_x9k2.runable`. Add the release and development SHA-1 and SHA-256 fingerprints required by Google sign-in and phone verification. Download `google-services.json` outside version control and set `GOOGLE_SERVICES_JSON` to its local/CI path.
2. Add an iOS Firebase app with bundle id `com.librepair_x9k2.runable`. Download `GoogleService-Info.plist` outside version control and set `GOOGLE_SERVICE_INFO_PLIST` to its local/CI path. Configure APNs in Firebase for reliable iOS phone authentication.
3. Copy the Web OAuth client id into `EXPO_PUBLIC_FIREBASE_WEB_CLIENT_ID`, and set `EXPO_PUBLIC_API_URL` to the backend origin.
4. Run `bun install`, then create an Expo development/production build (`eas build` or `expo run:android` / `expo run:ios`). Native Firebase modules do not run in Expo Go.

## 4. Apply the domain schema and bootstrap access

Run `cd packages/web && bun run db:push` against each environment. This adds `firebase_uid`, `approval_status`, approval notes, reviewer, and timestamp fields without changing existing domain primary keys. On first Firebase sign-in, existing users are linked by normalized email or phone, preserving vehicle, appointment, invoice, and payment references.

For an existing installation, make sure at least one row in `users` has `role = 'admin'` and an email matching a Firebase user before switching traffic. That admin's first sign-in links its Firebase uid and automatically marks the account approved. New self-registered non-admin users are `pending`; admins review them under **People → Account Approvals**. Rejected users remain authenticated with Firebase but cannot access protected UI or APIs.

## 5. Deploy

Provide all `VITE_FIREBASE_*` values at build time for both web Docker images. Provide the three unprefixed Admin SDK secrets only to the backend runtime. After deployment, test one account for each provider and verify that it remains blocked until an admin approves it.
