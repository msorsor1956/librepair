import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import { Wrench, Plus, Search, RefreshCw, Edit2, Trash2, X, AlertCircle, ToggleLeft, ToggleRight } from "lucide-react";

type Service = {
  id: number;
  name: string;
  description?: string;
  category: string;
  basePrice: number;
  durationMinutes?: number;
  isActive: boolean;
  createdAt?: string;
};

const categoryColors: Record<string, string> = {
  "oil-change": "#f59e0b",
  "tire": "#3b82f6",
  "brake": "#ef4444",
  "engine": "#8b5cf6",
  "transmission": "#06b6d4",
  "ac": "#10b981",
  "diagnostic": "#f97316",
  "electrical": "#eab308",
};

export default function ServicesPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [editTarget, setEditTarget] = useState<Service | null>(null);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["services"],
    queryFn: () => api.get("/superadmin/services"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/superadmin/services/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["services"] }),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: number; isActive: boolean }) =>
      api.patch(`/superadmin/services/${id}`, { isActive }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["services"] }),
  });

  const services: Service[] = data?.services ?? [];
  const filtered = services.filter(s => {
    const q = search.toLowerCase();
    return !search || s.name.toLowerCase().includes(q) || s.category.toLowerCase().includes(q);
  });

  const categories = [...new Set(services.map(s => s.category))];

  return (
    <div style={{ padding: 32 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontFamily: "Rajdhani, sans-serif", fontSize: 24, fontWeight: 700 }}>Services</h1>
          <p style={{ color: "#555", fontSize: 13 }}>{services.length} total · {services.filter(s => s.isActive).length} active</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn btn-ghost" onClick={() => refetch()} style={{ padding: "8px 14px" }}><RefreshCw size={14} /></button>
          <button className="btn btn-red" onClick={() => setShowCreate(true)}><Plus size={14} /> Add Service</button>
        </div>
      </div>

      <div style={{ position: "relative", marginBottom: 16, maxWidth: 380 }}>
        <Search size={13} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#555" }} />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search services..." style={{ paddingLeft: 34 }} />
      </div>

      <div style={{ background: "#111", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, overflow: "hidden" }}>
        {isLoading ? (
          <div style={{ padding: 48, textAlign: "center", color: "#555" }}>Loading...</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 48, textAlign: "center", color: "#444" }}>No services found.</div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table>
              <thead>
                <tr>
                  <th>Service</th>
                  <th>Category</th>
                  <th>Base Price</th>
                  <th>Duration</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(s => {
                  const catColor = categoryColors[s.category] ?? "#888";
                  return (
                    <tr key={s.id}>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <div style={{ width: 32, height: 32, borderRadius: 8, background: `${catColor}18`, border: `1px solid ${catColor}30`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                            <Wrench size={14} color={catColor} />
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, color: "#e5e5e5", fontSize: 14 }}>{s.name}</div>
                            {s.description && <div style={{ fontSize: 11, color: "#555", maxWidth: 260, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.description}</div>}
                          </div>
                        </div>
                      </td>
                      <td>
                        <span style={{ padding: "3px 8px", borderRadius: 6, fontSize: 11, fontWeight: 600, background: `${catColor}15`, color: catColor, border: `1px solid ${catColor}25` }}>
                          {s.category.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase())}
                        </span>
                      </td>
                      <td style={{ color: "#4ade80", fontWeight: 600, fontSize: 14 }}>${s.basePrice.toFixed(2)}</td>
                      <td style={{ color: "#aaa", fontSize: 13 }}>{s.durationMinutes ? `${s.durationMinutes} min` : "—"}</td>
                      <td>
                        <button
                          onClick={() => toggleMutation.mutate({ id: s.id, isActive: !s.isActive })}
                          style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 5, fontSize: 12 }}
                        >
                          {s.isActive
                            ? <><ToggleRight size={18} color="#4ade80" /><span style={{ color: "#4ade80" }}>Active</span></>
                            : <><ToggleLeft size={18} color="#555" /><span style={{ color: "#555" }}>Inactive</span></>
                          }
                        </button>
                      </td>
                      <td>
                        <div style={{ display: "flex", gap: 6 }}>
                          <button className="btn btn-ghost" onClick={() => setEditTarget(s)} style={{ padding: "5px 10px", fontSize: 11 }}>
                            <Edit2 size={11} /> Edit
                          </button>
                          <button
                            className="btn btn-ghost"
                            onClick={() => { if (confirm(`Delete "${s.name}"?`)) deleteMutation.mutate(s.id); }}
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
        <ServiceModal categories={categories} onClose={() => setShowCreate(false)} onSaved={() => { qc.invalidateQueries({ queryKey: ["services"] }); setShowCreate(false); }} />
      )}
      {editTarget && (
        <ServiceModal service={editTarget} categories={categories} onClose={() => setEditTarget(null)} onSaved={() => { qc.invalidateQueries({ queryKey: ["services"] }); setEditTarget(null); }} />
      )}
    </div>
  );
}

