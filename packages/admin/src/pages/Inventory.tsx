import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, getToken } from "../lib/api";
import {
  Plus, X, Pencil, Trash2, Star, Eye, EyeOff,
  Upload, Link, ImagePlus, Video, Loader2, AlertCircle, Play,
} from "lucide-react";

type Listing = {
  id: number; stockNumber?: string; inventoryId?: string;
  title: string; make: string; model: string; year: number;
  price: number; mileage: number; color?: string; condition: string;
  description?: string; videoUrl?: string; photos: string[]; videos: string[];
  contactPhone?: string; contactEmail?: string; status: string;
  featured: boolean; published: boolean;
};

const statusBadge: Record<string, string> = { available: "badge-green", sold: "badge-red", reserved: "badge-yellow" };
const conditionBadge: Record<string, string> = { excellent: "badge-green", good: "badge-blue", fair: "badge-yellow" };

const API = import.meta.env.VITE_API_URL ?? "https://librepair-backend.onrender.com";

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
                  <img src={car.photos[0]} alt={car.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={e => { const t = e.target as HTMLImageElement; t.style.display="none"; }} />
                ) : (
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "#333", fontSize: 13 }}>No photo</div>
                )}
                {car.featured && (
                  <div style={{ position: "absolute", top: 8, left: 8, display: "flex", alignItems: "center", gap: 4, padding: "3px 8px", background: "rgba(245,158,11,0.9)", borderRadius: 6, fontSize: 11, fontWeight: 600, color: "#000" }}>
                    <Star size={10} fill="currentColor" /> Featured
                  </div>
                )}
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
                <div style={{ position: "absolute", bottom: 8, right: 8, display: "flex", gap: 4 }}>
                  {car.photos?.length > 1 && (
                    <div style={{ padding: "3px 7px", background: "rgba(0,0,0,0.75)", borderRadius: 5, fontSize: 11, color: "#aaa" }}>
                      📷 {car.photos.length}
                    </div>
                  )}
                  {(car as any).videos?.length > 0 && (
                    <div style={{ padding: "3px 7px", background: "rgba(224,32,32,0.8)", borderRadius: 5, fontSize: 11, color: "#fff", fontWeight: 600 }}>
                      ▶ {(car as any).videos.length}
                    </div>
                  )}
                </div>
                <div style={{ position: "absolute", top: 8, right: 8 }}>
                  <span className={`badge ${statusBadge[car.status] ?? "badge-gray"}`}>{car.status}</span>
                </div>
              </div>

              <div style={{ padding: 16 }}>
                <div style={{ fontFamily: "Rajdhani", fontSize: 16, fontWeight: 700, marginBottom: 2 }}>{car.title}</div>
                {(car.stockNumber || car.inventoryId) && (
                  <div style={{ display: "flex", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
                    {car.stockNumber && (
                      <span style={{ fontSize: 10, fontWeight: 700, color: "#e02020", background: "rgba(224,32,32,0.1)", border: "1px solid rgba(224,32,32,0.2)", borderRadius: 4, padding: "2px 6px", letterSpacing: "0.05em" }}>
                        STK# {car.stockNumber}
                      </span>
                    )}
                    {car.inventoryId && (
                      <span style={{ fontSize: 10, fontWeight: 600, color: "#888", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 4, padding: "2px 6px", letterSpacing: "0.04em" }}>
                        ID# {car.inventoryId}
                      </span>
                    )}
                  </div>
                )}
                <div style={{ color: "#555", fontSize: 12, marginBottom: 10 }}>
                  {car.year} · {car.mileage?.toLocaleString() ?? 0} mi · {car.color ?? "—"}
                </div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                  <div style={{ fontSize: 18, fontWeight: 700, color: "#e02020", fontFamily: "Rajdhani" }}>
                    ${car.price.toLocaleString()}
                  </div>
                  <span className={`badge ${conditionBadge[car.condition] ?? "badge-gray"}`}>{car.condition}</span>
                </div>

                <div style={{ display: "flex", gap: 8 }}>
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

// ─── Upload helper ─────────────────────────────────────────────────────────────
async function uploadToR2(file: File): Promise<{ url: string; mediaType: "image" | "video" }> {
  const fd = new FormData();
  fd.append("file", file);
  const res = await fetch(`${API}/api/superadmin/inventory/upload-image`, {
    method: "POST",
    headers: { Authorization: `Bearer ${getToken()}` },
    body: fd,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message ?? "Upload failed");
  }
  return res.json();
}

// ─── Photo Uploader ────────────────────────────────────────────────────────────
function PhotoUploader({ photos, onChange }: { photos: string[]; onChange: (urls: string[]) => void }) {
  const [uploading, setUploading] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const [urlError, setUrlError] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const IMAGE_TYPES = "image/jpeg,image/jpg,image/png,image/webp,image/heic,image/heif";

  async function uploadFiles(files: File[]) {
    const remaining = 9 - photos.length;
    const toUpload = files.slice(0, remaining);
    if (!toUpload.length) return;
    setUploading(true);
    const results: string[] = [];
    for (const file of toUpload) {
      try {
        const { url } = await uploadToR2(file);
        results.push(url);
      } catch (e: any) { alert(e.message); }
    }
    onChange([...photos, ...results].slice(0, 9));
    setUploading(false);
  }

  async function replacePhoto(file: File, index: number) {
    setUploading(true);
    try {
      const { url } = await uploadToR2(file);
      const updated = [...photos];
      updated[index] = url;
      onChange(updated);
    } catch (e: any) { alert(e.message); }
    setUploading(false);
  }

  function addWebUrl() {
    setUrlError("");
    let url = urlInput.trim();
    if (!url) return;
    try { new URL(url); } catch { setUrlError("Invalid URL"); return; }
    const unsplashPage = url.match(/unsplash\.com\/photos\/[^/]+-([a-zA-Z0-9_-]+)$/);
    if (unsplashPage) url = `https://images.unsplash.com/photo-${unsplashPage[1]}?auto=format&fit=crop&w=1200&q=80`;
    const looksLikeImage = /\.(jpe?g|png|webp|gif|avif|svg)(\?|$)/i.test(url) || /images\.unsplash\.com/.test(url) || /cdn\.|cloudflare\.|r2\.|s3\.|storage\.|imgur\.com|pexels\.com\/photo/.test(url);
    if (!looksLikeImage) { setUrlError("Paste a direct image URL (.jpg, .png, .webp, etc.)"); return; }
    if (photos.length >= 9) { setUrlError("Max 9 photos"); return; }
    onChange([...photos, url]);
    setUrlInput("");
  }

  function move(from: number, to: number) {
    const arr = [...photos];
    const [item] = arr.splice(from, 1);
    arr.splice(to, 0, item);
    onChange(arr);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <label className="form-label" style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 0 }}>
        <ImagePlus size={12} /> Photos
        <span style={{ color: "#555", fontWeight: 400 }}>({photos.length}/9) · JPG, PNG, WebP — any device</span>
      </label>

      {photos.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
          {photos.map((url, i) => (
            <div key={i} style={{ position: "relative", aspectRatio: "4/3", borderRadius: 8, overflow: "hidden", background: "#1a1a1a", border: i === 0 ? "2px solid #e02020" : "1px solid rgba(255,255,255,0.08)" }}>
              <img src={url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={e => { const t = e.target as HTMLImageElement; t.style.display = "none"; }} />
              {i === 0 && <div style={{ position: "absolute", top: 4, left: 4, background: "#e02020", color: "#fff", fontSize: 9, fontWeight: 700, padding: "2px 5px", borderRadius: 4 }}>COVER</div>}
              <div style={{ position: "absolute", top: 4, right: 4, display: "flex", gap: 3 }}>
                {i > 0 && <button onClick={() => move(i, i - 1)} style={{ width: 20, height: 20, background: "rgba(0,0,0,0.75)", border: "none", borderRadius: 4, color: "#fff", cursor: "pointer", fontSize: 11, display: "flex", alignItems: "center", justifyContent: "center" }}>‹</button>}
                {i < photos.length - 1 && <button onClick={() => move(i, i + 1)} style={{ width: 20, height: 20, background: "rgba(0,0,0,0.75)", border: "none", borderRadius: 4, color: "#fff", cursor: "pointer", fontSize: 11, display: "flex", alignItems: "center", justifyContent: "center" }}>›</button>}
                <button onClick={() => onChange(photos.filter((_, idx) => idx !== i))} style={{ width: 20, height: 20, background: "rgba(200,30,30,0.85)", border: "none", borderRadius: 4, color: "#fff", cursor: "pointer", fontSize: 12, display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
              </div>
              <label style={{ position: "absolute", bottom: 4, right: 4, width: 22, height: 22, background: "rgba(0,0,0,0.7)", borderRadius: 4, color: "#aaa", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Upload size={11} />
                <input type="file" accept={IMAGE_TYPES} capture="environment" hidden onChange={e => e.target.files?.[0] && replacePhoto(e.target.files[0], i)} />
              </label>
            </div>
          ))}
        </div>
      )}

      {photos.length < 9 && (
        <div
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={e => { e.preventDefault(); setDragOver(false); if (e.dataTransfer.files) uploadFiles(Array.from(e.dataTransfer.files)); }}
          onClick={() => fileRef.current?.click()}
          style={{ border: `2px dashed ${dragOver ? "#e02020" : "rgba(255,255,255,0.1)"}`, borderRadius: 10, padding: "18px 16px", textAlign: "center", cursor: "pointer", background: dragOver ? "rgba(224,32,32,0.05)" : "rgba(255,255,255,0.02)", transition: "all 0.15s" }}
        >
          {uploading ? (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, color: "#888" }}>
              <Loader2 size={16} className="spin" /> Uploading...
            </div>
          ) : (
            <>
              <ImagePlus size={22} style={{ color: "#555", marginBottom: 6 }} />
              <div style={{ fontSize: 13, color: "#888" }}>Tap to pick from <span style={{ color: "#e02020" }}>camera or gallery</span>, or drag & drop</div>
              <div style={{ fontSize: 11, color: "#555", marginTop: 4 }}>JPG · PNG · WebP · Max 25MB · up to {9 - photos.length} more</div>
            </>
          )}
          <input ref={fileRef} type="file" accept={IMAGE_TYPES} capture="environment" multiple hidden onChange={e => e.target.files && uploadFiles(Array.from(e.target.files))} />
        </div>
      )}

      <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
        <div style={{ flex: 1, position: "relative" }}>
          <Link size={11} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#555" }} />
          <input value={urlInput} onChange={e => { setUrlInput(e.target.value); setUrlError(""); }} onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addWebUrl())} placeholder="Or paste a direct image URL" style={{ paddingLeft: 28, fontSize: 12 }} disabled={photos.length >= 9} />
          {urlError && <div style={{ display: "flex", alignItems: "center", gap: 4, color: "#f87171", fontSize: 11, marginTop: 3 }}><AlertCircle size={10} />{urlError}</div>}
        </div>
        <button type="button" onClick={addWebUrl} disabled={!urlInput.trim() || photos.length >= 9} className="btn btn-ghost" style={{ padding: "8px 14px", fontSize: 12, whiteSpace: "nowrap" }}>Add URL</button>
      </div>
    </div>
  );
}

