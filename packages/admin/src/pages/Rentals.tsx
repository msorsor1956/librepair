import { useState, useEffect, useRef } from "react";
import { apiFetch } from "../lib/api";
import {
  Car, Plus, Edit2, Trash2, Upload, CheckCircle, XCircle, Eye,
  Clock, TrendingUp, DollarSign, Users, Fuel, Settings, AlertTriangle,
  ChevronDown, ChevronUp, X, Camera, Package, BarChart2, Printer
} from "lucide-react";

const API = import.meta.env.VITE_API_URL ?? "";

function fmt(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(n);
}
function fmtDate(d: any) {
  if (!d) return "—";
  return new Date(typeof d === "number" ? d * 1000 : d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}
function fmtDateTime(d: any) {
  if (!d) return "—";
  return new Date(typeof d === "number" ? d * 1000 : d).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

const statusColors: Record<string, { bg: string; color: string }> = {
  pending:   { bg: "rgba(212,160,23,0.12)", color: "#D4A017" },
  approved:  { bg: "rgba(34,197,94,0.12)",  color: "#22c55e" },
  rejected:  { bg: "rgba(224,32,32,0.12)",  color: "#e02020" },
  cancelled: { bg: "rgba(100,100,100,0.12)", color: "#888" },
  active:    { bg: "rgba(59,130,246,0.12)", color: "#3b82f6" },
  completed: { bg: "rgba(139,92,246,0.12)", color: "#8b5cf6" },
  no_show:   { bg: "rgba(224,32,32,0.12)",  color: "#e02020" },
};

const paymentMethods = ["credit_card","debit_card","cashapp","zelle","paypal","cash"];

type Tab = "vehicles" | "bookings" | "payments" | "stats";

export default function RentalsPage() {
  const [tab, setTab] = useState<Tab>("bookings");
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Vehicle form
  const [vehicleModal, setVehicleModal] = useState(false);
  const [editVehicle, setEditVehicle] = useState<any>(null);
  const [vForm, setVForm] = useState<any>({
    make: "", model: "", year: new Date().getFullYear(), color: "", licensePlate: "",
    vin: "", mileage: 0, fuelType: "gasoline", transmission: "automatic",
    seats: 5, dailyRate: 100, depositAmount: 25, description: "", isAvailable: true, published: true, photos: []
  });
  const [photoUploading, setPhotoUploading] = useState(false);
  const [photoUploadCount, setPhotoUploadCount] = useState(0);
  const [photoUploadTotal, setPhotoUploadTotal] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const photoRef = useRef<HTMLInputElement>(null);

  // Booking detail
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [bookingAction, setBookingAction] = useState<any>({});
  const [actionLoading, setActionLoading] = useState(false);

  // Payment modal
  const [paymentModal, setPaymentModal] = useState<any>(null);
  const [pForm, setPForm] = useState({ amount: "", type: "deposit", method: "cash", transactionId: "", notes: "" });
  const [paymentSaving, setPaymentSaving] = useState(false);

  const token = () => localStorage.getItem("admin_token") ?? localStorage.getItem("bearer_token") ?? "";
  const authH = () => ({ Authorization: `Bearer ${token()}` });

  const load = async () => {
    setLoading(true);
    const [vRes, bRes, pRes, sRes] = await Promise.allSettled([
      apiFetch(`${API}/api/rentals/admin/vehicles`, { headers: authH() }),
      apiFetch(`${API}/api/rentals/admin/bookings`, { headers: authH() }),
      apiFetch(`${API}/api/rentals/admin/payments`, { headers: authH() }),
      apiFetch(`${API}/api/rentals/admin/stats`, { headers: authH() }),
    ]);
    if (vRes.status === "fulfilled" && vRes.value.ok) setVehicles((await vRes.value.json()).vehicles ?? []);
    if (bRes.status === "fulfilled" && bRes.value.ok) setBookings((await bRes.value.json()).bookings ?? []);
    if (pRes.status === "fulfilled" && pRes.value.ok) setPayments((await pRes.value.json()).payments ?? []);
    if (sRes.status === "fulfilled" && sRes.value.ok) setStats(await sRes.value.json());
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  // Upload one or multiple photos
  const uploadPhotos = async (files: FileList | File[]) => {
    const list = Array.from(files);
    if (!list.length) return;
    setUploadError(null);
    setPhotoUploading(true);
    setPhotoUploadCount(0);
    setPhotoUploadTotal(list.length);
    const uploaded: string[] = [];
    for (const file of list) {
      const fd = new FormData();
      fd.append("file", file);
      try {
        const res = await fetch(`${API}/api/rentals/admin/upload-photo`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token()}` },
          body: fd,
        });
        if (res.ok) {
          const data = await res.json();
          if (data.url) uploaded.push(data.url);
          else setUploadError("Upload returned no URL");
        } else {
          const err = await res.json().catch(() => ({ message: `HTTP ${res.status}` }));
          setUploadError(err.message ?? `Upload failed (${res.status})`);
        }
      } catch (e: any) {
        setUploadError(e?.message ?? "Upload failed — check connection");
      }
      setPhotoUploadCount(c => c + 1);
    }
    if (uploaded.length) {
      setVForm((f: any) => ({ ...f, photos: [...f.photos, ...uploaded] }));
    }
    setPhotoUploading(false);
  };

  const openNewVehicle = () => {
    setEditVehicle(null);
    setSaveError(null);
    setUploadError(null);
    setVForm({ make: "", model: "", year: new Date().getFullYear(), color: "", licensePlate: "", vin: "", mileage: 0, fuelType: "gasoline", transmission: "automatic", seats: 5, dailyRate: 100, depositAmount: 25, description: "", isAvailable: true, published: true, photos: [] });
    setVehicleModal(true);
  };

  const openEditVehicle = (v: any) => {
    setEditVehicle(v);
    setSaveError(null);
    setUploadError(null);
    setVForm({ ...v, photos: v.photos ?? [] });
    setVehicleModal(true);
  };

  const saveVehicle = async () => {
    setSaveError(null);
    if (!vForm.make || !vForm.model || !vForm.year || !vForm.dailyRate) {
      setSaveError("Make, model, year, and daily rate are required.");
      return;
    }
    setSaving(true);
    try {
      const url = editVehicle ? `${API}/api/rentals/admin/vehicles/${editVehicle.id}` : `${API}/api/rentals/admin/vehicles`;
      const method = editVehicle ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { ...authH(), "Content-Type": "application/json" },
        body: JSON.stringify(vForm),
      });
      if (res.ok) {
        setVehicleModal(false);
        load();
      } else {
        const err = await res.json().catch(() => ({ message: `HTTP ${res.status}` }));
        setSaveError(err.message ?? `Save failed (${res.status})`);
      }
    } catch (e: any) {
      setSaveError(e?.message ?? "Save failed — check connection");
    }
    setSaving(false);
  };

  const deleteVehicle = async (id: number) => {
    if (!confirm("Delete this vehicle?")) return;
    await apiFetch(`${API}/api/rentals/admin/vehicles/${id}`, { method: "DELETE", headers: authH() });
    load();
  };

  const updateBooking = async (id: number, data: any) => {
    setActionLoading(true);
    const res = await apiFetch(`${API}/api/rentals/admin/bookings/${id}`, { method: "PATCH", headers: { ...authH(), "Content-Type": "application/json" }, body: JSON.stringify(data) });
    if (res.ok) { load(); setSelectedBooking(null); }
    setActionLoading(false);
  };

  const savePayment = async () => {
    if (!paymentModal) return;
    setPaymentSaving(true);
    const res = await apiFetch(`${API}/api/rentals/admin/payments`, {
      method: "POST", headers: { ...authH(), "Content-Type": "application/json" },
      body: JSON.stringify({ bookingId: paymentModal.id, ...pForm, amount: Number(pForm.amount) })
    });
    if (res.ok) { setPaymentModal(null); load(); }
    setPaymentSaving(false);
  };

  const printReport = () => {
    const win = window.open("", "_blank", "width=900,height=700");
    if (!win) return;
    win.document.write(`
      <html><head><title>Rental Report</title>
      <style>body{font-family:Arial,sans-serif;padding:32px;color:#111}
      h1{font-size:24px;margin-bottom:4px}h2{font-size:16px;color:#666;margin-bottom:20px}
      table{width:100%;border-collapse:collapse;margin-top:16px}
      th{background:#f0f0f0;padding:8px 12px;text-align:left;font-size:12px;border-bottom:2px solid #ddd}
      td{padding:8px 12px;font-size:12px;border-bottom:1px solid #eee}
      .badge{display:inline-block;padding:2px 8px;border-radius:4px;font-size:11px;font-weight:600}</style></head><body>
      <h1>LibRepair — Rental Report</h1>
      <h2>${new Date().toLocaleDateString("en-US", { weekday:"long", year:"numeric", month:"long", day:"numeric" })}</h2>
      <table><thead><tr>
        <th>Ref</th><th>Customer</th><th>Vehicle</th><th>Dates</th><th>Days</th><th>Total</th><th>Deposit</th><th>Status</th>
      </tr></thead><tbody>
      ${bookings.map(b => `<tr>
        <td>${b.bookingRef}</td>
        <td>${b.customer?.name ?? b.customerId}</td>
        <td>${b.vehicle ? `${b.vehicle.year} ${b.vehicle.make} ${b.vehicle.model}` : "—"}</td>
        <td>${fmtDate(b.startDate)} – ${fmtDate(b.endDate)}</td>
        <td>${b.totalDays}</td>
        <td>$${Number(b.totalAmount).toFixed(2)}</td>
        <td>${b.depositPaid ? "Paid" : "Pending"}</td>
        <td>${b.status}</td>
      </tr>`).join("")}
      </tbody></table></body></html>`);
    win.document.close();
    win.print();
  };

  const tabs: { id: Tab; label: string; icon: any }[] = [
    { id: "bookings", label: "Bookings", icon: Package },
    { id: "vehicles", label: "Vehicles", icon: Car },
    { id: "payments", label: "Payments", icon: DollarSign },
    { id: "stats", label: "Reports", icon: BarChart2 },
  ];

  return (
    <div style={{ padding: "24px 32px", maxWidth: 1200 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>Van For Rent</h1>
          <p style={{ fontSize: 13, color: "#666", margin: "4px 0 0" }}>Manage rental fleet, bookings, payments & reports</p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={printReport}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 8, border: "1px solid #333", background: "transparent", color: "#ccc", cursor: "pointer", fontSize: 13 }}>
            <Printer size={14} /> Print Report
          </button>
          <button onClick={openNewVehicle}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 8, background: "#e02020", color: "#fff", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>
            <Plus size={14} /> Add Vehicle
          </button>
        </div>
      </div>

      {/* Stats row */}
      {stats && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12, marginBottom: 24 }}>
          {[
            { label: "Available", value: stats.availableVehicles, icon: <Car size={16} />, color: "#22c55e" },
            { label: "Active Rentals", value: stats.activeBookings, icon: <TrendingUp size={16} />, color: "#3b82f6" },
            { label: "Upcoming", value: stats.upcomingBookings, icon: <Clock size={16} />, color: "#D4A017" },
            { label: "Pending", value: stats.pendingBookings, icon: <AlertTriangle size={16} />, color: "#f59e0b" },
            { label: "Total Revenue", value: fmt(stats.totalRevenue), icon: <DollarSign size={16} />, color: "#e02020" },
            { label: "Deposits", value: fmt(stats.depositCollected), icon: <CheckCircle size={16} />, color: "#8b5cf6" },
          ].map(({ label, value, icon, color }) => (
            <div key={label} style={{ background: "#111", border: "1px solid #222", borderRadius: 12, padding: "14px 16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, color, marginBottom: 6, fontSize: 12 }}>{icon} {label}</div>
              <div style={{ fontSize: 20, fontWeight: 700 }}>{value}</div>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, borderBottom: "1px solid #222", marginBottom: 24 }}>
        {tabs.map(t => {
          const Icon = t.icon;
          return (
            <button key={t.id} onClick={() => setTab(t.id)}
              style={{
                display: "flex", alignItems: "center", gap: 6, padding: "10px 16px",
                background: "transparent", border: "none", borderBottom: tab === t.id ? "2px solid #e02020" : "2px solid transparent",
                color: tab === t.id ? "#e02020" : "#666", cursor: "pointer", fontSize: 13, fontWeight: tab === t.id ? 600 : 400,
                marginBottom: -1
              }}>
              <Icon size={14} /> {t.label}
            </button>
          );
        })}
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: 60, color: "#555" }}>Loading...</div>
      ) : (
        <>
          {/* ── BOOKINGS TAB ─────────────────────────────────────────────────────── */}
          {tab === "bookings" && (
            <div>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid #222" }}>
                    {["Ref", "Customer", "Vehicle", "Dates", "Days", "Total", "Deposit", "Status", "Actions"].map(h => (
                      <th key={h} style={{ padding: "10px 12px", textAlign: "left", fontSize: 11, color: "#666", textTransform: "uppercase", letterSpacing: "0.05em", whiteSpace: "nowrap" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {bookings.length === 0 ? (
                    <tr><td colSpan={9} style={{ padding: "40px 0", textAlign: "center", color: "#555" }}>No bookings yet.</td></tr>
                  ) : bookings.map(b => (
                    <tr key={b.id} style={{ borderBottom: "1px solid #1a1a1a" }}>
                      <td style={{ padding: "12px", fontSize: 12, fontWeight: 600, color: "#e02020", whiteSpace: "nowrap" }}>{b.bookingRef}</td>
                      <td style={{ padding: "12px", fontSize: 12 }}>
                        <div style={{ fontWeight: 600 }}>{b.customer?.name ?? "—"}</div>
                        <div style={{ color: "#666", fontSize: 11 }}>{b.customer?.phone ?? b.customer?.email ?? ""}</div>
                      </td>
                      <td style={{ padding: "12px", fontSize: 12 }}>
                        {b.vehicle ? `${b.vehicle.year} ${b.vehicle.make} ${b.vehicle.model}` : "—"}
                      </td>
                      <td style={{ padding: "12px", fontSize: 12, whiteSpace: "nowrap" }}>
                        {fmtDate(b.startDate)}<br /><span style={{ color: "#666" }}>→ {fmtDate(b.endDate)}</span>
                      </td>
                      <td style={{ padding: "12px", fontSize: 12, textAlign: "center" }}>{b.totalDays}</td>
                      <td style={{ padding: "12px", fontSize: 12, fontWeight: 600 }}>{fmt(b.totalAmount)}</td>
                      <td style={{ padding: "12px", fontSize: 12 }}>
                        <span style={{
                          padding: "3px 8px", borderRadius: 6, fontSize: 11, fontWeight: 600,
                          background: b.depositPaid ? "rgba(34,197,94,0.12)" : "rgba(212,160,23,0.12)",
                          color: b.depositPaid ? "#22c55e" : "#D4A017"
                        }}>
                          {b.depositPaid ? "Paid" : "Pending"}
                        </span>
                      </td>
                      <td style={{ padding: "12px" }}>
                        <span style={{
                          padding: "3px 10px", borderRadius: 6, fontSize: 11, fontWeight: 600,
                          ...(statusColors[b.status] ?? { bg: "#222", color: "#aaa" }),
                          background: (statusColors[b.status] ?? { bg: "#222" }).bg,
                        }}>
                          {b.status.replace("_", " ")}
                        </span>
                      </td>
                      <td style={{ padding: "12px" }}>
                        <div style={{ display: "flex", gap: 6 }}>
                          <button onClick={() => { setSelectedBooking(b); setBookingAction({}); }}
                            style={{ padding: "5px 10px", borderRadius: 6, background: "#1a1a1a", border: "1px solid #333", color: "#ccc", cursor: "pointer", fontSize: 11, display: "flex", alignItems: "center", gap: 4 }}>
                            <Eye size={12} /> Manage
                          </button>
                          <button onClick={() => { setPaymentModal(b); setPForm({ amount: String(b.depositAmount), type: "deposit", method: "cash", transactionId: "", notes: "" }); }}
                            style={{ padding: "5px 10px", borderRadius: 6, background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.2)", color: "#22c55e", cursor: "pointer", fontSize: 11, display: "flex", alignItems: "center", gap: 4 }}>
                            <DollarSign size={12} /> Pay
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* ── VEHICLES TAB ─────────────────────────────────────────────────────── */}
          {tab === "vehicles" && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
              {vehicles.length === 0 ? (
                <div style={{ gridColumn: "1/-1", textAlign: "center", padding: 60, color: "#555" }}>
                  No vehicles yet. <button onClick={openNewVehicle} style={{ color: "#e02020", background: "none", border: "none", cursor: "pointer" }}>Add one</button>
                </div>
              ) : vehicles.map(v => (
                <div key={v.id} style={{ background: "#111", border: "1px solid #222", borderRadius: 16, overflow: "hidden" }}>
                  <div style={{ position: "relative", height: 160, background: "#0a0a0a" }}>
                    {v.photos?.[0] ? (
                      <img src={v.photos[0]} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : (
                      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 40 }}>🚐</div>
                    )}
                    <div style={{ position: "absolute", top: 10, left: 10 }}>
                      <span style={{
                        padding: "3px 8px", borderRadius: 20, fontSize: 11, fontWeight: 700,
                        background: v.isAvailable ? "rgba(34,197,94,0.2)" : "rgba(224,32,32,0.2)",
                        color: v.isAvailable ? "#22c55e" : "#e02020",
                        border: `1px solid ${v.isAvailable ? "rgba(34,197,94,0.4)" : "rgba(224,32,32,0.4)"}`,
                      }}>
                        {v.isAvailable ? "Available" : "Unavailable"}
                      </span>
                    </div>
                  </div>
                  <div style={{ padding: "14px 16px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 14 }}>{v.year} {v.make} {v.model}</div>
                        {v.color && <div style={{ fontSize: 12, color: "#666" }}>{v.color}</div>}
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontWeight: 700, color: "#e02020" }}>{fmt(v.dailyRate)}<span style={{ fontSize: 10, color: "#666" }}>/day</span></div>
                        <div style={{ fontSize: 11, color: "#666" }}>{fmt(v.depositAmount)} dep.</div>
                      </div>
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12, fontSize: 11, color: "#666" }}>
                      <span><Fuel size={10} style={{ display: "inline" }} /> {v.fuelType}</span>
                      <span><Settings size={10} style={{ display: "inline" }} /> {v.transmission}</span>
                      <span><Users size={10} style={{ display: "inline" }} /> {v.seats} seats</span>
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button onClick={() => openEditVehicle(v)}
                        style={{ flex: 1, padding: "7px 0", borderRadius: 8, background: "#1a1a1a", border: "1px solid #333", color: "#ccc", cursor: "pointer", fontSize: 12, display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
                        <Edit2 size={12} /> Edit
                      </button>
                      <button onClick={() => deleteVehicle(v.id)}
                        style={{ flex: 1, padding: "7px 0", borderRadius: 8, background: "rgba(224,32,32,0.08)", border: "1px solid rgba(224,32,32,0.2)", color: "#e02020", cursor: "pointer", fontSize: 12, display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
                        <Trash2 size={12} /> Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── PAYMENTS TAB ─────────────────────────────────────────────────────── */}
          {tab === "payments" && (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #222" }}>
                  {["ID", "Booking Ref", "Customer", "Amount", "Type", "Method", "Status", "Date"].map(h => (
                    <th key={h} style={{ padding: "10px 12px", textAlign: "left", fontSize: 11, color: "#666", textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {payments.length === 0 ? (
                  <tr><td colSpan={8} style={{ padding: "40px 0", textAlign: "center", color: "#555" }}>No payments recorded.</td></tr>
                ) : payments.map(p => {
                  const b = bookings.find(x => x.id === p.bookingId);
                  return (
                    <tr key={p.id} style={{ borderBottom: "1px solid #1a1a1a" }}>
                      <td style={{ padding: "12px", fontSize: 12, color: "#666" }}>#{p.id}</td>
                      <td style={{ padding: "12px", fontSize: 12, color: "#e02020", fontWeight: 600 }}>{b?.bookingRef ?? "—"}</td>
                      <td style={{ padding: "12px", fontSize: 12 }}>{b?.customer?.name ?? p.customerId}</td>
                      <td style={{ padding: "12px", fontSize: 13, fontWeight: 700 }}>{fmt(p.amount)}</td>
                      <td style={{ padding: "12px", fontSize: 12, textTransform: "capitalize" }}>{p.type}</td>
                      <td style={{ padding: "12px", fontSize: 12, textTransform: "capitalize" }}>{p.method?.replace("_", " ")}</td>
                      <td style={{ padding: "12px" }}>
                        <span style={{ padding: "3px 8px", borderRadius: 6, fontSize: 11, fontWeight: 600, background: "rgba(34,197,94,0.12)", color: "#22c55e" }}>
                          {p.status}
                        </span>
                      </td>
                      <td style={{ padding: "12px", fontSize: 12, color: "#666" }}>{fmtDateTime(p.createdAt)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}

          {/* ── STATS TAB ──────────────────────────────────────────────────────────── */}
          {tab === "stats" && stats && (
            <div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 32 }}>
                {[
                  { label: "Total Vehicles", value: stats.totalVehicles },
                  { label: "Available Now", value: stats.availableVehicles },
                  { label: "Total Bookings", value: stats.totalBookings },
                  { label: "Active Rentals", value: stats.activeBookings },
                  { label: "Upcoming", value: stats.upcomingBookings },
                  { label: "Pending Review", value: stats.pendingBookings },
                  { label: "Total Revenue", value: fmt(stats.totalRevenue) },
                  { label: "Deposits Collected", value: fmt(stats.depositCollected) },
                ].map(({ label, value }) => (
                  <div key={label} style={{ background: "#111", border: "1px solid #222", borderRadius: 12, padding: 20 }}>
                    <div style={{ fontSize: 12, color: "#666", marginBottom: 8 }}>{label}</div>
                    <div style={{ fontSize: 24, fontWeight: 700 }}>{value}</div>
                  </div>
                ))}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div style={{ background: "#111", border: "1px solid #222", borderRadius: 12, padding: 20 }}>
                  <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16, color: "#ccc" }}>Booking Status Breakdown</h3>
                  {(["pending","approved","active","completed","cancelled","rejected","no_show"] as const).map(s => {
                    const count = bookings.filter(b => b.status === s).length;
                    const pct = bookings.length ? Math.round((count / bookings.length) * 100) : 0;
                    const sc = statusColors[s] ?? { bg: "#222", color: "#aaa" };
                    return (
                      <div key={s} style={{ marginBottom: 10 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
                          <span style={{ color: sc.color, textTransform: "capitalize" }}>{s.replace("_", " ")}</span>
                          <span style={{ color: "#666" }}>{count} ({pct}%)</span>
                        </div>
                        <div style={{ height: 6, background: "#1a1a1a", borderRadius: 3 }}>
                          <div style={{ height: 6, width: `${pct}%`, background: sc.color, borderRadius: 3, transition: "width 0.4s" }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div style={{ background: "#111", border: "1px solid #222", borderRadius: 12, padding: 20 }}>
                  <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16, color: "#ccc" }}>Revenue Summary</h3>
                  {[
                    { label: "Gross Revenue", value: fmt(stats.totalRevenue) },
                    { label: "Deposits Collected", value: fmt(stats.depositCollected) },
                    { label: "Balance Revenue", value: fmt(stats.totalRevenue - stats.depositCollected) },
                    { label: "Avg. Booking Value", value: bookings.length ? fmt(bookings.reduce((s, b) => s + b.totalAmount, 0) / bookings.length) : "$0" },
                  ].map(({ label, value }) => (
                    <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid #1a1a1a", fontSize: 13 }}>
                      <span style={{ color: "#666" }}>{label}</span>
                      <span style={{ fontWeight: 600 }}>{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* ── VEHICLE MODAL ──────────────────────────────────────────────────────── */}
      {vehicleModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 1000, display: "flex", alignItems: "flex-start", justifyContent: "center", overflowY: "auto", padding: "32px 16px" }}>
          <div style={{ width: "100%", maxWidth: 580, background: "#111", border: "1px solid #222", borderRadius: 20, padding: 28 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 24 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>{editVehicle ? "Edit Vehicle" : "Add Vehicle"}</h2>
              <button onClick={() => setVehicleModal(false)} style={{ background: "none", border: "none", color: "#666", cursor: "pointer" }}>
                <X size={18} />
              </button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              {([
                { key: "make", label: "Make *", placeholder: "e.g. Toyota" },
                { key: "model", label: "Model *", placeholder: "e.g. Sienna" },
                { key: "year", label: "Year *", placeholder: "2022", type: "number" },
                { key: "color", label: "Color", placeholder: "White" },
                { key: "licensePlate", label: "License Plate", placeholder: "ABC-1234" },
                { key: "vin", label: "VIN", placeholder: "Optional" },
                { key: "mileage", label: "Mileage", placeholder: "0", type: "number" },
                { key: "seats", label: "Seats", placeholder: "5", type: "number" },
                { key: "dailyRate", label: "Daily Rate ($) *", placeholder: "100", type: "number" },
                { key: "depositAmount", label: "Deposit ($) *", placeholder: "25", type: "number" },
              ] as any[]).map(({ key, label, placeholder, type }) => (
                <div key={key}>
                  <label style={{ display: "block", fontSize: 11, color: "#666", marginBottom: 4 }}>{label}</label>
                  <input type={type ?? "text"} value={vForm[key]} onChange={e => setVForm((f: any) => ({ ...f, [key]: type === "number" ? Number(e.target.value) : e.target.value }))}
                    placeholder={placeholder}
                    style={{ width: "100%", padding: "8px 12px", borderRadius: 8, background: "#0a0a0a", border: "1px solid #333", color: "#fff", fontSize: 13, outline: "none", boxSizing: "border-box" }} />
                </div>
              ))}

              <div>
                <label style={{ display: "block", fontSize: 11, color: "#666", marginBottom: 4 }}>Fuel Type</label>
                <select value={vForm.fuelType} onChange={e => setVForm((f: any) => ({ ...f, fuelType: e.target.value }))}
                  style={{ width: "100%", padding: "8px 12px", borderRadius: 8, background: "#0a0a0a", border: "1px solid #333", color: "#fff", fontSize: 13, outline: "none" }}>
                  {["gasoline","diesel","electric","hybrid"].map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>

              <div>
                <label style={{ display: "block", fontSize: 11, color: "#666", marginBottom: 4 }}>Transmission</label>
                <select value={vForm.transmission} onChange={e => setVForm((f: any) => ({ ...f, transmission: e.target.value }))}
                  style={{ width: "100%", padding: "8px 12px", borderRadius: 8, background: "#0a0a0a", border: "1px solid #333", color: "#fff", fontSize: 13, outline: "none" }}>
                  {["automatic","manual"].map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
            </div>

            <div style={{ marginTop: 14 }}>
              <label style={{ display: "block", fontSize: 11, color: "#666", marginBottom: 4 }}>Description</label>
              <textarea value={vForm.description} onChange={e => setVForm((f: any) => ({ ...f, description: e.target.value }))}
                rows={3} placeholder="Vehicle description..."
                style={{ width: "100%", padding: "8px 12px", borderRadius: 8, background: "#0a0a0a", border: "1px solid #333", color: "#fff", fontSize: 13, outline: "none", resize: "vertical", boxSizing: "border-box" }} />
            </div>

            {/* Toggles */}
            <div style={{ display: "flex", gap: 16, marginTop: 14 }}>
              {[
                { key: "isAvailable", label: "Available" },
                { key: "published", label: "Published" },
              ].map(({ key, label }) => (
                <label key={key} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 13, color: "#ccc" }}>
                  <input type="checkbox" checked={vForm[key]} onChange={e => setVForm((f: any) => ({ ...f, [key]: e.target.checked }))} />
                  {label}
                </label>
              ))}
            </div>

            {/* Photos */}
            <div style={{ marginTop: 16 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                <label style={{ fontSize: 11, color: "#666" }}>Photos ({vForm.photos.length}/8)</label>
                {photoUploading && (
                  <span style={{ fontSize: 11, color: "#D4A017" }}>
                    Uploading {photoUploadCount}/{photoUploadTotal}...
                  </span>
                )}
              </div>
              {uploadError && (
                <div style={{ padding: "8px 12px", borderRadius: 8, background: "rgba(224,32,32,0.1)", border: "1px solid rgba(224,32,32,0.3)", color: "#e02020", fontSize: 12, marginBottom: 8 }}>
                  ⚠ {uploadError}
                </div>
              )}
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 8 }}>
                {vForm.photos.map((p: string, i: number) => (
                  <div key={i} style={{ position: "relative", width: 90, height: 68 }}>
                    <img src={p} style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 8, border: "1px solid #333" }} alt={`Photo ${i+1}`} />
                    <button onClick={() => setVForm((f: any) => ({ ...f, photos: f.photos.filter((_: any, j: number) => j !== i) }))}
                      style={{ position: "absolute", top: -6, right: -6, width: 20, height: 20, borderRadius: "50%", background: "#e02020", border: "2px solid #111", color: "#fff", cursor: "pointer", fontSize: 11, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700 }}>
                      ✕
                    </button>
                    {i === 0 && (
                      <div style={{ position: "absolute", bottom: 4, left: 4, background: "rgba(0,0,0,0.7)", borderRadius: 4, padding: "1px 5px", fontSize: 9, color: "#D4A017", fontWeight: 700 }}>MAIN</div>
                    )}
                  </div>
                ))}
                {vForm.photos.length < 8 && (
                  <button onClick={() => photoRef.current?.click()}
                    disabled={photoUploading}
                    style={{ width: 90, height: 68, borderRadius: 8, background: "#0a0a0a", border: "2px dashed #333", color: "#666", cursor: photoUploading ? "not-allowed" : "pointer", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4, fontSize: 11, opacity: photoUploading ? 0.5 : 1 }}>
                    {photoUploading ? (
                      <>
                        <Upload size={16} style={{ opacity: 0.5 }} />
                        <span style={{ fontSize: 10 }}>Uploading...</span>
                      </>
                    ) : (
                      <>
                        <Camera size={16} />
                        <span>Add Photos</span>
                      </>
                    )}
                  </button>
                )}
                <input
                  ref={photoRef}
                  type="file"
                  accept="image/*"
                  multiple
                  hidden
                  onChange={e => {
                    if (e.target.files && e.target.files.length > 0) {
                      const remaining = 8 - vForm.photos.length;
                      const toUpload = Array.from(e.target.files).slice(0, remaining);
                      uploadPhotos(toUpload);
                    }
                    e.target.value = "";
                  }}
                />
              </div>
              <p style={{ fontSize: 10, color: "#555", margin: "4px 0 0" }}>
                Select up to 8 photos at once. First photo is the main display image.
              </p>
            </div>

            {saveError && (
              <div style={{ marginTop: 12, padding: "10px 14px", borderRadius: 8, background: "rgba(224,32,32,0.1)", border: "1px solid rgba(224,32,32,0.3)", color: "#e02020", fontSize: 12 }}>
                ⚠ {saveError}
              </div>
            )}

            <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
              <button onClick={() => setVehicleModal(false)} style={{ flex: 1, padding: "10px 0", borderRadius: 10, background: "#1a1a1a", border: "1px solid #333", color: "#999", cursor: "pointer", fontSize: 13 }}>
                Cancel
              </button>
              <button onClick={saveVehicle} disabled={saving || photoUploading}
                style={{ flex: 1, padding: "10px 0", borderRadius: 10, background: "#e02020", border: "none", color: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 600, opacity: (saving || photoUploading) ? 0.7 : 1 }}>
                {saving ? "Saving..." : photoUploading ? "Wait — uploading photos..." : editVehicle ? "Save Changes" : "Add Vehicle"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── BOOKING DETAIL MODAL ───────────────────────────────────────────────── */}
      {selectedBooking && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 1000, display: "flex", alignItems: "flex-start", justifyContent: "center", overflowY: "auto", padding: "32px 16px" }}>
          <div style={{ width: "100%", maxWidth: 600, background: "#111", border: "1px solid #222", borderRadius: 20, padding: 28 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
              <div>
                <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>Manage Booking</h2>
                <p style={{ fontSize: 12, color: "#e02020", margin: "4px 0 0" }}>{selectedBooking.bookingRef}</p>
              </div>
              <button onClick={() => setSelectedBooking(null)} style={{ background: "none", border: "none", color: "#666", cursor: "pointer" }}><X size={18} /></button>
            </div>

            {/* Info */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 20, fontSize: 13 }}>
              {[
                { label: "Customer", value: selectedBooking.customer?.name ?? "—" },
                { label: "Phone", value: selectedBooking.customer?.phone ?? "—" },
                { label: "Vehicle", value: selectedBooking.vehicle ? `${selectedBooking.vehicle.year} ${selectedBooking.vehicle.make} ${selectedBooking.vehicle.model}` : "—" },
                { label: "Start Date", value: fmtDate(selectedBooking.startDate) },
                { label: "End Date", value: fmtDate(selectedBooking.endDate) },
                { label: "Total Days", value: String(selectedBooking.totalDays) },
                { label: "Daily Rate", value: fmt(selectedBooking.dailyRate) },
                { label: "Total Amount", value: fmt(selectedBooking.totalAmount) },
                { label: "Deposit", value: `${fmt(selectedBooking.depositAmount)} (${selectedBooking.depositPaid ? "Paid" : "Not Paid"})` },
                { label: "Balance Due", value: fmt(selectedBooking.balanceDue) },
                { label: "Payment Method", value: selectedBooking.paymentMethod?.replace("_", " ") ?? "—" },
                { label: "Current Status", value: selectedBooking.status.replace("_", " ") },
              ].map(({ label, value }) => (
                <div key={label} style={{ background: "#0a0a0a", border: "1px solid #1a1a1a", borderRadius: 8, padding: "10px 12px" }}>
                  <div style={{ fontSize: 11, color: "#666", marginBottom: 2 }}>{label}</div>
                  <div style={{ fontWeight: 600, textTransform: "capitalize" }}>{value}</div>
                </div>
              ))}
            </div>

            {selectedBooking.customerNotes && (
              <div style={{ marginBottom: 16, padding: "12px 14px", background: "#0a0a0a", border: "1px solid #1a1a1a", borderRadius: 10, fontSize: 13 }}>
                <div style={{ fontSize: 11, color: "#666", marginBottom: 4 }}>Customer Notes</div>
                <div>{selectedBooking.customerNotes}</div>
              </div>
            )}

            {/* Quick actions */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 12, color: "#666", marginBottom: 8 }}>Quick Actions</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {[
                  { status: "approved", label: "Approve", color: "#22c55e" },
                  { status: "rejected", label: "Reject", color: "#e02020" },
                  { status: "active", label: "Mark Active (Picked Up)", color: "#3b82f6" },
                  { status: "completed", label: "Complete (Returned)", color: "#8b5cf6" },
                  { status: "cancelled", label: "Cancel", color: "#666" },
                  { status: "no_show", label: "No Show", color: "#f59e0b" },
                ].map(({ status, label, color }) => (
                  <button key={status} onClick={() => updateBooking(selectedBooking.id, { status })}
                    disabled={actionLoading || selectedBooking.status === status}
                    style={{
                      padding: "7px 14px", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer",
                      background: `${color}15`, border: `1px solid ${color}40`, color,
                      opacity: (actionLoading || selectedBooking.status === status) ? 0.4 : 1
                    }}>
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Pickup/Return */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 20 }}>
              <div>
                <label style={{ fontSize: 11, color: "#666", display: "block", marginBottom: 4 }}>Pickup Notes</label>
                <textarea value={bookingAction.pickupNotes ?? ""} onChange={e => setBookingAction((a: any) => ({ ...a, pickupNotes: e.target.value }))}
                  rows={2} placeholder="Fuel level, condition..."
                  style={{ width: "100%", padding: "8px 12px", borderRadius: 8, background: "#0a0a0a", border: "1px solid #333", color: "#fff", fontSize: 12, outline: "none", resize: "none", boxSizing: "border-box" }} />
              </div>
              <div>
                <label style={{ fontSize: 11, color: "#666", display: "block", marginBottom: 4 }}>Return Notes</label>
                <textarea value={bookingAction.returnNotes ?? ""} onChange={e => setBookingAction((a: any) => ({ ...a, returnNotes: e.target.value }))}
                  rows={2} placeholder="Condition on return..."
                  style={{ width: "100%", padding: "8px 12px", borderRadius: 8, background: "#0a0a0a", border: "1px solid #333", color: "#fff", fontSize: 12, outline: "none", resize: "none", boxSizing: "border-box" }} />
              </div>
              <div>
                <label style={{ fontSize: 11, color: "#666", display: "block", marginBottom: 4 }}>Pickup Mileage</label>
                <input type="number" value={bookingAction.pickupMileage ?? ""} onChange={e => setBookingAction((a: any) => ({ ...a, pickupMileage: Number(e.target.value) }))}
                  style={{ width: "100%", padding: "8px 12px", borderRadius: 8, background: "#0a0a0a", border: "1px solid #333", color: "#fff", fontSize: 12, outline: "none", boxSizing: "border-box" }} />
              </div>
              <div>
                <label style={{ fontSize: 11, color: "#666", display: "block", marginBottom: 4 }}>Return Mileage</label>
                <input type="number" value={bookingAction.returnMileage ?? ""} onChange={e => setBookingAction((a: any) => ({ ...a, returnMileage: Number(e.target.value) }))}
                  style={{ width: "100%", padding: "8px 12px", borderRadius: 8, background: "#0a0a0a", border: "1px solid #333", color: "#fff", fontSize: 12, outline: "none", boxSizing: "border-box" }} />
              </div>
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setSelectedBooking(null)} style={{ flex: 1, padding: "10px 0", borderRadius: 10, background: "#1a1a1a", border: "1px solid #333", color: "#999", cursor: "pointer", fontSize: 13 }}>
                Close
              </button>
              <button onClick={() => updateBooking(selectedBooking.id, bookingAction)} disabled={actionLoading}
                style={{ flex: 1, padding: "10px 0", borderRadius: 10, background: "#e02020", border: "none", color: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 600, opacity: actionLoading ? 0.7 : 1 }}>
                {actionLoading ? "Saving..." : "Save Notes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── PAYMENT MODAL ──────────────────────────────────────────────────────── */}
      {paymentModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 1001, display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}>
          <div style={{ width: "100%", maxWidth: 420, background: "#111", border: "1px solid #222", borderRadius: 20, padding: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>Record Payment</h2>
              <button onClick={() => setPaymentModal(null)} style={{ background: "none", border: "none", color: "#666", cursor: "pointer" }}><X size={16} /></button>
            </div>
            <div style={{ fontSize: 12, color: "#e02020", marginBottom: 16 }}>{paymentModal.bookingRef}</div>

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div>
                <label style={{ fontSize: 11, color: "#666", display: "block", marginBottom: 4 }}>Amount ($)</label>
                <input type="number" value={pForm.amount} onChange={e => setPForm(p => ({ ...p, amount: e.target.value }))}
                  style={{ width: "100%", padding: "8px 12px", borderRadius: 8, background: "#0a0a0a", border: "1px solid #333", color: "#fff", fontSize: 13, outline: "none", boxSizing: "border-box" }} />
              </div>
              <div>
                <label style={{ fontSize: 11, color: "#666", display: "block", marginBottom: 4 }}>Type</label>
                <select value={pForm.type} onChange={e => setPForm(p => ({ ...p, type: e.target.value }))}
                  style={{ width: "100%", padding: "8px 12px", borderRadius: 8, background: "#0a0a0a", border: "1px solid #333", color: "#fff", fontSize: 13, outline: "none" }}>
                  {["deposit","balance","full","refund"].map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 11, color: "#666", display: "block", marginBottom: 4 }}>Method</label>
                <select value={pForm.method} onChange={e => setPForm(p => ({ ...p, method: e.target.value }))}
                  style={{ width: "100%", padding: "8px 12px", borderRadius: 8, background: "#0a0a0a", border: "1px solid #333", color: "#fff", fontSize: 13, outline: "none" }}>
                  {paymentMethods.map(o => <option key={o} value={o}>{o.replace("_", " ")}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 11, color: "#666", display: "block", marginBottom: 4 }}>Transaction ID</label>
                <input value={pForm.transactionId} onChange={e => setPForm(p => ({ ...p, transactionId: e.target.value }))}
                  placeholder="Optional"
                  style={{ width: "100%", padding: "8px 12px", borderRadius: 8, background: "#0a0a0a", border: "1px solid #333", color: "#fff", fontSize: 13, outline: "none", boxSizing: "border-box" }} />
              </div>
              <div>
                <label style={{ fontSize: 11, color: "#666", display: "block", marginBottom: 4 }}>Notes</label>
                <input value={pForm.notes} onChange={e => setPForm(p => ({ ...p, notes: e.target.value }))}
                  placeholder="Optional"
                  style={{ width: "100%", padding: "8px 12px", borderRadius: 8, background: "#0a0a0a", border: "1px solid #333", color: "#fff", fontSize: 13, outline: "none", boxSizing: "border-box" }} />
              </div>
            </div>

            <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
              <button onClick={() => setPaymentModal(null)} style={{ flex: 1, padding: "10px 0", borderRadius: 10, background: "#1a1a1a", border: "1px solid #333", color: "#999", cursor: "pointer", fontSize: 13 }}>Cancel</button>
              <button onClick={savePayment} disabled={paymentSaving}
                style={{ flex: 1, padding: "10px 0", borderRadius: 10, background: "#e02020", border: "none", color: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 600, opacity: paymentSaving ? 0.7 : 1 }}>
                {paymentSaving ? "Saving..." : "Record Payment"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
