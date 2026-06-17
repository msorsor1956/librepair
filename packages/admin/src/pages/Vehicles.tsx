import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import { Car, Plus, Search, RefreshCw, Edit2, Trash2, X, AlertCircle } from "lucide-react";

type Vehicle = {
  id: number;
  userId: string;
  ownerName?: string;
  ownerEmail?: string;
  make: string;
  model: string;
  year: number;
  vin?: string;
  licensePlate?: string;
  color?: string;
  mileage?: number;
  lastServiceDate?: string;
  createdAt?: string;
};

type User = { id: string; name: string; email: string };

export default function VehiclesPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [editTarget, setEditTarget] = useState<Vehicle | null>(null);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["vehicles"],
    queryFn: () => api.get("/superadmin/vehicles"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/superadmin/vehicles/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["vehicles"] }),
  });

  const vehicles: Vehicle[] = data?.vehicles ?? [];
  const filtered = vehicles.filter(v => {
    const q = search.toLowerCase();
    return !search ||
      `${v.make} ${v.model}`.toLowerCase().includes(q) ||
      (v.ownerName ?? "").toLowerCase().includes(q) ||
      (v.vin ?? "").toLowerCase().includes(q) ||
      (v.licensePlate ?? "").toLowerCase().includes(q);
  });

  return (
    <div style={{ padding: 32 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontFamily: "Rajdhani, sans-serif", fontSize: 24, fontWeight: 700 }}>Vehicles</h1>
          <p style={{ color: "#555", fontSize: 13 }}>{vehicles.length} registered vehicles</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn btn-ghost" onClick={() => refetch()} style={{ padding: "8px 14px" }}><RefreshCw size={14} /></button>
          <button className="btn btn-red" onClick={() => setShowCreate(true)}><Plus size={14} /> Add Vehicle</button>
        </div>
      </div>

      <div style={{ position: "relative", marginBottom: 16, maxWidth: 380 }}>
        <Search size={13} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#555" }} />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by owner, make, VIN, plate..." style={{ paddingLeft: 34 }} />
      </div>

      <div style={{ background: "#111", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, overflow: "hidden" }}>
        {isLoading ? (
          <div style={{ padding: 48, textAlign: "center", color: "#555" }}>Loading...</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 48, textAlign: "center", color: "#444" }}>No vehicles found.</div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table>
              <thead>
                <tr>
                  <th>Vehicle</th>
                  <th>Owner</th>
                  <th>VIN / Plate</th>
                  <th>Color</th>
                  <th>Mileage</th>
                  <th>Last Service</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(v => (
                  <tr key={v.id}>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(224,32,32,0.1)", border: "1px solid rgba(224,32,32,0.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          <Car size={14} color="#e02020" />
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, color: "#e5e5e5", fontSize: 14 }}>{v.year} {v.make} {v.model}</div>
                          <div style={{ fontSize: 11, color: "#555" }}>ID #{v.id}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 500, color: "#e5e5e5", fontSize: 13 }}>{v.ownerName ?? "—"}</div>
                      <div style={{ fontSize: 11, color: "#555" }}>{v.ownerEmail ?? ""}</div>
                    </td>
                    <td>
                      {v.vin && <div style={{ fontSize: 12, color: "#aaa", fontFamily: "monospace" }}>{v.vin}</div>}
                      {v.licensePlate && <div style={{ fontSize: 12, color: "#777" }}>{v.licensePlate}</div>}
                      {!v.vin && !v.licensePlate && <span style={{ color: "#333" }}>—</span>}
                    </td>
                    <td style={{ color: "#aaa", fontSize: 13 }}>{v.color ?? "—"}</td>
                    <td style={{ color: "#aaa", fontSize: 13 }}>{v.mileage != null ? v.mileage.toLocaleString() + " mi" : "—"}</td>
                    <td style={{ color: "#aaa", fontSize: 13 }}>
                      {v.lastServiceDate ? new Date(v.lastServiceDate).toLocaleDateString() : "—"}
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button className="btn btn-ghost" onClick={() => setEditTarget(v)} style={{ padding: "5px 10px", fontSize: 11 }}>
                          <Edit2 size={11} /> Edit
                        </button>
                        <button
                          className="btn btn-ghost"
                          onClick={() => { if (confirm("Delete this vehicle?")) deleteMutation.mutate(v.id); }}
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
        <VehicleModal
          onClose={() => setShowCreate(false)}
          onSaved={() => { qc.invalidateQueries({ queryKey: ["vehicles"] }); setShowCreate(false); }}
        />
      )}
      {editTarget && (
        <VehicleModal
          vehicle={editTarget}
          onClose={() => setEditTarget(null)}
          onSaved={() => { qc.invalidateQueries({ queryKey: ["vehicles"] }); setEditTarget(null); }}
        />
      )}
    </div>
  );
}

