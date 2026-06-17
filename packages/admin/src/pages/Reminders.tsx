import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import { Bell, Plus, Search, RefreshCw, Edit2, Trash2, X, AlertCircle, CheckCircle } from "lucide-react";

type Reminder = {
  id: number;
  type: string;
  dueDate?: string;
  dueMileage?: number;
  isCompleted: boolean;
  message?: string;
  createdAt?: string;
  userId?: string;
  userName?: string;
  userEmail?: string;
  vehicleId?: number;
  vehicleMake?: string;
  vehicleModel?: string;
  vehicleYear?: number;
};

type User = { id: string; name: string; email: string };

const REMINDER_TYPES = ["oil-change", "tire-rotation", "brake-inspection", "air-filter", "battery", "coolant", "transmission-fluid", "alignment", "registration", "insurance", "other"];

export default function RemindersPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "pending" | "completed">("all");
  const [showCreate, setShowCreate] = useState(false);
  const [editTarget, setEditTarget] = useState<Reminder | null>(null);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["reminders"],
    queryFn: () => api.get("/superadmin/reminders"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/superadmin/reminders/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["reminders"] }),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, isCompleted }: { id: number; isCompleted: boolean }) =>
      api.patch(`/superadmin/reminders/${id}`, { isCompleted }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["reminders"] }),
  });

  const reminders: Reminder[] = data?.reminders ?? [];
  const filtered = reminders.filter(r => {
    if (filter === "pending" && r.isCompleted) return false;
    if (filter === "completed" && !r.isCompleted) return false;
    const q = search.toLowerCase();
    return !search ||
      (r.userName ?? "").toLowerCase().includes(q) ||
      r.type.toLowerCase().includes(q) ||
      (r.vehicleMake ?? "").toLowerCase().includes(q) ||
      (r.vehicleModel ?? "").toLowerCase().includes(q);
  });

  return (
    <div style={{ padding: 32 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontFamily: "Rajdhani, sans-serif", fontSize: 24, fontWeight: 700 }}>Reminders</h1>
          <p style={{ color: "#555", fontSize: 13 }}>{reminders.length} total · {reminders.filter(r => !r.isCompleted).length} pending</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn btn-ghost" onClick={() => refetch()} style={{ padding: "8px 14px" }}><RefreshCw size={14} /></button>
          <button className="btn btn-red" onClick={() => setShowCreate(true)}><Plus size={14} /> Add Reminder</button>
        </div>
      </div>

      <div style={{ display: "flex", gap: 4, marginBottom: 16 }}>
        {(["all", "pending", "completed"] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            padding: "6px 14px", fontSize: 12, fontWeight: 500, cursor: "pointer",
            background: filter === f ? "rgba(224,32,32,0.1)" : "rgba(255,255,255,0.04)",
            border: `1px solid ${filter === f ? "rgba(224,32,32,0.3)" : "rgba(255,255,255,0.07)"}`,
            borderRadius: 8, color: filter === f ? "#e02020" : "#666",
          }}>
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      <div style={{ position: "relative", marginBottom: 16, maxWidth: 380 }}>
        <Search size={13} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#555" }} />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by customer, type, vehicle..." style={{ paddingLeft: 34 }} />
      </div>

      <div style={{ background: "#111", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, overflow: "hidden" }}>
        {isLoading ? (
          <div style={{ padding: 48, textAlign: "center", color: "#555" }}>Loading...</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 48, textAlign: "center", color: "#444" }}>No reminders found.</div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table>
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Type</th>
                  <th>Vehicle</th>
                  <th>Due Date</th>
                  <th>Due Mileage</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(r => {
                  const isOverdue = !r.isCompleted && r.dueDate && new Date(r.dueDate) < new Date();
                  return (
                    <tr key={r.id}>
                      <td>
                        <div style={{ fontWeight: 500, color: "#e5e5e5", fontSize: 13 }}>{r.userName ?? "—"}</div>
                        <div style={{ fontSize: 11, color: "#555" }}>{r.userEmail ?? ""}</div>
                      </td>
                      <td>
                        <span style={{ padding: "3px 8px", borderRadius: 6, fontSize: 11, fontWeight: 600, background: "rgba(255,255,255,0.06)", color: "#aaa" }}>
                          {r.type.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase())}
                        </span>
                      </td>
                      <td style={{ color: "#aaa", fontSize: 13 }}>
                        {r.vehicleMake ? `${r.vehicleYear} ${r.vehicleMake} ${r.vehicleModel}` : "—"}
                      </td>
                      <td>
                        {r.dueDate ? (
                          <span style={{ fontSize: 13, color: isOverdue ? "#f87171" : "#aaa", fontWeight: isOverdue ? 600 : 400 }}>
                            {new Date(r.dueDate).toLocaleDateString()}
                            {isOverdue && <span style={{ marginLeft: 5, fontSize: 10, padding: "1px 5px", background: "rgba(248,113,113,0.15)", border: "1px solid rgba(248,113,113,0.25)", borderRadius: 4 }}>OVERDUE</span>}
                          </span>
                        ) : "—"}
                      </td>
                      <td style={{ color: "#aaa", fontSize: 13 }}>
                        {r.dueMileage ? r.dueMileage.toLocaleString() + " mi" : "—"}
                      </td>
                      <td>
                        <button
                          onClick={() => toggleMutation.mutate({ id: r.id, isCompleted: !r.isCompleted })}
                          style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 5, fontSize: 12 }}
                        >
                          {r.isCompleted
                            ? <><CheckCircle size={14} color="#4ade80" /><span style={{ color: "#4ade80" }}>Done</span></>
                            : <><Bell size={14} color="#fbbf24" /><span style={{ color: "#fbbf24" }}>Pending</span></>
                          }
                        </button>
                      </td>
                      <td>
                        <div style={{ display: "flex", gap: 6 }}>
                          <button className="btn btn-ghost" onClick={() => setEditTarget(r)} style={{ padding: "5px 10px", fontSize: 11 }}>
                            <Edit2 size={11} /> Edit
                          </button>
                          <button
                            className="btn btn-ghost"
                            onClick={() => { if (confirm("Delete this reminder?")) deleteMutation.mutate(r.id); }}
                            style={{ padding: "5px 10px", fontSize: 11, color: "#e02020", borderColor: "rgba(224,32,32,0.2)" }}
                          >
                            <Trash2 size={11} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showCreate && (
        <ReminderModal onClose={() => setShowCreate(false)} onSaved={() => { qc.invalidateQueries({ queryKey: ["reminders"] }); setShowCreate(false); }} />
      )}
      {editTarget && (
        <ReminderModal reminder={editTarget} onClose={() => setEditTarget(null)} onSaved={() => { qc.invalidateQueries({ queryKey: ["reminders"] }); setEditTarget(null); }} />
      )}
    </div>
  );
}