// ─── Video Uploader ────────────────────────────────────────────────────────────
function VideoUploader({ videos, onChange }: { videos: string[]; onChange: (urls: string[]) => void }) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const VIDEO_TYPES = "video/mp4,video/quicktime,video/webm,video/x-msvideo,video/mpeg,.mp4,.mov,.webm,.avi";

  async function uploadVideos(files: File[]) {
    const remaining = 5 - videos.length;
    const toUpload = files.slice(0, remaining);
    if (!toUpload.length) return;
    setUploading(true);
    const results: string[] = [];
    for (let i = 0; i < toUpload.length; i++) {
      const f = toUpload[i];
      setProgress(`Uploading ${i + 1}/${toUpload.length} — ${f.name} (${(f.size / 1024 / 1024).toFixed(1)}MB)...`);
      try {
        const { url } = await uploadToR2(f);
        results.push(url);
      } catch (e: any) { alert(e.message); }
    }
    onChange([...videos, ...results].slice(0, 5));
    setUploading(false);
    setProgress("");
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <label className="form-label" style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 0 }}>
        <Video size={12} /> Videos
        <span style={{ color: "#555", fontWeight: 400 }}>({videos.length}/5) · MP4, MOV, WebM — any device</span>
      </label>

      {videos.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {videos.map((url, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, background: "#1a1a1a", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, padding: "8px 12px" }}>
              <div style={{ width: 32, height: 32, background: "rgba(224,32,32,0.15)", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Play size={14} style={{ color: "#e02020" }} fill="#e02020" />
              </div>
              <div style={{ flex: 1, overflow: "hidden" }}>
                <div style={{ fontSize: 12, color: "#aaa", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{url.split("/").pop()}</div>
                <div style={{ fontSize: 10, color: "#555", marginTop: 2 }}>Video {i + 1}</div>
              </div>
              <a href={url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, color: "#e02020", textDecoration: "none" }}>Preview</a>
              <button onClick={() => onChange(videos.filter((_, idx) => idx !== i))} style={{ width: 22, height: 22, background: "rgba(200,30,30,0.15)", border: "1px solid rgba(200,30,30,0.3)", borderRadius: 4, color: "#e02020", cursor: "pointer", fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
            </div>
          ))}
        </div>
      )}

      {videos.length < 5 && (
        <div
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={e => { e.preventDefault(); setDragOver(false); if (e.dataTransfer.files) uploadVideos(Array.from(e.dataTransfer.files)); }}
          onClick={() => fileRef.current?.click()}
          style={{ border: `2px dashed ${dragOver ? "#e02020" : "rgba(255,255,255,0.1)"}`, borderRadius: 10, padding: "18px 16px", textAlign: "center", cursor: "pointer", background: dragOver ? "rgba(224,32,32,0.05)" : "rgba(255,255,255,0.02)", transition: "all 0.15s" }}
        >
          {uploading ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, color: "#888" }}>
              <Loader2 size={16} className="spin" />
              <div style={{ fontSize: 12 }}>{progress}</div>
            </div>
          ) : (
            <>
              <Video size={22} style={{ color: "#555", marginBottom: 6 }} />
              <div style={{ fontSize: 13, color: "#888" }}>Tap to pick from <span style={{ color: "#e02020" }}>camera or gallery</span>, or drag & drop</div>
              <div style={{ fontSize: 11, color: "#555", marginTop: 4 }}>MP4 · MOV · WebM · Max 200MB · up to {5 - videos.length} more</div>
            </>
          )}
          <input ref={fileRef} type="file" accept={VIDEO_TYPES} multiple hidden onChange={e => e.target.files && uploadVideos(Array.from(e.target.files))} />
        </div>
      )}
    </div>
  );
}