function ServiceModal({ service, categories, onClose, onSaved }: {
  service?: Service; categories: string[]; onClose: () => void; onSaved: () => void;
}) {
  const isEdit = !!service;
  const [form, setForm] = useState({
    name: service?.name ?? "",
    description: service?.description ?? "",
    category: service?.category ?? "",
    basePrice: String(service?.basePrice ?? ""),
    durationMinutes: String(service?.durationMinutes ?? "60"),
    isActive: service?.isActive !== false,
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

  const knownCategories = ["oil-change", "tire", "brake", "engine", "transmission", "ac", "diagnostic", "electrical", "body", "inspection", "other"];
  const allCats = [...new Set([...knownCategories, ...categories])];

  async function handleSubmit() {
    if (!form.name || !form.category || !form.basePrice) { setError("Name, category, base price required"); return; }
    setError(""); setLoading(true);
    try {
      if (isEdit) {
        await api.patch(`/superadmin/services/${service!.id}`, {
          name: form.name, description: form.description || null, category: form.category,
          basePrice: Number(form.basePrice), durationMinutes: Number(form.durationMinutes), isActive: form.isActive,
        });
      } else {
        await api.post("/superadmin/services", {
          name: form.name, description: form.description || null, category: form.category,
          basePrice: Number(form.basePrice), durationMinutes: Number(form.durationMinutes), isActive: form.isActive,
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
          <h2 style={{ fontFamily: "Rajdhani", fontSize: 20, fontWeight: 700 }}>{isEdit ? "Edit Service" : "New Service"}</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#555", cursor: "pointer" }}><X size={18} /></button>
        </div>
        {error && <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", background: "rgba(224,32,32,0.08)", border: "1px solid rgba(224,32,32,0.2)", borderRadius: 8, color: "#f87171", fontSize: 13, marginBottom: 16 }}><AlertCircle size={14} />{error}</div>}

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div className="form-group">
            <label className="form-label">Service Name *</label>
            <input value={form.name} onChange={e => set("name", e.target.value)} placeholder="e.g. Oil Change & Filter" />
          </div>
          <div className="form-group">
            <label className="form-label">Category *</label>
            <select value={form.category} onChange={e => set("category", e.target.value)}>
              <option value="">— Select category —</option>
              {allCats.map(c => <option key={c} value={c}>{c.replace(/-/g, " ").replace(/\b\w/g, x => x.toUpperCase())}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea value={form.description} onChange={e => set("description", e.target.value)} rows={3} placeholder="Brief description..." />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div className="form-group">
              <label className="form-label">Base Price ($) *</label>
              <input type="number" value={form.basePrice} onChange={e => set("basePrice", e.target.value)} placeholder="49.99" min="0" step="0.01" />
            </div>
            <div className="form-group">
              <label className="form-label">Duration (minutes)</label>
              <input type="number" value={form.durationMinutes} onChange={e => set("durationMinutes", e.target.value)} placeholder="60" min="1" />
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <input type="checkbox" id="svc-active" checked={form.isActive} onChange={e => set("isActive", e.target.checked)} style={{ width: 16, height: 16 }} />
            <label htmlFor="svc-active" style={{ fontSize: 13, color: "#aaa", cursor: "pointer" }}>Active (visible to customers)</label>
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, marginTop: 24, justifyContent: "flex-end" }}>
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-red" disabled={loading} onClick={handleSubmit} style={{ minWidth: 120, justifyContent: "center" }}>
            {loading ? "Saving..." : isEdit ? "Save Changes" : "Add Service"}
          </button>
        </div>
      </div>
    </div>
  );
}
