import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import { UserPlus, Search, X, Pencil, Trash2, ShieldCheck, MoreVertical } from "lucide-react";

type User = {
  id: string; name: string; email: string; phone?: string;
  role: string; isActive: boolean; createdAt?: string; address?: string;
};

const roleColors: Record<string, string> = {
  customer: "badge-blue", mechanic: "badge-green", admin: "badge-red", dispatcher: "badge-yellow",
};

export default function UsersPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [showAdd, setShowAdd] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["users"],
    queryFn: () => api.get("/superadmin/users"),
  });

  const createMutation = useMutation({
    mutationFn: (body: any) => api.post("/superadmin/users", body),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["users"] }); setShowAdd(false); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, ...body }: any) => api.patch(`/superadmin/users/${id}`, body),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["users"] }); setEditUser(null); },
  });

  const roleMutation = useMutation({
    mutationFn: ({ id, role }: any) => api.post(`/superadmin/users/${id}/role`, { role }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["users"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/superadmin/users/${id}`, { isActive: false }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["users"] }),
  });

  const users: User[] = data?.users ?? [];
  const filtered = users.filter(u => {
    const matchSearch = !search || u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === "all" || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  return (
    <div style={{ padding: 32 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontFamily: "Rajdhani, sans-serif", fontSize: 24, fontWeight: 700 }}>Users</h1>
          <p style={{ color: "#555", fontSize: 13 }}>{users.length} total users</p>
        </div>
        <button className="btn btn-red" onClick={() => setShowAdd(true)}>
          <UserPlus size={14} /> Add User
        </button>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
        <div style={{ position: "relative", flex: 1, minWidth: 220 }}>
          <Search size={13} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#555" }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name or email..." style={{ paddingLeft: 34 }} />
        </div>
        <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} style={{ width: "auto" }}>
          <option value="all">All Roles</option>
          <option value="customer">Customer</option>
          <option value="mechanic">Mechanic</option>
          <option value="admin">Admin</option>
          <option value="dispatcher">Dispatcher</option>
        </select>
      </div>

      {/* Table */}
      <div style={{ background: "#111", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, overflow: "hidden" }}>
        {isLoading ? <div style={{ padding: 40, textAlign: "center", color: "#555" }}>Loading...</div> : (
          <div style={{ overflowX: "auto" }}>
            <table>
              <thead>
                <tr>
                  <th>User</th>
                  <th>Role</th>
                  <th>Phone</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(u => (
                  <tr key={u.id}>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{
                          width: 32, height: 32, borderRadius: "50%", background: "#e02020",
                          display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "#fff", flexShrink: 0,
                        }}>{u.name[0]?.toUpperCase()}</div>
                        <div>
                          <div style={{ color: "#e5e5e5", fontWeight: 500 }}>{u.name}</div>
                          <div style={{ color: "#555", fontSize: 12 }}>{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${roleColors[u.role] ?? "badge-gray"}`}>{u.role}</span>
                    </td>
                    <td>{u.phone ?? <span style={{ color: "#333" }}>—</span>}</td>
                    <td>
                      <span className={`badge ${u.isActive ? "badge-green" : "badge-red"}`}>
                        {u.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button className="btn btn-ghost" style={{ padding: "4px 10px" }} onClick={() => setEditUser(u)}>
                          <Pencil size={12} />
                        </button>
                        <select
                          value={u.role}
                          onChange={e => roleMutation.mutate({ id: u.id, role: e.target.value })}
                          style={{ width: "auto", padding: "4px 8px", fontSize: 12 }}
                          title="Change role"
                        >
                          <option value="customer">Customer</option>
                          <option value="mechanic">Mechanic</option>
                          <option value="admin">Admin</option>
                          <option value="dispatcher">Dispatcher</option>
                        </select>
                        <button
                          className="btn btn-danger" style={{ padding: "4px 10px" }}
                          onClick={() => { if (confirm(`Deactivate ${u.name}?`)) deleteMutation.mutate(u.id); }}
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={5} style={{ textAlign: "center", color: "#444", padding: 32 }}>No users found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add User Modal */}
      {showAdd && <UserModal onClose={() => setShowAdd(false)} onSave={createMutation.mutate} loading={createMutation.isPending} />}

      {/* Edit User Modal */}
      {editUser && (
        <UserModal
          user={editUser}
          onClose={() => setEditUser(null)}
          onSave={(d: any) => updateMutation.mutate({ id: editUser.id, ...d })}
          loading={updateMutation.isPending}
        />
      )}
    </div>
  );
}

function UserModal({ user, onClose, onSave, loading }: {
  user?: User; onClose: () => void; onSave: (d: any) => void; loading: boolean;
}) {
  const [form, setForm] = useState({
    name: user?.name ?? "",
    email: user?.email ?? "",
    phone: user?.phone ?? "",
    address: user?.address ?? "",
    role: user?.role ?? "customer",
    password: "",
  });

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <h2 style={{ fontFamily: "Rajdhani", fontSize: 20, fontWeight: 700 }}>{user ? "Edit User" : "Add New User"}</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#555" }}><X size={18} /></button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <div className="form-group">
            <label className="form-label">Full Name *</label>
            <input value={form.name} onChange={e => set("name", e.target.value)} placeholder="John Smith" required />
          </div>
          <div className="form-group">
            <label className="form-label">Email *</label>
            <input value={form.email} onChange={e => set("email", e.target.value)} placeholder="john@example.com" type="email" required disabled={!!user} />
          </div>
          <div className="form-group">
            <label className="form-label">Phone</label>
            <input value={form.phone} onChange={e => set("phone", e.target.value)} placeholder="+1 (555) 000-0000" />
          </div>
          <div className="form-group">
            <label className="form-label">Role</label>
            <select value={form.role} onChange={e => set("role", e.target.value)}>
              <option value="customer">Customer</option>
              <option value="mechanic">Mechanic</option>
              <option value="admin">Admin</option>
              <option value="dispatcher">Dispatcher</option>
            </select>
          </div>
          <div className="form-group" style={{ gridColumn: "1 / -1" }}>
            <label className="form-label">Address</label>
            <input value={form.address} onChange={e => set("address", e.target.value)} placeholder="123 Main St, City, State" />
          </div>
          {!user && (
            <div className="form-group" style={{ gridColumn: "1 / -1" }}>
              <label className="form-label">Password (leave blank for TempPass123!)</label>
              <input value={form.password} onChange={e => set("password", e.target.value)} placeholder="Optional password" type="password" />
            </div>
          )}
        </div>

        <div style={{ display: "flex", gap: 10, marginTop: 20, justifyContent: "flex-end" }}>
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-red" disabled={loading} onClick={() => onSave(form)}>
            {loading ? "Saving..." : (user ? "Save Changes" : "Create User")}
          </button>
        </div>
      </div>
    </div>
  );
}