// ─── Listing Modal ────────────────────────────────────────────────────────────
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
    photos: item?.photos ?? [],
    videos: item?.videos ?? [],
  });
  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

  function handleSave() {
    onSave({ ...form, year: Number(form.year), price: Number(form.price), mileage: Number(form.mileage) });
  }

  return (
    <div className="modal-overlay">
      <div className="modal" style={{ maxWidth: 680, maxHeight: "92vh", overflowY: "auto" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: item?.stockNumber || item?.inventoryId ? 8 : 20 }}>
          <h2 style={{ fontFamily: "Rajdhani", fontSize: 20, fontWeight: 700 }}>{item ? "Edit Listing" : "Add Vehicle"}</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#555" }}><X size={18} /></button>
        </div>

        {(item?.stockNumber || item?.inventoryId) && (
          <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
            {item.stockNumber && (
              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <span style={{ fontSize: 10, color: "#555", textTransform: "uppercase", letterSpacing: "0.08em" }}>Stock #</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: "#e02020", fontFamily: "Rajdhani", background: "rgba(224,32,32,0.08)", border: "1px solid rgba(224,32,32,0.2)", borderRadius: 6, padding: "4px 12px" }}>{item.stockNumber}</span>
              </div>
            )}
            {item.inventoryId && (
              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <span style={{ fontSize: 10, color: "#555", textTransform: "uppercase", letterSpacing: "0.08em" }}>Inventory ID</span>
                <span style={{ fontSize: 14, fontWeight: 600, color: "#aaa", fontFamily: "Rajdhani", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 6, padding: "4px 12px" }}>{item.inventoryId}</span>
              </div>
            )}
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          {[
            { k: "title", l: "Listing Title *", p: "2019 Toyota Camry SE", col: "1/-1" },
            { k: "make", l: "Make *", p: "Toyota" },
            { k: "model", l: "Model *", p: "Camry" },
            { k: "year", l: "Year *", p: "2019", type: "number" },
            { k: "price", l: "Price ($) *", p: "15000", type: "number" },
            { k: "mileage", l: "Mileage", p: "45000", type: "number" },
            { k: "color", l: "Color", p: "Silver" },
          ].map(f => (
            <div key={f.k} className="form-group" style={f.col ? { gridColumn: f.col } : {}}>
              <label className="form-label">{f.l}</label>
              <input value={(form as any)[f.k]} onChange={e => set(f.k, e.target.value)} placeholder={f.p} type={f.type ?? "text"} />
            </div>
          ))}
          <div className="form-group">
            <label className="form-label">Condition</label>
            <select value={form.condition} onChange={e => set("condition", e.target.value)}>
              <option value="excellent">Excellent</option><option value="good">Good</option><option value="fair">Fair</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Status</label>
            <select value={form.status} onChange={e => set("status", e.target.value)}>
              <option value="available">Available</option><option value="reserved">Reserved</option><option value="sold">Sold</option>
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
            <label className="form-label">YouTube / Video Embed URL (optional)</label>
            <input value={form.videoUrl} onChange={e => set("videoUrl", e.target.value)} placeholder="https://youtube.com/watch?v=..." />
          </div>

          {/* Photo uploader */}
          <div className="form-group" style={{ gridColumn: "1/-1" }}>
            <PhotoUploader photos={form.photos} onChange={urls => set("photos", urls)} />
          </div>

          {/* Video uploader */}
          <div className="form-group" style={{ gridColumn: "1/-1" }}>
            <VideoUploader videos={form.videos} onChange={urls => set("videos", urls)} />
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
