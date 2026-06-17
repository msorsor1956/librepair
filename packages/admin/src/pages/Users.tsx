import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import {
  UserPlus, Search, Pencil, Trash2, Phone, Mail, MapPin, X,
  AlertCircle, KeyRound, CheckCircle, Send, RefreshCw,
} from "lucide-react";

type User = {
  id: string; name: string; email: string; phone?: string;
  role: string; isActive: boolean; createdAt?: string; address?: string;
};

type Tab = "customers" | "all" | "mechanic" | "admin";

const roleColors: Record<string, string> = {
  customer: "badge-blue", mechanic: "badge-green", admin: "badge-red", dispatcher: "badge-yellow",
};

function SyncUsersButton() {
  const qc = useQueryClient();
  const [msg, setMsg] = useState("");
  const [syncing, setSyncing] = useState(false);
  const sync = async () => {
    setSyncing(true);
    setMsg("");
    try {
      const res = await api.post("/superadmin/sync-users", {});
      setMsg(`✓ ${res.message}`);
      qc.invalidateQueries({ queryKey: ["users"] });
    } catch (e: any) {
      setMsg(`✗ ${e.message}`);
    } finally {
      setSyncing(false);
      setTimeout(() => setMsg(""), 5000);
    }
  };
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      {msg && <span style={{ fontSize: 12, color: msg.startsWith("✓") ? "#4ade80" : "#f87171" }}>{msg}</span>}
      <button className="btn btn-ghost" onClick={sync} disabled={syncing} title="Sync Google/social sign-ups into users table">
        <RefreshCw size={14} style={{ animation: syncing ? "spin 0.8s linear infinite" : "none" }} />
        {syncing ? "Syncing…" : "Sync Auth Users"}
      </button>
    </div>
  );
}

export default function UsersPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<Tab>("customers");
  const [showAdd, setShowAdd] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [resetUser, setResetUser] = useState<User | null>(null);

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
        <div style={{ display: "flex", gap: 8 }}>
          <SyncUsersButton />
          <button className="btn btn-red" onClick={() => setShowAdd(true)}>
            <UserPlus size={14} /> Add User
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, marginBottom: 20, borderBottom: "1px solid rgba(255,255,255,0.06)", paddingBottom: 0 }}>
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{
            padding: "8px 16px", fontSize: 13, fontWeight: 500, cursor: "pointer",
            background: "none", border: "none",
            color: tab === t.key ? "#e02020" : "#666",
            borderBottom: tab === t.key ? "2px solid #e02020" : "2px solid transparent",
            marginBottom: -1,
          }}>
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
                  <th>User</th>
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
                          title="Reset Password"
                          onClick={() => setResetUser(u)}
                        >
                          <KeyRound size={12} />
                        </button>
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

      {showAdd && (
        <AddUserModal
          onClose={() => setShowAdd(false)}
          onSave={createMutation.mutate}
          loading={createMutation.isPending}
          error={createMutation.error?.message}
          result={createMutation.data}
        />
      )}
      {editUser && (
        <EditUserModal
          user={editUser}
          onClose={() => setEditUser(null)}
          onSave={(d: any) => updateMutation.mutate({ id: editUser.id, ...d })}
          loading={updateMutation.isPending}
          error={updateMutation.error?.message}
        />
      )}
      {resetUser && (
        <ResetPasswordModal
          user={resetUser}
          onClose={() => setResetUser(null)}
        />
      )}
    </div>
  );
}

