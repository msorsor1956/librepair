import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import { Wrench, Plus, Search, RefreshCw, Edit2, Trash2, X, AlertCircle, Star, ToggleLeft, ToggleRight } from "lucide-react";

type Mechanic = {
  id: number;
  userId: string;
  name?: string;
  email?: string;
  phone?: string;
  specializations?: string;
  rating?: number;
  totalJobs?: number;
  isAvailable: boolean;
  bio?: string;
  createdAt?: string;
};

type User = { id: string; name: string; email: string; role: string };

export default function MechanicsPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [editTarget, setEditTarget] = useState<Mechanic | null>(null);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["mechanics"],
    queryFn: () => api.get("/superadmin/mechanics"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/superadmin/mechanics/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["mechanics"] }),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, isAvailable }: { id: number; isAvailable: boolean }) =>
      api.patch(`/superadmin/mechanics/${id}`, { isAvailable }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["mechanics"] }),
  });

  const mechanics: Mechanic[] = data?.mechanics ?? [];
  const filtered = mechanics.filter(m => {
    const q = search.toLowerCase();
    return !search ||
      (m.name ?? "").toLowerCase().includes(q) ||
      (m.email ?? "").toLowerCase().includes(q) ||
      (m.specializations ?? "").toLowerCase().includes(q);
  });

  return (
    <div style={{ padding: 32 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontFamily: "Rajdhani, sans-serif", fontSize: 24, fontWeight: 700 }}>Mechanics</h1>
          <p style={{ color: "#555", fontSize: 13 }}>{mechanics.length} registered · {mechanics.filter(m => m.isAvailable).length} available</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn btn-ghost" onClick={() => refetch()} style={{ padding: "8px 14px" }}><RefreshCw size={14} /></button>
          <button className="btn btn-red" onClick={() => setShowCreate(true)}><Plus size={14} /> Add Mechanic</button>
        </div>
      </div>

      <div style={{ position: "relative", marginBottom: 16, maxWidth: 380 }}>
        <Search size={13} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#555" }} />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search mechanics..." style={{ paddingLeft: 34 }} />
      </div>

      <div style={{ background: "#111", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, overflow: "hidden" }}>
        {isLoading ? (
          <div style={{ padding: 48, textAlign: "center", color: "#555" }}>Loading...</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 48, textAlign: "center", color: "#444" }}>No mechanics found.</div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table>
              <thead>
                <tr>
                  <th>Mechanic</th>
                  <th>Specializations</th>
                  <th>Rating</th>
                  <th>Jobs</th>
                  <th>Availability</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(m => (
                  <tr key={m.id}>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#1e3a8a", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, color: "#93c5fd", flexShrink: 0 }}>
                          {(m.name ?? "M")[0].toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, color: "#e5e5e5", fontSize: 14 }}>{m.name ?? "—"}</div>
                          <div style={{ fontSize: 11, color: "#555" }}>{m.email ?? ""}</div>
                          {m.phone && <div style={{ fontSize: 11, color: "#444" }}>{m.phone}</div>}
                        </div>
                      </div>
                    </td>
                    <td style={{ maxWidth: 200 }}>
                      {m.specializations ? (
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                          {m.specializations.split(",").map((s, i) => (
                            <span key={i} style={{ padding: "2px 7px", borderRadius: 5, fontSize: 11, background: "rgba(255,255,255,0.06)", color: "#aaa" }}>{s.trim()}</span>
                          ))}
                        </div>
                      ) : <span style={{ color: "#333" }}>—</span>}
                    </td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 4, color: "#fbbf24" }}>
                        <Star size={12} fill="#fbbf24" />
                        <span style={{ fontSize: 13, fontWeight: 600 }}>{(m.rating ?? 5.0).toFixed(1)}</span>
                      </div>
                    </td>
                    <td style={{ color: "#aaa", fontSize: 13 }}>{m.totalJobs ?? 0}</td>
                    <td>
                      <button
                        onClick={() => toggleMutation.mutate({ id: m.id, isAvailable: !m.isAvailable })}
                        style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 5, fontSize: 12 }}
                      >
                        {m.isAvailable
                          ? <><ToggleRight size={18} color="#4ade80" /><span style={{ color: "#4ade80" }}>Available</span></>
                          : <><ToggleLeft size={18} color="#555" /><span style={{ color: "#555" }}>Unavailable</span></>
                        }
                      </button>
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button className="btn btn-ghost" onClick={() => setEditTarget(m)} style={{ padding: "5px 10px", fontSize: 11 }}>
                          <Edit2 size={11} /> Edit
                        </button>
                        <button
                          className="btn btn-ghost"
                          onClick={() => { if (confirm("Remove this mechanic profile?")) deleteMutation.mutate(m.id); }}
                          style={{ padding: "5px 10px", fontSize: 11, color: "#e02020", borderColor: "rgba(224,32,32,0.2)" }}
                        >
                          <Trash2 size={11} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showCreate && (
        <MechanicModal onClose={() => setShowCreate(false)} onSaved={() => { qc.invalidateQueries({ queryKey: ["mechanics"] }); setShowCreate(false); }} />
      )}
      {editTarget && (
        <MechanicModal mechanic={editTarget} onClose={() => setEditTarget(null)} onSaved={() => { qc.invalidateQueries({ queryKey: ["mechanics"] }); setEditTarget(null); }} />
      )}
    </div>
  );
}

