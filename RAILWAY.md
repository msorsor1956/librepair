# Railway deployment

LIBrepair uses a Railway PostgreSQL service and a single private service reference for database access.

## Services

- `Postgres`: Railway PostgreSQL database with a persistent volume.
- `librepair`: Hono API and public web application built from `Dockerfile`.
- `librepair-admin`: admin frontend built from `Dockerfile.admin`.

## Required wiring

Set `DATABASE_URL` on `librepair` as a Railway reference to the Postgres service's `DATABASE_URL` variable. Do not copy the generated password or connection string into source control. `DATABASE_AUTH_TOKEN` is obsolete and must not be configured.

The web container runs `drizzle-kit migrate` before starting the Hono server, so committed migrations are applied idempotently on each deployment. The admin frontend does not connect directly to PostgreSQL.

Firebase Admin credentials stay server-only on `librepair`. Public `VITE_FIREBASE_*` values are build-time configuration for the web/admin clients.

## Release order

1. Provision Postgres and confirm it is healthy.
2. Apply the committed migration to the empty database.
3. Build and test the branch.
4. Configure the private `DATABASE_URL` reference on `librepair`.
5. Deploy from the reviewed commit, then verify `/api/health` and the Firebase approval workflow.

Do not generate public domains or change production traffic until the deployment has been explicitly approved.
