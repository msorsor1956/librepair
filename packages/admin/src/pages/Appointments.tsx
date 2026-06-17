import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import { Plus, X, Search, RefreshCw, CalendarPlus, Clock, User, Car, Wrench, MapPin, DollarSign, AlertCircle } from "lucide-react";

type Appointment = {
  id: number;
  status: string;
  serviceType: string;
  scheduledAt: string;
  completedAt?: string;
  totalCost?: number;
  notes?: string;
  customerName?: string;
  customerEmail?: string;
  serviceName?: string;
  vehicleMake?: string;
  vehicleModel?: string;
  vehicleYear?: number;
  customerAddress?: string;
};

const statusColors: Record<string, { badge: string; label: string }> = {
  pending:     { badge: "badge-yellow", label: "Pending" },
  confirmed:   { badge: "badge-blue",   label: "Confirmed" },
  "in-progress": { badge: "badge-purple", label: "In Progress" },
  completed:   { badge: "badge-green",  label: "Completed" },
  cancelled:   { badge: "badge-red",    label: "Cancelled" },
};

export default function AppointmentsPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showCreate, setShowCreate] = useState(false);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["appointments"],
    queryFn: () => api.get("/superadmin/appointments?limit=200"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, ...body }: any) => api.patch(`/superadmin/appointments/${id}`, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["appointments"] }),
  });

  const appointments: Appointment[] = data?.appointments ?? [];

  const filtered = appointments.filter(a => {
    const matchStatus = statusFilter === "all" || a.status === statusFilter;
    const q = search.toLowerCase();
    const matchSearch = !search ||
      (a.customerName ?? "").toLowerCase().includes(q) ||
      (a.customerEmail ?? "").toLowerCase().includes(q) ||
      (a.serviceName ?? "").toLowerCase().includes(q);
    return matchStatus && matchSearch;
  });

  const counts = {
    all: appointments.length,
    pending: appointments.filter(a => a.status === "pending").length,
    confirmed: appointments.filter(a => a.status === "confirmed").length,
    "in-progress": appointments.filter(a => a.status === "in-progress").length,
    completed: appointments.filter(a => a.status === "completed").length,
    cancelled: appointments.filter(a => a.status === "cancelled").length,
  };

  return (
    <div style={{ padding: 32 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontFamily: "Rajdhani, sans-serif", fontSize: 24, fontWeight: 700 }}>Appointments</h1>
          <p style={{ color: "#555", fontSize: 13 }}>{appointments.length} total · {counts.pending} pending</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn btn-ghost" onClick={() => refetch()} style={{ padding: "8px 14px" }}>
            <RefreshCw size={14} />
          </button>
          <button className="btn btn-red" onClick={() => setShowCreate(true)}>
            <CalendarPlus size={14} /> New Appointment
          </button>
        </div>
      </div>

      {/* Status tabs */}
      <div style={{ display: "flex", gap: 4, marginBottom: 20, borderBottom: "1px solid rgba(255,255,255,0.06)", overflowX: "auto" }}>
        {(["all", "pending", "confirmed", "in-progress", "completed", "cancelled"] as const).map(s => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            style={{
              padding: "8px 14px", fontSize: 12, fontWeight: 500, cursor: "pointer",
              background: "none", border: "none", whiteSpace: "nowrap",
              color: statusFilter === s ? "#e02020" : "#666",
              borderBottom: statusFilter === s ? "2px solid #e02020" : "2px solid transparent",
              marginBottom: -1,
            }}
          >
            {s === "all" ? "All" : s.replace("-", " ").replace(/\b\w/g, c => c.toUpperCase())}
            <span style={{ marginLeft: 5, fontSize: 11, color: statusFilter === s ? "#e02020" : "#444" }}>
              ({counts[s as keyof typeof counts] ?? 0})
            </span>
          </button>
        ))}
      </div>

      {/* Search */}
      <div style={{ position: "relative", marginBottom: 16, maxWidth: 380 }}>
        <Search size={13} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#555" }} />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search customer, email, service..." style={{ paddingLeft: 34 }} />
      </div>

      {/* Table */}
      <div style={{ background: "#111", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, overflow: "hidden" }}>
        {isLoading ? (
          <div style={{ padding: 48, textAlign: "center", color: "#555" }}>Loading...</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 48, textAlign: "center", color: "#444" }}>No appointments found.</div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table>
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Service / Vehicle</th>
                  <th>Type</th>
                  <th>Scheduled</th>
                  <th>Cost</th>
                  <th>Status</th>
                  <th>Update</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(a => (
                  <tr key={a.id}>
                    <td>
                      <div style={{ fontWeight: 500, color: "#e5e5e5" }}>{a.customerName ?? "—"}</div>
                      <div style={{ fontSize: 12, color: "#555" }}>{a.customerEmail ?? ""}</div>
                    </td>
                    <td>
                      <div style={{ color: "#aaa", fontSize: 13 }}>{a.serviceName ?? <span style={{ color: "#333" }}>—</span>}</div>
                      {(a.vehicleMake || a.vehicleModel) && (
                        <div style={{ fontSize: 12, color: "#555" }}>
                          {a.vehicleYear} {a.vehicleMake} {a.vehicleModel}
                        </div>
                      )}
                    </td>
                    <td>
                      <span style={{
                        padding: "3px 8px", borderRadius: 6, fontSize: 11, fontWeight: 600,
                        background: a.serviceType === "home-service" ? "rgba(139,92,246,0.15)" : "rgba(255,255,255,0.06)",
                        color: a.serviceType === "home-service" ? "#a78bfa" : "#888",
                        border: a.serviceType === "home-service" ? "1px solid rgba(139,92,246,0.25)" : "1px solid rgba(255,255,255,0.06)",
                      }}>
                        {a.serviceType === "home-service" ? "Home" : "In-Shop"}
                      </span>
                    </td>
                    <td style={{ color: "#aaa", fontSize: 13 }}>
                      {a.scheduledAt ? (
                        <>
                          <div>{new Date(a.scheduledAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</div>
                          <div style={{ fontSize: 11, color: "#555" }}>{new Date(a.scheduledAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}</div>
                        </>
                      ) : "—"}
                    </td>
                    <td style={{ color: "#aaa", fontSize: 13 }}>
                      {a.totalCost ? `$${a.totalCost.toLocaleString()}` : <span style={{ color: "#333" }}>—</span>}
                    </td>
                    <td>
                      <span className={`badge ${statusColors[a.status]?.badge ?? "badge-gray"}`}>
                        {statusColors[a.status]?.label ?? a.status}
                      </span>
                    </td>
                    <td>
                      <select
                        value={a.status}
                        onChange={e => updateMutation.mutate({ id: a.id, status: e.target.value })}
                        style={{ width: "auto", padding: "5px 8px", fontSize: 12 }}
                      >
                        <option value="pending">Pending</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="in-progress">In Progress</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showCreate && <CreateModal onClose={() => setShowCreate(false)} onCreated={() => { qc.invalidateQueries({ queryKey: ["appointments"] }); setShowCreate(false); }} />}
    </div>
  );
}

function CreateModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({
    customerId: "",
    vehicleId: "",
    serviceType: "in-shop",
    status: "pending",
    scheduledAt: "",
    scheduledTime: "09:00",
    notes: "",
    customerAddress: "",
    totalCost: "",
    bookingFee: "25",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [customerSearch, setCustomerSearch] = useState("");

  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

  const { data: usersData } = useQuery({
    queryKey: ["users"],
    queryFn: () => api.get("/superadmin/users"),
  });

  const { data: vehiclesData } = useQuery({
    queryKey: ["vehicles", form.customerId],
    queryFn: () => api.get(`/superadmin/vehicles?userId=${form.customerId}`),
    enabled: !!form.customerId,
  });

  const customers: Customer[] = (usersData?.users ?? []).filter((u: Customer & { role: string }) => u.role === "customer");
  const vehicles: Vehicle[] = vehiclesData?.vehicles ?? [];

  const filteredCustomers = customers.filter(c =>
    !customerSearch ||
    c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
    c.email.toLowerCase().includes(customerSearch.toLowerCase())
  );

  const selectedCustomer = customers.find(c => c.id === form.customerId);

  async function handleSubmit() {
    if (!form.customerId) { setError("Please select a customer"); return; }
    if (!form.scheduledAt) { setError("Please set a date"); return; }
    setError("");
    setLoading(true);
    try {
      const dateTime = new Date(`${form.scheduledAt}T${form.scheduledTime}:00`);
      await api.post("/superadmin/appointments", {
        customerId: form.customerId,
        vehicleId: form.vehicleId || undefined,
        serviceType: form.serviceType,
        status: form.status,
        scheduledAt: dateTime.toISOString(),
        notes: form.notes || undefined,
        customerAddress: form.serviceType === "home-service" ? form.customerAddress : undefined,
        totalCost: form.totalCost ? Number(form.totalCost) : undefined,
        bookingFee: Number(form.bookingFee),
      });
      onCreated();
    } catch (e: any) {
      setError(e.message ?? "Failed to create appointment");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="modal-overlay">
      <div className="modal" style={{ maxWidth: 580 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <div>
            <h2 style={{ fontFamily: "Rajdhani", fontSize: 20, fontWeight: 700 }}>New Appointment</h2>
            <p style={{ fontSize: 12, color: "#555", marginTop: 2 }}>Create and schedule an appointment for a customer</p>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#555", cursor: "pointer" }}><X size={18} /></button>
        </div>

        {error && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", background: "rgba(224,32,32,0.08)", border: "1px solid rgba(224,32,32,0.2)", borderRadius: 8, color: "#f87171", fontSize: 13, marginBottom: 16 }}>
            <AlertCircle size={14} /> {error}
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

          {/* Customer select */}
          <div className="form-group">
            <label className="form-label" style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <User size={12} /> Customer *
            </label>
            {selectedCustomer ? (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", background: "rgba(224,32,32,0.06)", border: "1px solid rgba(224,32,32,0.2)", borderRadius: 8 }}>
                <div>
                  <div style={{ fontWeight: 500, fontSize: 14, color: "#e5e5e5" }}>{selectedCustomer.name}</div>
                  <div style={{ fontSize: 12, color: "#555" }}>{selectedCustomer.email}</div>
                </div>
                <button onClick={() => { set("customerId", ""); set("vehicleId", ""); }} style={{ background: "none", border: "none", color: "#555", cursor: "pointer" }}>
                  <X size={14} />
                </button>
              </div>
            ) : (
              <>
                <div style={{ position: "relative", marginBottom: 6 }}>
                  <Search size={12} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#555" }} />
                  <input value={customerSearch} onChange={e => setCustomerSearch(e.target.value)} placeholder="Search customer name or email..." style={{ paddingLeft: 30, fontSize: 13 }} />
                </div>
                <div style={{ maxHeight: 180, overflowY: "auto", background: "#0d0d0d", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 8 }}>
                  {filteredCustomers.length === 0 ? (
                    <div style={{ padding: "12px 14px", color: "#444", fontSize: 13 }}>No customers found</div>
                  ) : filteredCustomers.slice(0, 8).map(c => (
                    <div
                      key={c.id}
                      onClick={() => { set("customerId", c.id); setCustomerSearch(""); }}
                      style={{ padding: "10px 14px", cursor: "pointer", borderBottom: "1px solid rgba(255,255,255,0.04)", display: "flex", alignItems: "center", gap: 10 }}
                      onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.04)")}
                      onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                    >
                      <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#1e40af", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "#fff", flexShrink: 0 }}>
                        {c.name[0]?.toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 500, color: "#e5e5e5" }}>{c.name}</div>
                        <div style={{ fontSize: 11, color: "#555" }}>{c.email}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Vehicle (if customer selected) */}
          {form.customerId && (
            <div className="form-group">
              <label className="form-label" style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <Car size={12} /> Vehicle <span style={{ color: "#444", fontWeight: 400 }}>(optional)</span>
              </label>
              {vehicles.length === 0 ? (
                <div style={{ padding: "10px 14px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 8, color: "#444", fontSize: 13 }}>
                  No vehicles on file for this customer
                </div>
              ) : (
                <select value={form.vehicleId} onChange={e => set("vehicleId", e.target.value)}>
                  <option value="">— No specific vehicle —</option>
                  {vehicles.map(v => (
                    <option key={v.id} value={v.id}>{v.year} {v.make} {v.model}</option>
                  ))}
                </select>
              )}
            </div>
          )}

          {/* Date & Time */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div className="form-group">
              <label className="form-label" style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <CalendarPlus size={12} /> Date *
              </label>
              <input type="date" value={form.scheduledAt} onChange={e => set("scheduledAt", e.target.value)} min={new Date().toISOString().split("T")[0]} />
            </div>
            <div className="form-group">
              <label className="form-label" style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <Clock size={12} /> Time
              </label>
              <input type="time" value={form.scheduledTime} onChange={e => set("scheduledTime", e.target.value)} />
            </div>
          </div>

          {/* Service type & Status */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div className="form-group">
              <label className="form-label" style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <Wrench size={12} /> Service Type
              </label>
              <select value={form.serviceType} onChange={e => set("serviceType", e.target.value)}>
                <option value="in-shop">In-Shop</option>
                <option value="home-service">Home Service</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Initial Status</label>
              <select value={form.status} onChange={e => set("status", e.target.value)}>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
              </select>
            </div>
          </div>

          {/* Home address (if home service) */}
          {form.serviceType === "home-service" && (
            <div className="form-group">
              <label className="form-label" style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <MapPin size={12} /> Customer Address *
              </label>
              <input value={form.customerAddress} onChange={e => set("customerAddress", e.target.value)} placeholder="123 Main St, City, State" />
            </div>
          )}

          {/* Cost */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div className="form-group">
              <label className="form-label" style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <DollarSign size={12} /> Estimated Cost
              </label>
              <input type="number" value={form.totalCost} onChange={e => set("totalCost", e.target.value)} placeholder="0.00" min="0" />
            </div>
            <div className="form-group">
              <label className="form-label">Booking Fee</label>
              <input type="number" value={form.bookingFee} onChange={e => set("bookingFee", e.target.value)} placeholder="25" min="0" />
            </div>
          </div>

          {/* Notes */}
          <div className="form-group">
            <label className="form-label">Notes</label>
            <textarea value={form.notes} onChange={e => set("notes", e.target.value)} rows={3} placeholder="Issue description, special instructions..." />
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, marginTop: 24, justifyContent: "flex-end" }}>
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-red" disabled={loading} onClick={handleSubmit} style={{ minWidth: 140, justifyContent: "center" }}>
            {loading ? "Creating..." : "Create Appointment"}
          </button>
        </div>
      </div>
    </div>
  );
}

type Customer = { id: string; name: string; email: string; phone?: string };
type Vehicle = { id: number; make: string; model: string; year: number; userId: string };