function MechanicModal({ mechanic, onClose, onSaved }: { mechanic?: Mechanic; onClose: () => void; onSaved: () => void }) {
  const isEdit = !!mechanic;
  const [form, setForm] = useState({
    userId: mechanic?.userId ?? "",
    specializations: mechanic?.specializations ?? "",
    rating: String(mechanic?.rating ?? "5.0"),
    totalJobs: String(mechanic?.totalJobs ?? "0"),
    isAvailable: mechanic?.isAvailable !== false,
    bio: mechanic?.bio ?? "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [userSearch, setUserSearch] = useState("");
  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

  const { data: usersData } = useQuery({
    queryKey: ["users"],
    queryFn: () => api.get("/superadmin/users"),
  });
  const users: User[] = (usersData?.users ?? []);
  const selectedUser = users.find(u => u.id === form.userId);
  const filteredUsers = users.filter(u =>
    !userSearch || u.name.toLowerCase().includes(userSearch.toLowerCase()) || u.email.toLowerCase().includes(userSearch.toLowerCase())
  );

  async function handleSubmit() {
    if (!isEdit && !form.userId) { setError("Select a user"); return; }
    setError(""); setLoading(true);
    try {
      if (isEdit) {
        await api.patch(`/superadmin/mechanics/${mechanic!.id}`, {
          specializations: form.specializations || null,
          rating: Number(form.rating),
          totalJobs: Number(form.totalJobs),
          isAvailable: form.isAvailable,
          bio: form.bio || null,
        });
      } else {
        await api.post("/superadmin/mechanics", {
          userId: form.userId,
          specializations: form.specializations || null,
          rating: Number(form.rating),
          isAvailable: form.isAvailable,
          bio: form.bio || null,
        });
      }
      onSaved();
    } catch (e: any) { setError(e.message ?? "Failed"); }
    finally { setLoading(false); }
  }

  return (
    <div className="modal-overlay">
      <div className="modal" style={{ maxWidth: 500 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <h2 style={{ fontFamily: "Rajdhani", fontSize: 20, fontWeight: 700 }}>{isEdit ? "Edit Mechanic" : "Add Mechanic"}</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#555", cursor: "pointer" }}><X size={18} /></button>
        </div>
        {error && <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", background: "rgba(224,32,32,0.08)", border: "1px solid rgba(224,32,32,0.2)", borderRadius: 8, color: "#f87171", fontSize: 13, marginBottom: 16 }}><AlertCircle size={14} />{error}</div>}

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {!isEdit && (
            <div className="form-group">
              <label className="form-label">User Account *</label>
              {selectedUser ? (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", background: "rgba(224,32,32,0.06)", border: "1px solid rgba(224,32,32,0.2)", borderRadius: 8 }}>
                  <div>
                    <div style={{ fontWeight: 500, fontSize: 14 }}>{selectedUser.name}</div>
                    <div style={{ fontSize: 12, color: "#555" }}>{selectedUser.email}</div>
                  </div>
                  <button onClick={() => set("userId", "")} style={{ background: "none", border: "none", color: "#555", cursor: "pointer" }}><X size={14} /></button>
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
                        <div style={{ fontSize: 11, color: "#555" }}>{u.email} · {u.role}</div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Specializations</label>
            <input value={form.specializations} onChange={e => set("specializations", e.target.value)} placeholder="Engine Repair, Brakes, Transmission (comma separated)" />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div className="form-group">
              <label className="form-label">Rating (0–5)</label>
              <input type="number" value={form.rating} onChange={e => set("rating", e.target.value)} min="0" max="5" step="0.1" />
            </div>
            {isEdit && (
              <div className="form-group">
                <label className="form-label">Total Jobs</label>
                <input type="number" value={form.totalJobs} onChange={e => set("totalJobs", e.target.value)} min="0" />
              </div>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">Bio</label>
            <textarea value={form.bio} onChange={e => set("bio", e.target.value)} rows={3} placeholder="Mechanic bio or notes..." />
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <input type="checkbox" id="mech-avail" checked={form.isAvailable} onChange={e => set("isAvailable", e.target.checked)} style={{ width: 16, height: 16 }} />
            <label htmlFor="mech-avail" style={{ fontSize: 13, color: "#aaa", cursor: "pointer" }}>Currently available for jobs</label>
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, marginTop: 24, justifyContent: "flex-end" }}>
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-red" disabled={loading} onClick={handleSubmit} style={{ minWidth: 120, justifyContent: "center" }}>
            {loading ? "Saving..." : isEdit ? "Save Changes" : "Add Mechanic"}
          </button>
        </div>
      </div>
    </div>
  );
}
