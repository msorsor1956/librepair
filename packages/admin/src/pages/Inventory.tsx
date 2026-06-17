import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import { Plus, X, Pencil, Trash2, Star, Eye, EyeOff } from "lucide-react";

type Listing = {
  id: number; title: string; make: string; model: string; year: number;
  price: number; mileage: number; color?: string; condition: string;
  description?: string; videoUrl?: string; photos: string[];
  contactPhone?: string; contactEmail?: string; status: string;
  featured: boolean; published: boolean;
};

const statusBadge: Record<string, string> = { available: "badge-green", sold: "badge-red", reserved: "badge-yellow" };
const conditionBadge: Record<string, string> = { excellent: "badge-green", good: "badge-blue", fair: "badge-yellow" };

export default function InventoryPage() {
  const qc = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [editItem, setEditItem] = useState<Listing | null>(null);
  const [filterPublished, setFilterPublished] = useState<"all" | "published" | "hidden">("all");

  const { data, isLoading } = useQuery({ queryKey: ["inventory"], queryFn: () => api.get("/superadmin/inventory") });

  const addMutation = useMutation({
    mutationFn: (body: any) => api.post("/superadmin/inventory", body),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["inventory"] }); setShowAdd(false); },
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, ...body }: any) => api.patch(`/superadmin/inventory/${id}`, body),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["inventory"] }); setEditItem(null); },
  });
  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/superadmin/inventory/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["inventory"] }),
  });
  const publishMutation = useMutation({
    mutationFn: ({ id, published }: { id: number; published: boolean }) =>
      api.patch(`/superadmin/inventory/${id}`, { published }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["inventory"] }),
  });

  const all: Listing[] = data?.listings ?? [];
  const listings = all.filter(l => {
    if (filterPublished === "published") return l.published;
    if (filterPublished === "hidden") return !l.published;
    return true;
  });

  const publishedCount = all.filter(l => l.published).length;
  const hiddenCount = all.filter(l => !l.published).length;

  return (
    <div style={{ padding: 32 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontFamily: "Rajdhani, sans-serif", fontSize: 24, fontWeight: 700 }}>Inventory</h1>
          <p style={{ color: "#555", fontSize: 13 }}>
            {all.length} total · <span style={{ color: "#22c55e" }}>{publishedCount} published</span> · <span style={{ color: "#555" }}>{hiddenCount} hidden</span>
          </p>
        </div>
        <button className="btn btn-red" onClick={() => setShowAdd(true)}>
          <Plus size={14} /> Add Vehicle
        </button>
      </div>

      {/* Filter tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        {(["all", "published", "hidden"] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilterPublished(f)}
            style={{
              padding: "6px 16px", borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: "pointer",
              background: filterPublished === f ? "#e02020" : "rgba(255,255,255,0.04)",
              border: filterPublished === f ? "1px solid #e02020" : "1px solid rgba(255,255,255,0.07)",
              color: filterPublished === f ? "#fff" : "#888",
            }}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)} {f === "all" ? `(${all.length})` : f === "published" ? `(${publishedCount})` : `(${hiddenCount})`}
          </button>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
        {isLoading ? <div style={{ color: "#555", gridColumn: "1/-1", textAlign: "center", padding: 40 }}>Loading...</div> : (
          listings.map(car => (
            <div key={car.id} style={{
              background: "#111",
              border: car.published ? "1px solid rgba(34,197,94,0.2)" : "1px solid rgba(255,255,255,0.06)",
              borderRadius: 12, overflow: "hidden",
              opacity: car.published ? 1 : 0.75,
            }}>
              {/* Photo */}
              <div style={{ height: 160, background: "#1a1a1a", position: "relative", overflow: "hidden" }}>
                {car.photos?.[0] ? (
                  <img src={car.photos[0]} alt={car.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "#333", fontSize: 13 }}>No photo</div>
                )}
                {car.featured && (
                  <div style={{ position: "absolute", top: 8, left: 8, display: "flex", alignItems: "center", gap: 4, padding: "3px 8px", background: "rgba(245,158,11,0.9)", borderRadius: 6, fontSize: 11, fontWeight: 600, color: "#000" }}>
                    <Star size={10} fill="currentColor" /> Featured
                  </div>
                )}
                {/* Published badge */}
                <div style={{ position: "absolute", bottom: 8, left: 8 }}>
                  <span style={{
                    display: "inline-flex", alignItems: "center", gap: 4,
                    padding: "3px 8px", borderRadius: 6, fontSize: 11, fontWeight: 600,
                    background: car.published ? "rgba(34,197,94,0.9)" : "rgba(80,80,80,0.9)",
                    color: car.published ? "#000" : "#ccc",
                  }}>
                    {car.published ? <><Eye size={10} /> Live</> : <><EyeOff size={10} /> Hidden</>}
                  </span>
                </div>
                <div style={{ position: "absolute", top: 8, right: 8 }}>
                  <span className={`badge ${statusBadge[car.status] ?? "badge-gray"}`}>{car.status}</span>
                </div>
              </div>

              <div style={{ padding: 16 }}>
                <div style={{ fontFamily: "Rajdhani", fontSize: 16, fontWeight: 700, marginBottom: 4 }}>{car.title}</div>
                <div style={{ color: "#555", fontSize: 12, marginBottom: 10 }}>
                  {car.year} · {car.mileage?.toLocaleString() ?? 0} mi · {car.color ?? "—"}
                </div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                  <div style={{ fontSize: 18, fontWeight: 700, color: "#e02020", fontFamily: "Rajdhani" }}>
                    ${car.price.toLocaleString()}
                  </div>
                  <span className={`badge ${conditionBadge[car.condition] ?? "badge-gray"}`}>{car.condition}</span>
                </div>

                {/* Action buttons */}
                <div style={{ display: "flex", gap: 8 }}>
                  {/* Publish / Hide toggle */}
                  <button
                    onClick={() => publishMutation.mutate({ id: car.id, published: !car.published })}
                    disabled={publishMutation.isPending}
                    style={{
                      flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                      padding: "7px 10px", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer",
                      background: car.published ? "rgba(34,197,94,0.1)" : "rgba(224,32,32,0.1)",
                      border: car.published ? "1px solid rgba(34,197,94,0.3)" : "1px solid rgba(224,32,32,0.3)",
                      color: car.published ? "#22c55e" : "#e02020",
                    }}
                  >
                    {car.published ? <><EyeOff size={12} /> Hide</> : <><Eye size={12} /> Publish</>}
                  </button>
                  <button className="btn btn-ghost" style={{ padding: "6px 12px" }} onClick={() => setEditItem(car)}>
                    <Pencil size={12} />
                  </button>
                  <button
                    className="btn btn-danger" style={{ padding: "6px 12px" }}
                    onClick={() => { if (confirm(`Delete ${car.title}?`)) deleteMutation.mutate(car.id); }}
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
        {!isLoading && listings.length === 0 && (
          <div style={{ gridColumn: "1/-1", textAlign: "center", color: "#444", padding: 40 }}>
            {filterPublished === "hidden" ? "No hidden vehicles." : filterPublished === "published" ? "No published vehicles yet." : "No listings yet."}
          </div>
        )}
      </div>

      {showAdd && <ListingModal onClose={() => setShowAdd(false)} onSave={addMutation.mutate} loading={addMutation.isPending} />}
      {editItem && <ListingModal item={editItem} onClose={() => setEditItem(null)} onSave={(d: any) => updateMutation.mutate({ id: editItem.id, ...d })} loading={updateMutation.isPending} />}
    </div>
  );
}