// ── Add User Modal ────────────────────────────────────────────────────────────
function AddUserModal({ onClose, onSave, loading, error, result }: {
  onClose: () => void;
  onSave: (d: any) => void;
  loading: boolean;
  error?: string;
  result?: any;
}) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    role: "customer",
    isActive: true,
    sendEmail: true,
    sendSms: false,
  });
  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

  const success = !!result?.user;

  return (
    <div className="modal-overlay">
      <div className="modal" style={{ maxWidth: 520 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <div>
            <h2 style={{ fontFamily: "Rajdhani", fontSize: 20, fontWeight: 700 }}>Add New User</h2>
            <p style={{ fontSize: 12, color: "#555", marginTop: 2 }}>A password-set link will be sent to the user</p>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#555" }}><X size={18} /></button>
        </div>

        {error && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", background: "rgba(224,32,32,0.08)", border: "1px solid rgba(224,32,32,0.2)", borderRadius: 8, color: "#f87171", fontSize: 13, marginBottom: 16 }}>
            <AlertCircle size={14} /> {error}
          </div>
        )}

        {success ? (
          <div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "24px 0", gap: 12, textAlign: "center" }}>
              <div style={{ width: 56, height: 56, borderRadius: "50%", background: "rgba(34,197,94,0.1)", border: "2px solid #22c55e", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <CheckCircle size={28} color="#22c55e" />
              </div>
              <h3 style={{ color: "#e5e5e5", fontSize: 18, fontWeight: 600 }}>User Created!</h3>
              <p style={{ color: "#888", fontSize: 13, lineHeight: 1.6, maxWidth: 340 }}>
                <strong style={{ color: "#e5e5e5" }}>{result.user.name}</strong> has been added as a <strong style={{ color: "#e5e5e5" }}>{result.user.role}</strong>.
              </p>
              {result.emailSent && (
                <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 16px", background: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.2)", borderRadius: 8, fontSize: 13, color: "#86efac" }}>
                  <Mail size={14} /> Password-set email sent to {result.user.email}
                </div>
              )}
              {result.smsSent && (
                <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 16px", background: "rgba(59,130,246,0.06)", border: "1px solid rgba(59,130,246,0.2)", borderRadius: 8, fontSize: 13, color: "#93c5fd" }}>
                  <Phone size={14} /> SMS notification sent
                </div>
              )}
              {!result.emailSent && (
                <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 16px", background: "rgba(234,179,8,0.06)", border: "1px solid rgba(234,179,8,0.2)", borderRadius: 8, fontSize: 13, color: "#fde68a" }}>
                  <AlertCircle size={14} /> Email could not be delivered — share the login link manually
                </div>
              )}
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}>
              <button className="btn btn-red" onClick={onClose}>Done</button>
            </div>
          </div>
        ) : (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <div className="form-group" style={{ gridColumn: "1/-1" }}>
                <label className="form-label">Full Name *</label>
                <input value={form.name} onChange={e => set("name", e.target.value)} placeholder="John Smith" required />
              </div>
              <div className="form-group">
                <label className="form-label">Email *</label>
                <input value={form.email} onChange={e => set("email", e.target.value)} placeholder="john@example.com" type="email" required />
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
            </div>

            {/* Notification options */}
            <div style={{ marginTop: 20, padding: "16px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 10 }}>
              <p style={{ fontSize: 12, color: "#888", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 14 }}>
                <Send size={11} style={{ verticalAlign: "middle", marginRight: 6 }} />
                Notify User
              </p>
              <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", marginBottom: 12 }}>
                <div
                  onClick={() => set("sendEmail", !form.sendEmail)}
                  style={{
                    width: 18, height: 18, borderRadius: 4, flexShrink: 0,
                    background: form.sendEmail ? "#e02020" : "transparent",
                    border: form.sendEmail ? "2px solid #e02020" : "2px solid #333",
                    display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
                  }}
                >
                  {form.sendEmail && <span style={{ color: "#fff", fontSize: 11, lineHeight: 1 }}>✓</span>}
                </div>
                <div>
                  <span style={{ fontSize: 13, color: "#e5e5e5" }}>Send password-set email</span>
                  <p style={{ fontSize: 11, color: "#555", margin: 0 }}>User gets a secure link to create their own password</p>
                </div>
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", opacity: form.phone ? 1 : 0.4 }}>
                <div
                  onClick={() => form.phone && set("sendSms", !form.sendSms)}
                  style={{
                    width: 18, height: 18, borderRadius: 4, flexShrink: 0,
                    background: form.sendSms && form.phone ? "#e02020" : "transparent",
                    border: form.sendSms && form.phone ? "2px solid #e02020" : "2px solid #333",
                    display: "flex", alignItems: "center", justifyContent: "center", cursor: form.phone ? "pointer" : "default",
                  }}
                >
                  {form.sendSms && form.phone && <span style={{ color: "#fff", fontSize: 11, lineHeight: 1 }}>✓</span>}
                </div>
                <div>
                  <span style={{ fontSize: 13, color: "#e5e5e5" }}>Send SMS notification</span>
                  <p style={{ fontSize: 11, color: "#555", margin: 0 }}>{form.phone ? "Text message sent to the phone number above" : "Add a phone number to enable SMS"}</p>
                </div>
              </label>
            </div>

            <div style={{ display: "flex", gap: 10, marginTop: 20, justifyContent: "flex-end" }}>
              <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
              <button
                className="btn btn-red"
                disabled={loading || !form.name || !form.email}
                onClick={() => onSave(form)}
              >
                {loading ? "Creating..." : "Create User"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── Edit User Modal ───────────────────────────────────────────────────────────
function EditUserModal({ user, onClose, onSave, loading, error }: {
  user: User; onClose: () => void; onSave: (d: any) => void; loading: boolean; error?: string;
}) {
  const [form, setForm] = useState({
    name: user.name,
    phone: user.phone ?? "",
    address: user.address ?? "",
    role: user.role,
    isActive: user.isActive,
  });
  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div className="modal-overlay">
      <div className="modal" style={{ maxWidth: 500 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <div>
            <h2 style={{ fontFamily: "Rajdhani", fontSize: 20, fontWeight: 700 }}>Edit User</h2>
            <p style={{ fontSize: 12, color: "#555", marginTop: 2 }}>{user.email} · ID: {user.id.slice(0, 8)}...</p>
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
            <label className="form-label">Full Name</label>
            <input value={form.name} onChange={e => set("name", e.target.value)} />
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
          <div className="form-group" style={{ gridColumn: "1/-1" }}>
            <label className="form-label">Address</label>
            <input value={form.address} onChange={e => set("address", e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Status</label>
            <select value={form.isActive ? "active" : "inactive"} onChange={e => set("isActive", e.target.value === "active")}>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, marginTop: 24, justifyContent: "flex-end" }}>
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-red" disabled={loading} onClick={() => onSave(form)}>
            {loading ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Reset Password Modal ──────────────────────────────────────────────────────
function ResetPasswordModal({ user, onClose }: { user: User; onClose: () => void }) {
  const [sendSms, setSendSms] = useState(false);
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);

  const handleSend = async () => {
    setSending(true);
    setError(null);
    try {
      const res = await api.post(`/superadmin/users/${user.id}/reset-password`, { sendSms });
      setResult(res);
      setSent(true);
    } catch (e: any) {
      setError(e?.message ?? "Failed to send");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal" style={{ maxWidth: 460 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <h2 style={{ fontFamily: "Rajdhani", fontSize: 20, fontWeight: 700 }}>Reset Password</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#555" }}><X size={18} /></button>
        </div>

        {!sent ? (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 10, marginBottom: 20 }}>
              <div style={{ width: 40, height: 40, borderRadius: "50%", background: "#e02020", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 700, color: "#fff", flexShrink: 0 }}>
                {user.name[0]?.toUpperCase()}
              </div>
              <div>
                <div style={{ color: "#e5e5e5", fontWeight: 500 }}>{user.name}</div>
                <div style={{ color: "#555", fontSize: 12 }}>{user.email}</div>
              </div>
            </div>

            <p style={{ color: "#888", fontSize: 13, lineHeight: 1.6, marginBottom: 20 }}>
              Send this user a secure link to set a new password. The link expires in 1 hour.
            </p>

            {error && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", background: "rgba(224,32,32,0.08)", border: "1px solid rgba(224,32,32,0.2)", borderRadius: 8, color: "#f87171", fontSize: 13, marginBottom: 16 }}>
                <AlertCircle size={14} /> {error}
              </div>
            )}

            {/* Options */}
            <div style={{ padding: "14px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 10, marginBottom: 20 }}>
              <label style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: user.phone ? 12 : 0 }}>
                <div style={{ width: 18, height: 18, borderRadius: 4, background: "#e02020", border: "2px solid #e02020", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <span style={{ color: "#fff", fontSize: 11 }}>✓</span>
                </div>
                <div>
                  <span style={{ fontSize: 13, color: "#e5e5e5" }}>Send via email</span>
                  <p style={{ fontSize: 11, color: "#555", margin: 0 }}>{user.email}</p>
                </div>
              </label>
              {user.phone && (
                <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }} onClick={() => setSendSms(!sendSms)}>
                  <div style={{
                    width: 18, height: 18, borderRadius: 4, flexShrink: 0,
                    background: sendSms ? "#e02020" : "transparent",
                    border: sendSms ? "2px solid #e02020" : "2px solid #333",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    {sendSms && <span style={{ color: "#fff", fontSize: 11 }}>✓</span>}
                  </div>
                  <div>
                    <span style={{ fontSize: 13, color: "#e5e5e5" }}>Also send SMS</span>
                    <p style={{ fontSize: 11, color: "#555", margin: 0 }}>{user.phone}</p>
                  </div>
                </label>
              )}
            </div>

            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
              <button className="btn btn-red" disabled={sending} onClick={handleSend}>
                {sending ? "Sending..." : <><Send size={13} /> Send Reset Link</>}
              </button>
            </div>
          </>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "20px 0 8px", gap: 12, textAlign: "center" }}>
            <div style={{ width: 56, height: 56, borderRadius: "50%", background: "rgba(34,197,94,0.1)", border: "2px solid #22c55e", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <CheckCircle size={28} color="#22c55e" />
            </div>
            <h3 style={{ color: "#e5e5e5", fontSize: 18, fontWeight: 600 }}>Reset Link Sent!</h3>
            {result?.emailSent && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 16px", background: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.2)", borderRadius: 8, fontSize: 13, color: "#86efac" }}>
                <Mail size={14} /> Email sent to {user.email}
              </div>
            )}
            {result?.smsSent && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 16px", background: "rgba(59,130,246,0.06)", border: "1px solid rgba(59,130,246,0.2)", borderRadius: 8, fontSize: 13, color: "#93c5fd" }}>
                <Phone size={14} /> SMS sent to {user.phone}
              </div>
            )}
            <button className="btn btn-red" style={{ marginTop: 12 }} onClick={onClose}>Done</button>
          </div>
        )}
      </div>
    </div>
  );
}
