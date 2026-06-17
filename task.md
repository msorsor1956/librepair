# Super Admin Panel — Backend + Frontend

## Architecture
- Backend: same Hono server on Render (already deployed), new routes under `/api/superadmin/*`
- Frontend: NEW standalone React app at `/packages/admin` — deployed as separate Wasmer app on different domain `librepair-admin.wasmer.app`
- Communicates with same backend `https://librepair-backend.onrender.com`
- CORS: add `librepair-admin.wasmer.app` to allowed origins

## Features to Build
1. **Auth** — Super admin login (email/password), protected dashboard
2. **User Management** — View all users, add with roles (customer/mechanic/admin/dispatcher), edit, deactivate, reset password
3. **Inventory** — Full CRUD car listings (video + 9 photos, price, contact)
4. **Payments** — View all payments, add manual payment records, update status, filter by customer
5. **Notifications** — Broadcast to all users, specific user, or by role
6. **Push to Frontend** — Announcements that show as banners on the customer-facing site
7. **Stats Dashboard** — Users, appointments, revenue, inventory counts

## New Backend Routes
- `GET /api/superadmin/stats` — full platform stats
- `GET/POST/PATCH/DELETE /api/superadmin/users` — user CRUD with roles
- `POST /api/superadmin/users/:id/reset-password` — send password reset
- `GET/POST/PATCH/DELETE /api/superadmin/inventory` — car inventory (proxy to existing)
- `GET/POST/PATCH/DELETE /api/superadmin/payments` — payment CRUD
- `POST /api/superadmin/notify` — send to all / by role / by userId
- `GET/POST/DELETE /api/superadmin/announcements` — site-wide banners pushed to frontend
- `GET /api/announcements` — PUBLIC — frontend polls this for active banners

## New DB table
- `announcements` — id, title, message, type (info/warning/promo), active, createdAt, expiresAt

## Files to Create
- `/packages/admin/` — new Vite+React app (standalone, no Hono needed, just frontend)
- `/packages/admin/src/` — full admin dashboard SPA
- Backend: `/packages/web/src/api/routes/superadmin.ts` — new super admin router
- Backend: add `announcements` table to schema.ts
- Backend: add announcements public GET route
- Frontend (existing): add announcement banner component polling `/api/announcements`

## Status
- [ ] Schema: add announcements table
- [ ] Backend: superadmin.ts route
- [ ] Backend: register route + CORS update
- [ ] Backend: db:push
- [ ] Frontend banner: poll announcements
- [ ] Admin SPA: scaffold + all sections
- [ ] Build + deploy admin SPA to Wasmer
- [ ] Push git
