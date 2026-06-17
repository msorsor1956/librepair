import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import { Star, Search, RefreshCw, Trash2 } from "lucide-react";

type Review = {
  id: number;
  rating: number;
  comment?: string;
  createdAt?: string;
  appointmentId?: number;
  customerId?: string;
  customerName?: string;
  mechanicId?: number;
};

function StarRating({ rating }: { rating: number }) {
  return (
    <div style={{ display: "flex", gap: 2 }}>
      {[1,2,3,4,5].map(i => (
        <Star key={i} size={13} fill={i <= rating ? "#fbbf24" : "none"} color={i <= rating ? "#fbbf24" : "#333"} />
      ))}
    </div>
  );
}

export default function ReviewsPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [ratingFilter, setRatingFilter] = useState("all");

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["reviews"],
    queryFn: () => api.get("/superadmin/reviews"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/superadmin/reviews/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["reviews"] }),
  });

  const reviews: Review[] = data?.reviews ?? [];
  const filtered = reviews.filter(r => {
    const matchRating = ratingFilter === "all" || r.rating === Number(ratingFilter);
    const q = search.toLowerCase();
    const matchSearch = !search ||
      (r.customerName ?? "").toLowerCase().includes(q) ||
      (r.comment ?? "").toLowerCase().includes(q);
    return matchRating && matchSearch;
  });

  const avg = reviews.length
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : "—";

  const dist: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  reviews.forEach(r => { if (dist[r.rating] !== undefined) dist[r.rating]++; });

  return (
    <div style={{ padding: 32 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontFamily: "Rajdhani, sans-serif", fontSize: 24, fontWeight: 700 }}>Reviews</h1>
          <p style={{ color: "#555", fontSize: 13 }}>{reviews.length} total · avg {avg} ★</p>
        </div>
        <button className="btn btn-ghost" onClick={() => refetch()} style={{ padding: "8px 14px" }}><RefreshCw size={14} /></button>
      </div>

      {/* Summary cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))", gap: 10, marginBottom: 24 }}>
        {[5,4,3,2,1].map(n => (
          <div key={n} style={{ background: "#111", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 10, padding: "14px 16px", cursor: "pointer", borderColor: ratingFilter === String(n) ? "rgba(251,191,36,0.4)" : undefined }}
            onClick={() => setRatingFilter(ratingFilter === String(n) ? "all" : String(n))}>
            <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 4 }}>
              <Star size={12} fill="#fbbf24" color="#fbbf24" />
              <span style={{ fontSize: 13, fontWeight: 700, color: "#e5e5e5" }}>{n}</span>
            </div>
            <div style={{ fontSize: 20, fontWeight: 700, color: "#fbbf24" }}>{dist[n]}</div>
          </div>
        ))}
      </div>

      <div style={{ position: "relative", marginBottom: 16, maxWidth: 380 }}>
        <Search size={13} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#555" }} />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by customer or comment..." style={{ paddingLeft: 34 }} />
      </div>

      <div style={{ background: "#111", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, overflow: "hidden" }}>
        {isLoading ? (
          <div style={{ padding: 48, textAlign: "center", color: "#555" }}>Loading...</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 48, textAlign: "center", color: "#444" }}>No reviews found.</div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table>
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Rating</th>
                  <th>Comment</th>
                  <th>Appointment</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(r => (
                  <tr key={r.id}>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ width: 30, height: 30, borderRadius: "50%", background: "#1e3a8a", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "#93c5fd", flexShrink: 0 }}>
                          {(r.customerName ?? "?")[0].toUpperCase()}
                        </div>
                        <span style={{ fontSize: 13, fontWeight: 500, color: "#e5e5e5" }}>{r.customerName ?? "—"}</span>
                      </div>
                    </td>
                    <td><StarRating rating={r.rating} /></td>
                    <td style={{ maxWidth: 300 }}>
                      {r.comment
                        ? <span style={{ fontSize: 13, color: "#aaa", fontStyle: "italic" }}>"{r.comment}"</span>
                        : <span style={{ color: "#333", fontSize: 12 }}>No comment</span>}
                    </td>
                    <td style={{ color: "#555", fontSize: 12 }}>
                      {r.appointmentId ? `#${r.appointmentId}` : "—"}
                    </td>
                    <td style={{ color: "#555", fontSize: 12 }}>
                      {r.createdAt ? new Date(r.createdAt).toLocaleDateString() : "—"}
                    </td>
                    <td>
                      <button
                        className="btn btn-ghost"
                        onClick={() => { if (confirm("Delete this review?")) deleteMutation.mutate(r.id); }}
                        style={{ padding: "5px 10px", fontSize: 11, color: "#e02020", borderColor: "rgba(224,32,32,0.2)" }}
                      >
                        <Trash2 size={11} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
