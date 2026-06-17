import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import { UserPlus, Search, Pencil, Trash2, Car, Phone, Mail, MapPin, X, AlertCircle } from "lucide-react";

type User = {
  id: string; name: string; email: string; phone?: string;
  role: string; isActive: boolean; createdAt?: string; address?: string;
};

type Tab = "customers" | "all" | "mechanic" | "admin";

const roleColors: Record<string, string> = {
  customer: "badge-blue", mechanic: "badge-green", admin: "badge-red", dispatcher: "badge-yellow",
};

export default function UsersPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<Tab>("customers");
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

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/superadmin/users/${id}`, { isActive: false }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["users"] }),
  });

  const users: User[] = data?.users ?? [];

  const tabs: { key: Tab; label: string; role?: string }[] = [
    { key: "customers", label: "Customers", role: "customer" },
    { key: "mechanic", label: "Mechanics", role: "mechanic" },
    { key: "admin", label: "Admins", role: "admin" },
    { key: "all", label: "All Users" },
  ];

  const filtered = users.filter(u => {
    const roleMatch = tab === "all" ? true : u.role === tabs.find(t => t.key === tab)?.role;
    const searchMatch = !search ||
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      (u.phone ?? "").includes(search);
    return roleMatch && searchMatch;
  });

  const tabCount = (t: { key: Tab; role?: string }) =>
    t.role ? users.filter(u => u.role === t.role).length : users.length;

  return (
    <div style={{ padding: 32 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontFamily: "Rajdhani, sans-serif", fontSize: 24, fontWeight: 700 }}>Users</h1>
          <p style={{ color: "#555", fontSize: 13 }}>{users.length} total · {users.filter(u => u.role === "customer").length} customers</p>
        </div>
        <button className="btn btn-red" onClick={() => setShowAdd(true)}>
          <UserPlus size={14} /> Add User
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, marginBottom: 20, borderBottom: "1px solid rgba(255,255,255,0.06)", paddingBottom: 0 }}>
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              padding: "8px 16px", fontSize: 13, fontWeight: 500, cursor: "pointer",
              background: "none", border: "none",
              color: tab === t.key ? "#e02020" : "#666",
              borderBottom: tab === t.key ? "2px solid #e02020" : "2px solid transparent",
              marginBottom: -1,
            }}
          >
            {t.label} <span style={{ fontSize: 11, color: tab === t.key ? "#e02020" : "#444" }}>({tabCount(t)})</span>
          </button>
        ))}
      </div>

      {/* Search */}
      <div style={{ position: "relative", marginBottom: 16, maxWidth: 380 }}>
        <Search size={13} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#555" }} />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name, email, or phone..." style={{ paddingLeft: 34 }} />
      </div>

      {/* Table */}
      <div style={{ background: "#111", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, overflow: "hidden" }}>
        {isLoading ? (
          <div style={{ padding: 40, textAlign: "center", color: "#555" }}>Loading...</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 40, textAlign: "center", color: "#444" }}>
            {tab === "customers" ? "No customers yet. They'll appear here once they sign up." : "No users found."}
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table>
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Contact</th>
                  <th>Address</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Joined</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(u => (
                  <tr key={u.id}>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{
                          width: 36, height: 36, borderRadius: "50%",
                          background: u.role === "customer" ? "#1e40af" : "#e02020",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: 13, fontWeight: 700, color: "#fff", flexShrink: 0,
                        }}>
                          {u.name[0]?.toUpperCase()}
                        </div>
                        <div>
                          <div style={{ color: "#e5e5e5", fontWeight: 500, fontSize: 14 }}>{u.name}</div>
                          <div style={{ color: "#555", fontSize: 12, display: "flex", alignItems: "center", gap: 4 }}>
                            <Mail size={10} /> {u.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      {u.phone ? (
                        <div style={{ display: "flex", alignItems: "center", gap: 4, color: "#aaa", fontSize: 13 }}>
                          <Phone size={12} /> {u.phone}
                        </div>
                      ) : <span style={{ color: "#333" }}>—</span>}
                    </td>
                    <td>
                      {u.address ? (
                        <div style={{ display: "flex", alignItems: "center", gap: 4, color: "#888", fontSize: 12, maxWidth: 180 }}>
                          <MapPin size={11} style={{ flexShrink: 0 }} />
                          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{u.address}</span>
                        </div>
                      ) : <span style={{ color: "#333" }}>—</span>}
                    </td>
                    <td><span className={`badge ${roleColors[u.role] ?? "badge-gray"}`}>{u.role}</span></td>
                    <td>
                      <span className={`badge ${u.isActive ? "badge-green" : "badge-red"}`}>
                        {u.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td style={{ color: "#555", fontSize: 12 }}>
                      {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "—"}
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button
                          className="btn btn-ghost"
                          style={{ padding: "5px 10px", fontSize: 12, display: "flex", alignItems: "center", gap: 4 }}
                          onClick={() => setEditUser(u)}
                        >
                          <Pencil size={12} /> Edit
                        </button>
                        {u.isActive && (
                          <button
                            className="btn btn-danger"
                            style={{ padding: "5px 10px" }}
                            onClick={() => { if (confirm(`Deactivate ${u.name}?`)) deleteMutation.mutate(u.id); }}
                          >
                            <Trash2 size={12} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showAdd && <UserModal onClose={() => setShowAdd(false)} onSave={createMutation.mutate} loading={createMutation.isPending} error={createMutation.error?.message} />}
      {editUser && (
        <UserModal
          user={editUser}
          onClose={() => setEditUser(null)}
          onSave={(d: any) => updateMutation.mutate({ id: editUser.id, ...d })}
          loading={updateMutation.isPending}
          error={updateMutation.error?.message}
        />
      )}
    </div>
  );
}

function UserModal({ user, onClose, onSave, loading, error }: {
  user?: User; onClose: () => void; onSave: (d: any) => void; loading: boolean; error?: string;
}) {
  const [form, setForm] = useState({
    name: user?.name ?? "",
    email: user?.email ?? "",
    phone: user?.phone ?? "",
    address: user?.address ?? "",
    role: user?.role ?? "customer",
    password: "",
    isActive: user?.isActive ?? true,
  });
  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div className="modal-overlay">
      <div className="modal" style={{ maxWidth: 500 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <div>
            <h2 style={{ fontFamily: "Rajdhani", fontSize: 20, fontWeight: 700 }}>{user ? "Edit Customer" : "Add New User"}</h2>
            {user && <p style={{ fontSize: 12, color: "#555", marginTop: 2 }}>ID: {user.id.slice(0, 8)}...</p>}
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#555" }}><X size={18} /></button>
        </div>

        {error && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", background: "rgba(224,32,32,0.08)", border: "1px solid rgba(224,32,32,0.2)", borderRadius: 8, color: "#f87171", fontSize: 13, marginBottom: 16 }}>
            <AlertCircle size={14} /> {error}
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <div className="form-group" style={{ gridColumn: "1/-1" }}>
            <label className="form-label">Full Name *</label>
            <input value={form.name} onChange={e => set("name", e.target.value)} placeholder="John Smith" required />
          </div>
          <div className="form-group">
            <label className="form-label">Email *</label>
            <input value={form.email} onChange={e => set("email", e.target.value)} placeholder="john@example.com" type="email" required disabled={!!user} style={user ? { opacity: 0.5 } : {}} />
          </div>
          <div className="form-group">
            <label className="form-label">Phone</label>
            <input value={form.phone} onChange={e => set("phone", e.target.value)} placeholder="+1 (555) 000-0000" />
          </div>
          <div className="form-group" style={{ gridColumn: "1/-1" }}>
            <label className="form-label">Address</label>
            <input value={form.address} onChange={e => set("address", e.target.value)} placeholder="123 Main St, City, State" />
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
          <div className="form-group">
            <label className="form-label">Status</label>
            <select value={form.isActive ? "active" : "inactive"} onChange={e => set("isActive", e.target.value === "active")}>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          {!user && (
            <div className="form-group" style={{ gridColumn: "1/-1" }}>
              <label className="form-label">Password <span style={{ color: "#444" }}>(leave blank for TempPass123!)</span></label>
              <input value={form.password} onChange={e => set("password", e.target.value)} placeholder="Optional custom password" type="password" />
            </div>
          )}
        </div>

        <div style={{ display: "flex", gap: 10, marginTop: 24, justifyContent: "flex-end" }}>
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-red" disabled={loading} onClick={() => onSave(form)}>
            {loading ? "Saving..." : (user ? "Save Changes" : "Create User")}
          </button>
        </div>
      </div>
    </div>
  );
}