function ListingModal({ item, onClose, onSave, loading }: {
  item?: Listing; onClose: () => void; onSave: (d: any) => void; loading: boolean;
}) {
  const [form, setForm] = useState({
    title: item?.title ?? "",
    make: item?.make ?? "",
    model: item?.model ?? "",
    year: item?.year?.toString() ?? "",
    price: item?.price?.toString() ?? "",
    mileage: item?.mileage?.toString() ?? "0",
    color: item?.color ?? "",
    condition: item?.condition ?? "good",
    description: item?.description ?? "",
    videoUrl: item?.videoUrl ?? "",
    contactPhone: item?.contactPhone ?? "",
    contactEmail: item?.contactEmail ?? "",
    status: item?.status ?? "available",
    featured: item?.featured ?? false,
    published: item?.published ?? false,
    photos: (item?.photos ?? []).join("\n"),
  });
  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

  function handleSave() {
    onSave({
      ...form,
      year: Number(form.year),
      price: Number(form.price),
      mileage: Number(form.mileage),
      photos: form.photos.split("\n").map((s: string) => s.trim()).filter(Boolean),
    });
  }

  return (
    <div className="modal-overlay">
      <div className="modal" style={{ maxWidth: 640 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <h2 style={{ fontFamily: "Rajdhani", fontSize: 20, fontWeight: 700 }}>{item ? "Edit Listing" : "Add Vehicle"}</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#555" }}><X size={18} /></button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          {[
            { k: "title", l: "Listing Title *", p: "2019 Toyota Camry SE", col: "1/-1" },
            { k: "make", l: "Make *", p: "Toyota" },
            { k: "model", l: "Model *", p: "Camry" },
            { k: "year", l: "Year *", p: "2019", type: "number" },
            { k: "price", l: "Price *", p: "15000", type: "number" },
            { k: "mileage", l: "Mileage", p: "45000", type: "number" },
            { k: "color", l: "Color", p: "Silver" },
          ].map(f => (
            <div key={f.k} className="form-group" style={f.col ? { gridColumn: f.col } : {}}>
              <label className="form-label">{f.l}</label>
              <input
                value={(form as any)[f.k]}
                onChange={e => set(f.k, e.target.value)}
                placeholder={f.p}
                type={f.type ?? "text"}
              />
            </div>
          ))}
          <div className="form-group">
            <label className="form-label">Condition</label>
            <select value={form.condition} onChange={e => set("condition", e.target.value)}>
              <option value="excellent">Excellent</option>
              <option value="good">Good</option>
              <option value="fair">Fair</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Status</label>
            <select value={form.status} onChange={e => set("status", e.target.value)}>
              <option value="available">Available</option>
              <option value="reserved">Reserved</option>
              <option value="sold">Sold</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Contact Phone</label>
            <input value={form.contactPhone} onChange={e => set("contactPhone", e.target.value)} placeholder="+1 (555) 000-0000" />
          </div>
          <div className="form-group">
            <label className="form-label">Contact Email</label>
            <input value={form.contactEmail} onChange={e => set("contactEmail", e.target.value)} placeholder="sales@librepair.com" />
          </div>
          <div className="form-group" style={{ gridColumn: "1/-1" }}>
            <label className="form-label">Video URL</label>
            <input value={form.videoUrl} onChange={e => set("videoUrl", e.target.value)} placeholder="https://youtube.com/..." />
          </div>
          <div className="form-group" style={{ gridColumn: "1/-1" }}>
            <label className="form-label">Photo URLs (one per line, up to 9)</label>
            <textarea value={form.photos} onChange={e => set("photos", e.target.value)} rows={4} placeholder={"https://example.com/photo1.jpg\nhttps://example.com/photo2.jpg"} />
          </div>
          <div className="form-group" style={{ gridColumn: "1/-1" }}>
            <label className="form-label">Description</label>
            <textarea value={form.description} onChange={e => set("description", e.target.value)} rows={3} placeholder="Vehicle description..." />
          </div>
          <div className="form-group" style={{ gridColumn: "1/-1", display: "flex", gap: 24 }}>
            <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
              <input type="checkbox" checked={form.featured} onChange={e => set("featured", e.target.checked)} style={{ width: "auto" }} />
              <span style={{ fontSize: 13, color: "#aaa" }}>Mark as Featured</span>
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
              <input type="checkbox" checked={form.published} onChange={e => set("published", e.target.checked)} style={{ width: "auto" }} />
              <span style={{ fontSize: 13, color: "#22c55e" }}>Publish to website</span>
            </label>
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, marginTop: 20, justifyContent: "flex-end" }}>
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-red" disabled={loading} onClick={handleSave}>
            {loading ? "Saving..." : (item ? "Save Changes" : "Add Vehicle")}
          </button>
        </div>
      </div>
    </div>
  );
}
