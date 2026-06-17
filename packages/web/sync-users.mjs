import { createClient } from "@libsql/client";

const client = createClient({
  url: "libsql://68c85619-e47d-4549-8bb4-05d3986a9cdd-runable.aws-us-east-2.turso.io",
  authToken: "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE3ODAwNjI4MDEsInAiOnsicnciOnsibnMiOlsiMDE5ZTc0MDItY2IwMS03NWIyLTk5ZTktNGM4MDNjY2NiNjlhIl19fSwicmlkIjoiOTY2MGRjZmMtNzFmOS00MGJjLWI5YTAtOTEwMDZmOTlmM2ExIn0.DiX2gC31Gq8nhSCRk_5LXY7uQLoe5urk8sphHhwVo-rAkn5lVfC5g66g8PjWWNANPp5TADJgeJ-YUX87KVcyBw",
});

const baResult = await client.execute("SELECT id, name, email, image FROM user");
const existResult = await client.execute("SELECT id FROM users");

const existingIds = new Set(existResult.rows.map(r => r.id ?? r[0]));

let synced = 0;
for (const row of baResult.rows) {
  const id = row.id ?? row[0];
  const name = row.name ?? row[1];
  const email = row.email ?? row[2];
  const image = row.image ?? row[3];
  if (!existingIds.has(id)) {
    console.log("Syncing missing user:", email);
    await client.execute({
      sql: "INSERT INTO users (id, name, email, role, is_active, profile_photo) VALUES (?, ?, ?, 'customer', 1, ?) ON CONFLICT(id) DO NOTHING",
      args: [id, name || email, email, image || null],
    });
    synced++;
  }
}

console.log(`Synced ${synced} missing users.`);
const final = await client.execute("SELECT id, name, email, role FROM users");
console.log("Total 'users' now:", final.rows.length);
final.rows.forEach(r => console.log(" ", (r.email ?? r[2]), "|", (r.role ?? r[3])));