function ReminderModal({ reminder, onClose, onSaved }: { reminder?: Reminder; onClose: () => void; onSaved: () => void }) {
  const isEdit = !!reminder;
  const [form, setForm] = useState({
    userId: reminder?.userId ?? "",
    vehicleId: String(reminder?.vehicleId ?? ""),
    type: reminder?.type ?? "oil-change",
    dueDate: reminder?.dueDate ? new Date(reminder.dueDate).toISOString().split("T")[0] : "",
    dueMileage: String(reminder?.dueMileage ?? ""),
    message: reminder?.message ?? "",
    isCompleted: reminder?.isCompleted ?? false,
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [userSearch, setUserSearch] = useState("");
  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

  const { data: usersData } = useQuery({ queryKey: ["users"], queryFn: () => api.get("/superadmin/users") });
  const { data: vehiclesData } = useQuery({
    queryKey: ["vehicles", form.userId],
    queryFn: () => api.get(`/superadmin/vehicles?userId=${form.userId}`),
    enabled: !!form.userId,
  });

  const users: User[] = usersData?.users ?? [];
  const vehicles: any[] = vehiclesData?.vehicles ?? [];
  const selectedUser = users.find(u => u.id === form.userId);
  const filteredUsers = users.filter(u =>
    !userSearch || u.name.toLowerCase().includes(userSearch.toLowerCase()) || u.email.toLowerCase().includes(userSearch.toLowerCase())
  );

  async function handleSubmit() {
    if (!isEdit && !form.userId) { setError("Select a user"); return; }
    if (!form.type) { setError("Type is required"); return; }
    setError(""); setLoading(true);
    try {
      if (isEdit) {
        await api.patch(`/superadmin/reminders/${reminder!.id}`, {
          type: form.type,
          dueDate: form.dueDate || null,
          dueMileage: form.dueMileage ? Number(form.dueMileage) : null,
          message: form.message || null,
          isCompleted: form.isCompleted,
        });
      } else {
        await api.post("/superadmin/reminders", {
          userId: form.userId,
          vehicleId: form.vehicleId ? Number(form.vehicleId) : null,
          type: form.type,
          dueDate: form.dueDate || null,
          dueMileage: form.dueMileage ? Number(form.dueMileage) : null,
          message: form.message || null,
        });
      }
      onSaved();
    } catch (e: any) { setError(e.message ?? "Failed"); }
    finally { setLoading(false); }
  }

  return (
    <div className="modal-overlay">
      <div className="modal" style={{ maxWidth: 480 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <h2 style={{ fontFamily: "Rajdhani", fontSize: 20, fontWeight: 700 }}>{isEdit ? "Edit Reminder" : "Add Reminder"}</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#555", cursor: "pointer" }}><X size={18} /></button>
        </div>
        {error && <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", background: "rgba(224,32,32,0.08)", border: "1px solid rgba(224,32,32,0.2)", borderRadius: 8, color: "#f87171", fontSize: 13, marginBottom: 16 }}><AlertCircle size={14} />{error}</div>}

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {!isEdit && (
            <div className="form-group">
              <label className="form-label">Customer *</label>
              {selectedUser ? (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", background: "rgba(224,32,32,0.06)", border: "1px solid rgba(224,32,32,0.2)", borderRadius: 8 }}>
                  <div>
                    <div style={{ fontWeight: 500, fontSize: 14 }}>{selectedUser.name}</div>
                    <div style={{ fontSize: 12, color: "#555" }}>{selectedUser.email}</div>
                  </div>
                  <button onClick={() => { set("userId", ""); set("vehicleId", ""); }} style={{ background: "none", border: "none", color: "#555", cursor: "pointer" }}><X size={14} /></button>
                </div>
              ) : (
                <>
                  <input value={userSearch} onChange={e => setUserSearch(e.target.value)} placeholder="Search user..." style={{ marginBottom: 6 }} />
                  <div style={{ maxHeight: 150, overflowY: "auto", background: "#0d0d0d", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 8 }}>
                    {filteredUsers.slice(0, 6).map(u => (
                      <div key={u.id} onClick={() => { set("userId", u.id); setUserSearch(""); }}
                        style={{ padding: "8px 14px", cursor: "pointer", borderBottom: "1px solid rgba(255,255,255,0.04)" }}
                        onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.04)")}
                        onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                        <div style={{ fontSize: 13, fontWeight: 500 }}>{u.name}</div>
                        <div style={{ fontSize: 11, color: "#555" }}>{u.email}</div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {!isEdit && form.userId && vehicles.length > 0 && (
            <div className="form-group">
              <label className="form-label">Vehicle (optional)</label>
              <select value={form.vehicleId} onChange={e => set("vehicleId", e.target.value)}>
                <option value="">— No specific vehicle —</option>
                {vehicles.map((v: any) => <option key={v.id} value={v.id}>{v.year} {v.make} {v.model}</option>)}
              </select>
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Reminder Type *</label>
            <select value={form.type} onChange={e => set("type", e.target.value)}>
              {REMINDER_TYPES.map(t => <option key={t} value={t}>{t.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase())}</option>)}
            </select>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div className="form-group">
              <label className="form-label">Due Date</label>
              <input type="date" value={form.dueDate} onChange={e => set("dueDate", e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Due Mileage</label>
              <input type="number" value={form.dueMileage} onChange={e => set("dueMileage", e.target.value)} placeholder="50000" />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Message / Notes</label>
            <textarea value={form.message} onChange={e => set("message", e.target.value)} rows={2} placeholder="Optional reminder message..." />
          </div>

          {isEdit && (
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <input type="checkbox" id="rem-done" checked={form.isCompleted} onChange={e => set("isCompleted", e.target.checked)} style={{ width: 16, height: 16 }} />
              <label htmlFor="rem-done" style={{ fontSize: 13, color: "#aaa", cursor: "pointer" }}>Mark as completed</label>
            </div>
          )}
        </div>

        <div style={{ display: "flex", gap: 10, marginTop: 24, justifyContent: "flex-end" }}>
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-red" disabled={loading} onClick={handleSubmit} style={{ minWidth: 120, justifyContent: "center" }}>
            {loading ? "Saving..." : isEdit ? "Save Changes" : "Add Reminder"}
          </button>
        </div>
      </div>
    </div>
  );
}