function VehicleModal({ vehicle, onClose, onSaved }: { vehicle?: Vehicle; onClose: () => void; onSaved: () => void }) {
  const isEdit = !!vehicle;
  const [form, setForm] = useState({
    userId: vehicle?.userId ?? "",
    make: vehicle?.make ?? "",
    model: vehicle?.model ?? "",
    year: String(vehicle?.year ?? new Date().getFullYear()),
    vin: vehicle?.vin ?? "",
    licensePlate: vehicle?.licensePlate ?? "",
    color: vehicle?.color ?? "",
    mileage: String(vehicle?.mileage ?? ""),
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [userSearch, setUserSearch] = useState("");

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const { data: usersData } = useQuery({
    queryKey: ["users"],
    queryFn: () => api.get("/superadmin/users"),
  });
  const users: User[] = usersData?.users ?? [];
  const selectedUser = users.find(u => u.id === form.userId);
  const filteredUsers = users.filter(u =>
    !userSearch || u.name.toLowerCase().includes(userSearch.toLowerCase()) || u.email.toLowerCase().includes(userSearch.toLowerCase())
  );

  async function handleSubmit() {
    if (!isEdit && !form.userId) { setError("Select an owner"); return; }
    if (!form.make || !form.model || !form.year) { setError("Make, model, and year are required"); return; }
    setError(""); setLoading(true);
    try {
      if (isEdit) {
        await api.patch(`/superadmin/vehicles/${vehicle!.id}`, {
          make: form.make, model: form.model, year: Number(form.year),
          vin: form.vin || null, licensePlate: form.licensePlate || null,
          color: form.color || null, mileage: form.mileage ? Number(form.mileage) : 0,
        });
      } else {
        await api.post("/superadmin/vehicles", {
          userId: form.userId, make: form.make, model: form.model, year: Number(form.year),
          vin: form.vin || null, licensePlate: form.licensePlate || null,
          color: form.color || null, mileage: form.mileage ? Number(form.mileage) : 0,
        });
      }
      onSaved();
    } catch (e: any) { setError(e.message ?? "Failed"); }
    finally { setLoading(false); }
  }

  return (
    <div className="modal-overlay">
      <div className="modal" style={{ maxWidth: 520 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <h2 style={{ fontFamily: "Rajdhani", fontSize: 20, fontWeight: 700 }}>{isEdit ? "Edit Vehicle" : "Add Vehicle"}</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#555", cursor: "pointer" }}><X size={18} /></button>
        </div>
        {error && <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", background: "rgba(224,32,32,0.08)", border: "1px solid rgba(224,32,32,0.2)", borderRadius: 8, color: "#f87171", fontSize: 13, marginBottom: 16 }}><AlertCircle size={14} />{error}</div>}

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {!isEdit && (
            <div className="form-group">
              <label className="form-label">Owner *</label>
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
                  <div style={{ maxHeight: 160, overflowY: "auto", background: "#0d0d0d", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 8 }}>
                    {filteredUsers.slice(0, 6).map(u => (
                      <div key={u.id} onClick={() => { set("userId", u.id); setUserSearch(""); }} style={{ padding: "8px 14px", cursor: "pointer", borderBottom: "1px solid rgba(255,255,255,0.04)" }}
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

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 80px", gap: 12 }}>
            <div className="form-group">
              <label className="form-label">Make *</label>
              <input value={form.make} onChange={e => set("make", e.target.value)} placeholder="Toyota" />
            </div>
            <div className="form-group">
              <label className="form-label">Model *</label>
              <input value={form.model} onChange={e => set("model", e.target.value)} placeholder="Camry" />
            </div>
            <div className="form-group">
              <label className="form-label">Year *</label>
              <input type="number" value={form.year} onChange={e => set("year", e.target.value)} placeholder="2020" />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div className="form-group">
              <label className="form-label">VIN</label>
              <input value={form.vin} onChange={e => set("vin", e.target.value)} placeholder="1HGCM82633A004352" />
            </div>
            <div className="form-group">
              <label className="form-label">License Plate</label>
              <input value={form.licensePlate} onChange={e => set("licensePlate", e.target.value)} placeholder="ABC-1234" />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div className="form-group">
              <label className="form-label">Color</label>
              <input value={form.color} onChange={e => set("color", e.target.value)} placeholder="Silver" />
            </div>
            <div className="form-group">
              <label className="form-label">Mileage</label>
              <input type="number" value={form.mileage} onChange={e => set("mileage", e.target.value)} placeholder="45000" />
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, marginTop: 24, justifyContent: "flex-end" }}>
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-red" disabled={loading} onClick={handleSubmit} style={{ minWidth: 120, justifyContent: "center" }}>
            {loading ? "Saving..." : isEdit ? "Save Changes" : "Add Vehicle"}
          </button>
        </div>
      </div>
    </div>
  );
}
