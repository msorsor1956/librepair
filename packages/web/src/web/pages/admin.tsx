import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useLocation } from "wouter";
import { DashboardLayout } from "../components/dashboard-layout";
import { authClient } from "../lib/auth";
import {
  Users, Calendar, Wrench, TrendingUp, Clock, CheckCircle,
  XCircle, AlertCircle, CreditCard, DollarSign, UserCheck,
  Car, Plus, Pencil, Trash2, X, ShieldCheck, ChevronRight, Phone, MapPin,
  Tag, Timer, ToggleLeft, ToggleRight, ShoppingCart, Package,
} from "lucide-react";

/* ── helpers ── */
const STATUS_COLOR: Record<string, string> = {
  pending: "#f59e0b", confirmed: "#3b82f6", completed: "#22c55e",
  cancelled: "#ef4444", "in-progress": "#8b5cf6",
};
function StatusBadge({ status }: { status: string }) {
  const c = STATUS_COLOR[status] ?? "#888";
  return (
    <span className="inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full font-semibold"
      style={{ color: c, backgroundColor: `${c}22` }}>
      {status.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
    </span>
  );
}
function Input({ label, ...props }: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium" style={{ color: "var(--color-muted)" }}>{label}</label>
      <input {...props}
        className="px-3 py-2.5 rounded-lg text-sm focus:outline-none"
        style={{ background: "var(--color-bg)", border: "1px solid var(--color-border)", color: "var(--color-primary)" }} />
    </div>
  );
}
function StatCard({ icon, label, value, color, delay }: { icon: React.ReactNode; label: string; value: string | number; color: string; delay: number }) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay, duration: 0.4 }}
      className="glass rounded-xl p-6 flex flex-col gap-3">
      <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ backgroundColor: color }}>{icon}</div>
      <div>
        <div className="text-3xl font-bold" style={{ fontFamily: "Rajdhani", color: "var(--color-primary)" }}>{value}</div>
        <div className="text-sm mt-0.5" style={{ color: "var(--color-muted)" }}>{label}</div>
      </div>
    </motion.div>
  );
}

/* ── Sell Modal ── record parts + payment + complete ── */
function SellModal({ apt, onClose }: { apt: any; onClose: () => void }) {
  const qc = useQueryClient();
  type LineItem = { id: number; name: string; quantity: number; unitCost: string };
  const newItem = (): LineItem => ({ id: Date.now(), name: "", quantity: 1, unitCost: "" });
  const [items, setItems] = useState<LineItem[]>([newItem()]);
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "zelle" | "cashapp" | "stripe" | "paypal">("cash");
  const [markCompleted, setMarkCompleted] = useState(true);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const subtotal = items.reduce((sum, it) => sum + (it.quantity * (parseFloat(it.unitCost) || 0)), 0);
  const tax = parseFloat((subtotal * 0.08).toFixed(2));
  const total = parseFloat((subtotal + tax).toFixed(2));

  function updateItem(id: number, field: keyof LineItem, val: string | number) {
    setItems((prev) => prev.map((it) => it.id === id ? { ...it, [field]: val } : it));
  }
  function removeItem(id: number) { setItems((prev) => prev.filter((it) => it.id !== id)); }
  function addItem() { setItems((prev) => [...prev, newItem()]); }

  async function sell() {
    if (items.some((it) => !it.name.trim())) { setError("All items need a name."); return; }
    if (total <= 0) { setError("Total must be greater than $0."); return; }
    setSaving(true); setError("");
    const r = await fetch(`/api/appointments/${apt.id}/sell`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items: items.map((it) => ({
          name: it.name,
          quantity: it.quantity,
          unitCost: parseFloat(it.unitCost) || 0,
        })),
        paymentMethod,
        totalCost: total,
        notes: notes || null,
        markCompleted,
      }),
    });
    const data = await r.json();
    if (!r.ok) { setError(data.message ?? "Error saving sale."); setSaving(false); return; }
    qc.invalidateQueries({ queryKey: ["admin-appointments"] });
    qc.invalidateQueries({ queryKey: ["admin-payments"] });
    onClose();
  }

  const inputStyle = { background: "var(--color-bg)", border: "1px solid var(--color-border)", color: "var(--color-primary)" };
  const labelStyle = { color: "var(--color-muted)" };
  const methods = [
    { value: "cash", label: "Cash" },
    { value: "zelle", label: "Zelle" },
    { value: "cashapp", label: "Cash App" },
    { value: "stripe", label: "Card (Stripe)" },
    { value: "paypal", label: "PayPal" },
  ] as const;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}>
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-xl rounded-2xl p-6 max-h-[92vh] overflow-y-auto"
        style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}>

        {/* Header */}
        <div className="flex items-start justify-between mb-5">
          <div>
            <h2 className="text-lg font-bold flex items-center gap-2" style={{ fontFamily: "Rajdhani" }}>
              <ShoppingCart size={18} style={{ color: "var(--color-red)" }} />
              Sell — Appointment #{apt.id}
            </h2>
            <p className="text-xs mt-0.5" style={{ color: "var(--color-muted)" }}>
              {apt.customerName ?? "Customer"} · {apt.serviceName ?? apt.serviceType ?? "Service"}
            </p>
          </div>
          <button onClick={onClose}><X size={18} style={{ color: "var(--color-muted)" }} /></button>
        </div>

        {/* Line items */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-semibold uppercase tracking-wide" style={labelStyle}>Items / Parts / Labor</label>
            <button onClick={addItem} className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg font-medium"
              style={{ backgroundColor: "rgba(224,32,32,0.12)", color: "var(--color-red)" }}>
              <Plus size={11} /> Add Item
            </button>
          </div>

          {/* Header row */}
          <div className="grid grid-cols-12 gap-2 mb-1 px-1">
            <span className="col-span-5 text-xs" style={labelStyle}>Description</span>
            <span className="col-span-2 text-xs text-center" style={labelStyle}>Qty</span>
            <span className="col-span-3 text-xs" style={labelStyle}>Unit ($)</span>
            <span className="col-span-2 text-xs text-right" style={labelStyle}>Total</span>
          </div>

          <div className="space-y-2">
            {items.map((it) => (
              <div key={it.id} className="grid grid-cols-12 gap-2 items-center">
                <input
                  className="col-span-5 px-2.5 py-2 rounded-lg text-sm focus:outline-none"
                  style={inputStyle}
                  placeholder="e.g. Oil Change, Labor…"
                  value={it.name}
                  onChange={(e) => updateItem(it.id, "name", e.target.value)}
                />
                <input
                  type="number" min="1"
                  className="col-span-2 px-2.5 py-2 rounded-lg text-sm text-center focus:outline-none"
                  style={inputStyle}
                  value={it.quantity}
                  onChange={(e) => updateItem(it.id, "quantity", parseInt(e.target.value) || 1)}
                />
                <input
                  type="number" min="0" step="0.01"
                  className="col-span-3 px-2.5 py-2 rounded-lg text-sm focus:outline-none"
                  style={inputStyle}
                  placeholder="0.00"
                  value={it.unitCost}
                  onChange={(e) => updateItem(it.id, "unitCost", e.target.value)}
                />
                <div className="col-span-2 flex items-center justify-end gap-1">
                  <span className="text-sm font-medium" style={{ color: "var(--color-secondary)" }}>
                    ${(it.quantity * (parseFloat(it.unitCost) || 0)).toFixed(2)}
                  </span>
                  {items.length > 1 && (
                    <button onClick={() => removeItem(it.id)} className="p-0.5 ml-1">
                      <X size={11} style={{ color: "#ef4444" }} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Totals */}
        <div className="rounded-xl p-4 mb-4 space-y-2" style={{ background: "var(--color-bg)", border: "1px solid var(--color-border)" }}>
          <div className="flex justify-between text-sm" style={{ color: "var(--color-secondary)" }}>
            <span>Subtotal</span><span>${subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm" style={{ color: "var(--color-muted)" }}>
            <span>Tax (8%)</span><span>${tax.toFixed(2)}</span>
          </div>
          <div className="flex justify-between font-bold text-base pt-2" style={{ borderTop: "1px solid var(--color-border)", color: "var(--color-primary)" }}>
            <span>Total</span><span style={{ color: "var(--color-red)" }}>${total.toFixed(2)}</span>
          </div>
        </div>

        {/* Payment method */}
        <div className="mb-4">
          <label className="text-xs font-semibold uppercase tracking-wide block mb-2" style={labelStyle}>Payment Method</label>
          <div className="flex flex-wrap gap-2">
            {methods.map((m) => (
              <button key={m.value} onClick={() => setPaymentMethod(m.value as any)}
                className="px-3 py-1.5 rounded-lg text-sm font-medium transition-all"
                style={{
                  backgroundColor: paymentMethod === m.value ? "var(--color-red)" : "var(--color-bg)",
                  color: paymentMethod === m.value ? "#fff" : "var(--color-secondary)",
                  border: `1px solid ${paymentMethod === m.value ? "var(--color-red)" : "var(--color-border)"}`,
                }}>
                {m.label}
              </button>
            ))}
          </div>
        </div>

        {/* Notes */}
        <div className="mb-4 flex flex-col gap-1">
          <label className="text-xs font-semibold uppercase tracking-wide" style={labelStyle}>Notes (optional)</label>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2}
            className="px-3 py-2.5 rounded-lg text-sm resize-none focus:outline-none" style={inputStyle}
            placeholder="Invoice notes, payment reference…" />
        </div>

        {/* Mark completed toggle */}
        <div className="flex items-center gap-3 mb-5 p-3 rounded-xl" style={{ background: "var(--color-bg)", border: "1px solid var(--color-border)" }}>
          <button onClick={() => setMarkCompleted((v) => !v)} className="flex items-center gap-2">
            {markCompleted
              ? <ToggleRight size={22} style={{ color: "var(--color-red)" }} />
              : <ToggleLeft size={22} style={{ color: "var(--color-muted)" }} />}
            <span className="text-sm font-medium" style={{ color: "var(--color-secondary)" }}>Mark appointment as completed</span>
          </button>
        </div>

        {error && <p className="text-xs mb-3" style={{ color: "#ef4444" }}>{error}</p>}

        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-lg text-sm"
            style={{ border: "1px solid var(--color-border)", color: "var(--color-muted)" }}>Cancel</button>
          <button onClick={sell} disabled={saving}
            className="flex-1 px-4 py-2.5 rounded-lg text-sm font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-50"
            style={{ backgroundColor: "var(--color-red)" }}>
            {saving ? "Processing…" : <><ShoppingCart size={14} /> Complete Sale ${total.toFixed(2)}</>}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

/* ── Assign Mechanic Modal ── */
function AssignMechanicModal({ apt, mechanics, onClose }: { apt: any; mechanics: any[]; onClose: () => void }) {
  const qc = useQueryClient();
  const [mechanicId, setMechanicId] = useState(apt.mechanicId ?? "");
  const [saving, setSaving] = useState(false);
  async function assign() {
    setSaving(true);
    await fetch(`/api/appointments/${apt.id}/assign`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mechanicId: mechanicId || null }),
    });
    qc.invalidateQueries({ queryKey: ["admin-appointments"] });
    setSaving(false); onClose();
  }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}>
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-sm rounded-2xl p-6" style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
        <h2 className="text-lg font-bold mb-1" style={{ fontFamily: "Rajdhani" }}>Assign Mechanic</h2>
        <p className="text-sm mb-4" style={{ color: "var(--color-muted)" }}>Appointment #{apt.id}</p>
        <select value={mechanicId} onChange={(e) => setMechanicId(e.target.value)}
          className="w-full px-3 py-2.5 rounded-lg text-sm mb-4"
          style={{ background: "var(--color-bg)", border: "1px solid var(--color-border)", color: "var(--color-primary)" }}>
          <option value="">— Unassigned —</option>
          {mechanics.map((m) => <option key={m.id} value={m.id}>{m.name ?? m.email}</option>)}
        </select>
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 px-4 py-2 rounded-lg text-sm" style={{ border: "1px solid var(--color-border)", color: "var(--color-muted)" }}>Cancel</button>
          <button onClick={assign} disabled={saving} className="flex-1 px-4 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-50" style={{ backgroundColor: "var(--color-red)" }}>
            {saving ? "Saving…" : "Assign"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

/* ── Payment Modal ── */
function PaymentModal({ payment, onClose }: { payment: any; onClose: () => void }) {
  const qc = useQueryClient();
  const [status, setStatus] = useState(payment.status);
  const [saving, setSaving] = useState(false);
  async function save() {
    setSaving(true);
    await fetch(`/api/payments/${payment.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
    qc.invalidateQueries({ queryKey: ["admin-payments"] });
    setSaving(false); onClose();
  }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}>
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-sm rounded-2xl p-6" style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
        <h2 className="text-lg font-bold mb-1" style={{ fontFamily: "Rajdhani" }}>Update Payment</h2>
        <p className="text-sm mb-4" style={{ color: "var(--color-muted)" }}>#{payment.id} · ${Number(payment.amount).toFixed(2)} via {payment.method}</p>
        <select value={status} onChange={(e) => setStatus(e.target.value)}
          className="w-full px-3 py-2.5 rounded-lg text-sm mb-4"
          style={{ background: "var(--color-bg)", border: "1px solid var(--color-border)", color: "var(--color-primary)" }}>
          {["pending", "paid", "failed", "refunded"].map((s) => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
        </select>
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 px-4 py-2 rounded-lg text-sm" style={{ border: "1px solid var(--color-border)", color: "var(--color-muted)" }}>Cancel</button>
          <button onClick={save} disabled={saving} className="flex-1 px-4 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-50" style={{ backgroundColor: "var(--color-red)" }}>
            {saving ? "Saving…" : "Update"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

/* ── Appointment status select inline ── */
function AptStatusSelect({ apt }: { apt: any }) {
  const qc = useQueryClient();
  const [val, setVal] = useState(apt.status);
  async function update(s: string) {
    setVal(s);
    await fetch(`/api/appointments/${apt.id}/status`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: s }) });
    qc.invalidateQueries({ queryKey: ["admin-appointments"] });
  }
  return (
    <select value={val} onChange={(e) => update(e.target.value)}
      className="text-xs px-2 py-1 rounded-lg font-semibold"
      style={{ background: `${STATUS_COLOR[val] ?? "#888"}18`, color: STATUS_COLOR[val] ?? "#888", border: `1px solid ${STATUS_COLOR[val] ?? "#888"}44`, outline: "none" }}>
      {["pending","confirmed","in-progress","completed","cancelled"].map((s) => (
        <option key={s} value={s}>{s.replace(/-/g," ").replace(/\b\w/g,(c)=>c.toUpperCase())}</option>
      ))}
    </select>
  );
}

/* ── Add/Edit Customer Modal ── */
function CustomerModal({ customer, onClose }: { customer: any | null; onClose: () => void }) {
  const qc = useQueryClient();
  const isEdit = !!customer;
  const [form, setForm] = useState({
    name: customer?.name ?? "",
    email: customer?.email ?? "",
    phone: customer?.phone ?? "",
    address: customer?.address ?? "",
    password: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function save() {
    setSaving(true); setError("");
    try {
      const url = isEdit ? `/api/admin/customers/${customer.id}` : "/api/admin/customers";
      const method = isEdit ? "PATCH" : "POST";
      const body = isEdit ? { name: form.name, phone: form.phone, address: form.address, email: form.email } : form;
      const r = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const data = await r.json();
      if (!r.ok) { setError(data.message ?? "Error"); setSaving(false); return; }
      qc.invalidateQueries({ queryKey: ["admin-customers"] });
      onClose();
    } catch (e) { setError("Network error"); }
    setSaving(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}>
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md rounded-2xl p-6" style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold" style={{ fontFamily: "Rajdhani" }}>{isEdit ? "Edit Customer" : "Add Customer"}</h2>
          <button onClick={onClose}><X size={18} style={{ color: "var(--color-muted)" }} /></button>
        </div>
        <div className="space-y-3">
          <Input label="Full Name" value={form.name} onChange={set("name")} placeholder="John Doe" />
          <Input label="Email" type="email" value={form.email} onChange={set("email")} placeholder="john@example.com" disabled={isEdit} />
          <Input label="Phone" type="tel" value={form.phone} onChange={set("phone")} placeholder="+1 555 000 0000" />
          <Input label="Address" value={form.address} onChange={set("address")} placeholder="123 Main St, City, State" />
          {!isEdit && <Input label="Temporary Password" type="password" value={form.password} onChange={set("password")} placeholder="TempPass123!" />}
        </div>
        {error && <p className="text-xs mt-3" style={{ color: "#ef4444" }}>{error}</p>}
        <div className="flex gap-2 mt-5">
          <button onClick={onClose} className="flex-1 px-4 py-2 rounded-lg text-sm" style={{ border: "1px solid var(--color-border)", color: "var(--color-muted)" }}>Cancel</button>
          <button onClick={save} disabled={saving} className="flex-1 px-4 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-50" style={{ backgroundColor: "var(--color-red)" }}>
            {saving ? "Saving…" : isEdit ? "Save Changes" : "Create Customer"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

/* ── Add/Edit Vehicle Modal ── */
function VehicleModal({ customerId, vehicle, onClose }: { customerId: string; vehicle: any | null; onClose: () => void }) {
  const qc = useQueryClient();
  const isEdit = !!vehicle;
  const [form, setForm] = useState({
    make: vehicle?.make ?? "",
    model: vehicle?.model ?? "",
    year: vehicle?.year?.toString() ?? "",
    color: vehicle?.color ?? "",
    vin: vehicle?.vin ?? "",
    licensePlate: vehicle?.licensePlate ?? "",
    mileage: vehicle?.mileage?.toString() ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function save() {
    setSaving(true); setError("");
    try {
      const url = isEdit
        ? `/api/admin/customers/${customerId}/vehicles/${vehicle.id}`
        : `/api/admin/customers/${customerId}/vehicles`;
      const method = isEdit ? "PATCH" : "POST";
      const r = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, year: parseInt(form.year), mileage: parseInt(form.mileage) || 0 }) });
      const data = await r.json();
      if (!r.ok) { setError(data.message ?? "Error"); setSaving(false); return; }
      qc.invalidateQueries({ queryKey: ["admin-vehicles", customerId] });
      qc.invalidateQueries({ queryKey: ["admin-customers"] });
      onClose();
    } catch { setError("Network error"); }
    setSaving(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}>
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md rounded-2xl p-6" style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold" style={{ fontFamily: "Rajdhani" }}>{isEdit ? "Edit Vehicle" : "Add Vehicle"}</h2>
          <button onClick={onClose}><X size={18} style={{ color: "var(--color-muted)" }} /></button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Input label="Make" value={form.make} onChange={set("make")} placeholder="Toyota" />
          <Input label="Model" value={form.model} onChange={set("model")} placeholder="Camry" />
          <Input label="Year" type="number" value={form.year} onChange={set("year")} placeholder="2020" />
          <Input label="Color" value={form.color} onChange={set("color")} placeholder="Silver" />
          <Input label="License Plate" value={form.licensePlate} onChange={set("licensePlate")} placeholder="ABC-1234" />
          <Input label="Mileage" type="number" value={form.mileage} onChange={set("mileage")} placeholder="45000" />
          <div className="col-span-2">
            <Input label="VIN (optional)" value={form.vin} onChange={set("vin")} placeholder="1HGBH41JXMN109186" />
          </div>
        </div>
        {error && <p className="text-xs mt-3" style={{ color: "#ef4444" }}>{error}</p>}
        <div className="flex gap-2 mt-5">
          <button onClick={onClose} className="flex-1 px-4 py-2 rounded-lg text-sm" style={{ border: "1px solid var(--color-border)", color: "var(--color-muted)" }}>Cancel</button>
          <button onClick={save} disabled={saving} className="flex-1 px-4 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-50" style={{ backgroundColor: "var(--color-red)" }}>
            {saving ? "Saving…" : isEdit ? "Save Changes" : "Add Vehicle"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

/* ── Create Admin Modal (super admin only) ── */
function CreateAdminModal({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "AdminPass123!" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function save() {
    setSaving(true); setError(""); setSuccess("");
    const r = await fetch("/api/admin/create-admin", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    const data = await r.json();
    if (!r.ok) { setError(data.message ?? "Error"); setSaving(false); return; }
    setSuccess(data.message ?? "Admin created!");
    qc.invalidateQueries({ queryKey: ["admin-customers"] });
    setSaving(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}>
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md rounded-2xl p-6" style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <ShieldCheck size={18} style={{ color: "var(--color-red)" }} />
            <h2 className="text-lg font-bold" style={{ fontFamily: "Rajdhani" }}>Create Admin</h2>
          </div>
          <button onClick={onClose}><X size={18} style={{ color: "var(--color-muted)" }} /></button>
        </div>
        <p className="text-xs mb-5" style={{ color: "var(--color-muted)" }}>Super admin only. The new admin can log in immediately.</p>
        <div className="space-y-3">
          <Input label="Full Name" value={form.name} onChange={set("name")} placeholder="Admin Name" />
          <Input label="Email" type="email" value={form.email} onChange={set("email")} placeholder="admin@company.com" />
          <Input label="Phone (optional)" type="tel" value={form.phone} onChange={set("phone")} placeholder="+1 555 000 0000" />
          <Input label="Initial Password" type="password" value={form.password} onChange={set("password")} />
        </div>
        {error   && <p className="text-xs mt-3" style={{ color: "#ef4444" }}>{error}</p>}
        {success && <p className="text-xs mt-3" style={{ color: "#22c55e" }}>{success}</p>}
        <div className="flex gap-2 mt-5">
          <button onClick={onClose} className="flex-1 px-4 py-2 rounded-lg text-sm" style={{ border: "1px solid var(--color-border)", color: "var(--color-muted)" }}>
            {success ? "Close" : "Cancel"}
          </button>
          {!success && (
            <button onClick={save} disabled={saving} className="flex-1 px-4 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-50" style={{ backgroundColor: "var(--color-red)" }}>
              {saving ? "Creating…" : "Create Admin"}
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}

/* ── Service Modal (add / edit) ── */
function ServiceModal({ service, onClose }: { service: any | null; onClose: () => void }) {
  const qc = useQueryClient();
  const isEdit = !!service;
  const [form, setForm] = useState({
    name: service?.name ?? "",
    description: service?.description ?? "",
    category: service?.category ?? "",
    basePrice: service?.basePrice?.toString() ?? "",
    durationMinutes: service?.durationMinutes?.toString() ?? "60",
    isActive: service?.isActive ?? true,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  async function save() {
    setSaving(true); setError("");
    const url = isEdit ? `/api/services/${service.id}` : "/api/services";
    const method = isEdit ? "PATCH" : "POST";
    const r = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, basePrice: parseFloat(form.basePrice), durationMinutes: parseInt(form.durationMinutes) }) });
    const data = await r.json();
    if (!r.ok) { setError(data.message ?? "Error"); setSaving(false); return; }
    qc.invalidateQueries({ queryKey: ["admin-services"] });
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}>
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md rounded-2xl p-6" style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold" style={{ fontFamily: "Rajdhani" }}>{isEdit ? "Edit Service" : "Add Service"}</h2>
          <button onClick={onClose}><X size={18} style={{ color: "var(--color-muted)" }} /></button>
        </div>
        <div className="space-y-3">
          <Input label="Service Name" value={form.name} onChange={set("name")} placeholder="e.g. Oil Change" />
          <div className="flex gap-3">
            <Input label="Category" value={form.category} onChange={set("category")} placeholder="e.g. Maintenance" />
            <Input label="Base Price ($)" type="number" step="0.01" value={form.basePrice} onChange={set("basePrice")} placeholder="49.99" />
          </div>
          <Input label="Duration (minutes)" type="number" value={form.durationMinutes} onChange={set("durationMinutes")} placeholder="60" />
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium" style={{ color: "var(--color-muted)" }}>Description</label>
            <textarea value={form.description} onChange={set("description")} rows={2}
              placeholder="Short description of the service..."
              className="px-3 py-2.5 rounded-lg text-sm resize-none focus:outline-none"
              style={{ background: "var(--color-bg)", border: "1px solid var(--color-border)", color: "var(--color-primary)" }} />
          </div>
          {isEdit && (
            <div className="flex items-center gap-3">
              <label className="text-sm" style={{ color: "var(--color-secondary)" }}>Active</label>
              <button type="button" onClick={() => setForm((f) => ({ ...f, isActive: !f.isActive }))}>
                {form.isActive
                  ? <ToggleRight size={24} style={{ color: "#22c55e" }} />
                  : <ToggleLeft size={24} style={{ color: "var(--color-muted)" }} />}
              </button>
            </div>
          )}
        </div>
        {error && <p className="text-xs mt-3" style={{ color: "#ef4444" }}>{error}</p>}
        <div className="flex gap-2 mt-5">
          <button onClick={onClose} className="flex-1 px-4 py-2 rounded-lg text-sm" style={{ border: "1px solid var(--color-border)", color: "var(--color-muted)" }}>Cancel</button>
          <button onClick={save} disabled={saving} className="flex-1 px-4 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-50" style={{ backgroundColor: "var(--color-red)" }}>
            {saving ? "Saving…" : isEdit ? "Save Changes" : "Create Service"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

/* ── Edit Appointment Modal (admin full control) ── */
function EditAppointmentModal({ apt, services, onClose }: { apt: any; services: any[]; onClose: () => void }) {
  const qc = useQueryClient();
  const fmt = (d: any) => d ? new Date(d).toISOString().slice(0, 16) : "";
  const [form, setForm] = useState({
    status: apt.status ?? "pending",
    scheduledAt: fmt(apt.scheduledAt),
    serviceId: apt.serviceId?.toString() ?? "",
    serviceType: apt.serviceType ?? "in-shop",
    totalCost: apt.totalCost?.toString() ?? "",
    bookingFee: apt.bookingFee?.toString() ?? "25",
    notes: apt.notes ?? "",
    mechanicNotes: apt.mechanicNotes ?? "",
    customerAddress: apt.customerAddress ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  async function save() {
    setSaving(true); setError("");
    const r = await fetch(`/api/appointments/${apt.id}/admin-update`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, serviceId: form.serviceId || null }),
    });
    const data = await r.json();
    if (!r.ok) { setError(data.message ?? "Error"); setSaving(false); return; }
    qc.invalidateQueries({ queryKey: ["admin-appointments"] });
    onClose();
  }

  async function deleteApt() {
    if (!confirm(`Permanently delete appointment #${apt.id}? This cannot be undone.`)) return;
    await fetch(`/api/appointments/${apt.id}/admin-delete`, { method: "DELETE" });
    qc.invalidateQueries({ queryKey: ["admin-appointments"] });
    onClose();
  }

  const inputStyle = { background: "var(--color-bg)", border: "1px solid var(--color-border)", color: "var(--color-primary)" };
  const labelStyle = { color: "var(--color-muted)" };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}>
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-lg rounded-2xl p-6 max-h-[90vh] overflow-y-auto"
        style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-lg font-bold" style={{ fontFamily: "Rajdhani" }}>Edit Appointment #{apt.id}</h2>
            <p className="text-xs" style={{ color: "var(--color-muted)" }}>{apt.customerName ?? "Customer"}</p>
          </div>
          <button onClick={onClose}><X size={18} style={{ color: "var(--color-muted)" }} /></button>
        </div>

        <div className="space-y-3">
          {/* Status + Service type */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium" style={labelStyle}>Status</label>
              <select value={form.status} onChange={set("status")} className="px-3 py-2.5 rounded-lg text-sm" style={inputStyle}>
                {["pending","confirmed","in-progress","completed","cancelled"].map((s) => (
                  <option key={s} value={s}>{s.replace(/-/g," ").replace(/\b\w/g,(c)=>c.toUpperCase())}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium" style={labelStyle}>Service Type</label>
              <select value={form.serviceType} onChange={set("serviceType")} className="px-3 py-2.5 rounded-lg text-sm" style={inputStyle}>
                <option value="in-shop">In-Shop</option>
                <option value="home-service">Home Service</option>
              </select>
            </div>
          </div>

          {/* Scheduled date */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium" style={labelStyle}>Scheduled Date & Time</label>
            <input type="datetime-local" value={form.scheduledAt} onChange={set("scheduledAt")}
              className="px-3 py-2.5 rounded-lg text-sm" style={inputStyle} />
          </div>

          {/* Service */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium" style={labelStyle}>Service</label>
            <select value={form.serviceId} onChange={set("serviceId")} className="px-3 py-2.5 rounded-lg text-sm" style={inputStyle}>
              <option value="">— No service —</option>
              {services.map((s) => <option key={s.id} value={s.id}>{s.name} (${Number(s.basePrice).toFixed(2)})</option>)}
            </select>
          </div>

          {/* Pricing */}
          <div className="grid grid-cols-2 gap-3">
            <Input label="Total Cost ($)" type="number" step="0.01" value={form.totalCost} onChange={set("totalCost")} placeholder="0.00" />
            <Input label="Booking Fee ($)" type="number" step="0.01" value={form.bookingFee} onChange={set("bookingFee")} placeholder="25.00" />
          </div>

          {/* Address (home service) */}
          <Input label="Customer Address" value={form.customerAddress} onChange={set("customerAddress")} placeholder="123 Main St…" />

          {/* Notes */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium" style={labelStyle}>Customer Notes</label>
            <textarea value={form.notes} onChange={set("notes")} rows={2} className="px-3 py-2.5 rounded-lg text-sm resize-none" style={inputStyle} />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium" style={labelStyle}>Mechanic Notes</label>
            <textarea value={form.mechanicNotes} onChange={set("mechanicNotes")} rows={2} className="px-3 py-2.5 rounded-lg text-sm resize-none" style={inputStyle} />
          </div>
        </div>

        {error && <p className="text-xs mt-3" style={{ color: "#ef4444" }}>{error}</p>}

        <div className="flex gap-2 mt-5">
          <button onClick={deleteApt} className="px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-1.5"
            style={{ backgroundColor: "rgba(239,68,68,0.12)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.25)" }}>
            <Trash2 size={13} /> Delete
          </button>
          <button onClick={onClose} className="flex-1 px-4 py-2 rounded-lg text-sm" style={{ border: "1px solid var(--color-border)", color: "var(--color-muted)" }}>Cancel</button>
          <button onClick={save} disabled={saving} className="flex-1 px-4 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-50" style={{ backgroundColor: "var(--color-red)" }}>
            {saving ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

/* ── Customer Row (expandable with vehicles) ── */
function CustomerRow({ customer, isSuperAdmin }: { customer: any; isSuperAdmin: boolean }) {
  const qc = useQueryClient();
  const [expanded, setExpanded] = useState(false);
  const [editCustomer, setEditCustomer] = useState(false);
  const [addVehicle, setAddVehicle] = useState(false);
  const [editVehicle, setEditVehicle] = useState<any | null>(null);

  const { data: vehicleData } = useQuery({
    queryKey: ["admin-vehicles", customer.id],
    queryFn: async () => {
      const r = await fetch(`/api/admin/customers/${customer.id}/vehicles`);
      return r.json() as Promise<{ vehicles: any[] }>;
    },
    enabled: expanded,
  });
  const vehicles: any[] = vehicleData?.vehicles ?? [];

  async function deleteVehicle(vehicleId: number) {
    if (!confirm("Delete this vehicle?")) return;
    await fetch(`/api/admin/customers/${customer.id}/vehicles/${vehicleId}`, { method: "DELETE" });
    qc.invalidateQueries({ queryKey: ["admin-vehicles", customer.id] });
  }

  async function deactivateCustomer() {
    if (!confirm(`Deactivate ${customer.name}?`)) return;
    await fetch("/api/admin/deactivate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId: customer.id }) });
    qc.invalidateQueries({ queryKey: ["admin-customers"] });
  }

  return (
    <>
      <tr style={{ borderBottom: "1px solid var(--color-border)" }}>
        <td className="px-4 py-3">
          <button onClick={() => setExpanded((e) => !e)} className="flex items-center gap-1" style={{ color: "var(--color-muted)" }}>
            <motion.span animate={{ rotate: expanded ? 90 : 0 }} transition={{ duration: 0.2 }}>
              <ChevronRight size={14} />
            </motion.span>
          </button>
        </td>
        <td className="px-4 py-3">
          <div className="text-sm font-medium" style={{ color: "var(--color-primary)" }}>{customer.name}</div>
          <div className="text-xs" style={{ color: "var(--color-muted)" }}>{customer.email}</div>
        </td>
        <td className="px-4 py-3 text-sm" style={{ color: "var(--color-secondary)" }}>{customer.phone ?? "—"}</td>
        <td className="px-4 py-3 text-sm" style={{ color: "var(--color-secondary)" }}>
          {customer.address ? (
            <span className="flex items-center gap-1"><MapPin size={12} />{customer.address.substring(0, 30)}{customer.address.length > 30 ? "…" : ""}</span>
          ) : "—"}
        </td>
        <td className="px-4 py-3">
          <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${customer.isActive ? "text-green-400 bg-green-400/10" : "text-red-400 bg-red-400/10"}`}>
            {customer.isActive ? "Active" : "Inactive"}
          </span>
        </td>
        <td className="px-4 py-3">
          <div className="flex items-center gap-1">
            <button onClick={() => setEditCustomer(true)} className="p-1.5 rounded-lg hover:bg-white/5" title="Edit">
              <Pencil size={13} style={{ color: "var(--color-muted)" }} />
            </button>
            <button onClick={() => setExpanded(true) || setAddVehicle(true)} className="p-1.5 rounded-lg hover:bg-white/5" title="Add Vehicle">
              <Car size={13} style={{ color: "#3b82f6" }} />
            </button>
            {customer.isActive && (
              <button onClick={deactivateCustomer} className="p-1.5 rounded-lg hover:bg-white/5" title="Deactivate">
                <XCircle size={13} style={{ color: "#ef4444" }} />
              </button>
            )}
          </div>
        </td>
      </tr>

      {/* Expanded vehicles sub-row */}
      <AnimatePresence>
        {expanded && (
          <tr>
            <td colSpan={6} className="px-0 py-0">
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }} className="overflow-hidden">
                <div className="mx-4 mb-3 mt-1 rounded-xl overflow-hidden" style={{ background: "var(--color-bg)", border: "1px solid var(--color-border)" }}>
                  <div className="flex items-center justify-between px-4 py-2.5 border-b" style={{ borderColor: "var(--color-border)" }}>
                    <span className="text-xs font-semibold uppercase tracking-wide flex items-center gap-1.5" style={{ color: "var(--color-muted)" }}>
                      <Car size={12} /> Vehicles
                    </span>
                    <button onClick={() => setAddVehicle(true)}
                      className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg font-medium"
                      style={{ backgroundColor: "rgba(59,130,246,0.12)", color: "#3b82f6" }}>
                      <Plus size={11} /> Add Vehicle
                    </button>
                  </div>
                  {vehicles.length === 0 ? (
                    <div className="px-4 py-4 text-xs" style={{ color: "var(--color-muted)" }}>No vehicles registered</div>
                  ) : (
                    <div className="divide-y" style={{ borderColor: "var(--color-border)" }}>
                      {vehicles.map((v) => (
                        <div key={v.id} className="flex items-center justify-between px-4 py-2.5">
                          <div>
                            <span className="text-sm font-medium" style={{ color: "var(--color-primary)" }}>{v.year} {v.make} {v.model}</span>
                            <span className="ml-2 text-xs" style={{ color: "var(--color-muted)" }}>
                              {v.color && `${v.color} · `}{v.licensePlate && `${v.licensePlate} · `}{v.mileage ? `${v.mileage.toLocaleString()} mi` : ""}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <button onClick={() => setEditVehicle(v)} className="p-1.5 rounded hover:bg-white/5">
                              <Pencil size={12} style={{ color: "var(--color-muted)" }} />
                            </button>
                            <button onClick={() => deleteVehicle(v.id)} className="p-1.5 rounded hover:bg-white/5">
                              <Trash2 size={12} style={{ color: "#ef4444" }} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            </td>
          </tr>
        )}
      </AnimatePresence>

      {/* Sub-modals */}
      {editCustomer && <CustomerModal customer={customer} onClose={() => setEditCustomer(false)} />}
      {addVehicle   && <VehicleModal customerId={customer.id} vehicle={null} onClose={() => setAddVehicle(false)} />}
      {editVehicle  && <VehicleModal customerId={customer.id} vehicle={editVehicle} onClose={() => setEditVehicle(null)} />}
    </>
  );
}

/* ── MAIN ── */
const TABS = ["Overview", "Services", "Appointments", "Customers", "Payments"] as const;
type Tab = typeof TABS[number];

export default function AdminPage() {
  const [, navigate] = useLocation();
  const [tab, setTab] = useState<Tab>("Overview");
  const [assignApt, setAssignApt]       = useState<any | null>(null);
  const [editPayment, setEditPayment]   = useState<any | null>(null);
  const [addCustomer, setAddCustomer]   = useState(false);
  const [createAdmin, setCreateAdmin]   = useState(false);
  const [editService, setEditService]   = useState<any | null>(null);
  const [addService, setAddService]     = useState(false);
  const [editApt, setEditApt]           = useState<any | null>(null);
  const [sellApt, setSellApt]           = useState<any | null>(null);

  const { data: session } = useQuery({ queryKey: ["session"], queryFn: () => authClient.getSession() });
  const user = (session as any)?.data?.user;

  if (session !== undefined && user?.role !== "admin") {
    navigate("/dashboard");
    return null;
  }

  const isSuperAdmin = user?.email === "m.sorsor@sonnietech.com";
  const qcMain = useQueryClient();

  async function deleteService(s: any) {
    if (!confirm(`Delete "${s.name}"? This cannot be undone.`)) return;
    await fetch(`/api/services/${s.id}`, { method: "DELETE" });
    qcMain.invalidateQueries({ queryKey: ["admin-services"] });
  }

  const { data: customersData } = useQuery({
    queryKey: ["admin-customers"],
    queryFn: async () => {
      const r = await fetch("/api/admin/users");
      return r.json() as Promise<{ users: any[] }>;
    },
  });

  const { data: appointmentsData } = useQuery({
    queryKey: ["admin-appointments"],
    queryFn: async () => {
      const r = await fetch("/api/appointments/all");
      return r.json() as Promise<{ appointments: any[] }>;
    },
  });

  const { data: paymentsData } = useQuery({
    queryKey: ["admin-payments"],
    queryFn: async () => {
      const r = await fetch("/api/payments/all");
      return r.json() as Promise<{ payments: any[] }>;
    },
  });

  const { data: servicesData } = useQuery({
    queryKey: ["admin-services"],
    queryFn: async () => {
      const r = await fetch("/api/services?all=true");
      return r.json() as Promise<any[]>;
    },
  });

  const allUsers: any[]       = customersData?.users ?? [];
  const appointments: any[]   = appointmentsData?.appointments ?? [];
  const payments: any[]       = paymentsData?.payments ?? [];
  const services: any[]       = Array.isArray(servicesData) ? servicesData : [];
  const mechanics             = allUsers.filter((u) => ["mechanic", "admin"].includes(u.role));
  const customers             = allUsers.filter((u) => u.role === "customer");

  const pending    = appointments.filter((a) => a.status === "pending").length;
  const inProgress = appointments.filter((a) => a.status === "in-progress").length;
  const completed  = appointments.filter((a) => a.status === "completed").length;
  const revenue    = payments.filter((p) => p.status === "paid").reduce((s, p) => s + Number(p.amount ?? 0), 0);
  const outstanding = payments.filter((p) => p.status === "pending").reduce((s, p) => s + Number(p.amount ?? 0), 0);

  const recentApts = [...appointments]
    .sort((a, b) => new Date(b.createdAt ?? b.scheduledAt).getTime() - new Date(a.createdAt ?? a.scheduledAt).getTime());

  return (
    <DashboardLayout title="Admin">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">

        {/* Header */}
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold uppercase tracking-wide" style={{ fontFamily: "Rajdhani", color: "var(--color-primary)" }}>
              Admin Dashboard
            </h1>
            <p className="text-sm mt-0.5" style={{ color: "var(--color-muted)" }}>Business overview & management</p>
          </div>
          {isSuperAdmin && (
            <button onClick={() => setCreateAdmin(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white"
              style={{ backgroundColor: "var(--color-red)" }}>
              <ShieldCheck size={15} /> Create Admin
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 rounded-xl w-fit" style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
          {TABS.map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className="px-5 py-2 rounded-lg text-sm font-semibold transition-all"
              style={{
                background: tab === t ? "var(--color-red)" : "transparent",
                color: tab === t ? "#fff" : "var(--color-muted)",
              }}>
              {t}
            </button>
          ))}
        </div>

        {/* ─── OVERVIEW TAB ─── */}
        {tab === "Overview" && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard icon={<Users size={20} color="#fff" />}           label="Customers"    value={customers.length}              color="rgba(224,32,32,0.25)"  delay={0}    />
              <StatCard icon={<Calendar size={20} color="#fff" />}        label="Appointments" value={appointments.length}            color="rgba(59,130,246,0.25)" delay={0.05} />
              <StatCard icon={<DollarSign size={20} color="#22c55e" />}   label="Revenue"      value={`$${revenue.toFixed(0)}`}      color="rgba(34,197,94,0.2)"   delay={0.1}  />
              <StatCard icon={<AlertCircle size={20} color="#f59e0b" />}  label="Outstanding"  value={`$${outstanding.toFixed(0)}`}  color="rgba(245,158,11,0.2)"  delay={0.15} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="glass rounded-xl p-6">
                <h3 className="text-base font-bold uppercase tracking-wide mb-4" style={{ fontFamily: "Rajdhani" }}>Appointment Status</h3>
                {[
                  { label: "Pending",     count: pending,    color: "#f59e0b" },
                  { label: "In Progress", count: inProgress, color: "#8b5cf6" },
                  { label: "Completed",   count: completed,  color: "#22c55e" },
                  { label: "Cancelled",   count: appointments.filter((a) => a.status === "cancelled").length, color: "#ef4444" },
                ].map((item) => (
                  <div key={item.label} className="mb-3">
                    <div className="flex justify-between text-sm mb-1" style={{ color: "var(--color-secondary)" }}>
                      <span>{item.label}</span><span style={{ color: item.color, fontWeight: 600 }}>{item.count}</span>
                    </div>
                    <div className="h-1.5 rounded-full" style={{ backgroundColor: "var(--color-border)" }}>
                      <motion.div initial={{ width: 0 }}
                        animate={{ width: appointments.length ? `${(item.count / appointments.length) * 100}%` : "0%" }}
                        transition={{ duration: 0.8, delay: 0.3 }}
                        className="h-full rounded-full" style={{ backgroundColor: item.color }} />
                    </div>
                  </div>
                ))}
              </div>

              <div className="glass rounded-xl p-6">
                <h3 className="text-base font-bold uppercase tracking-wide mb-4" style={{ fontFamily: "Rajdhani" }}>Quick Actions</h3>
                <div className="space-y-3">
                  {[
                    { label: "Manage Customers",    action: () => setTab("Customers"),    icon: <Users size={16} /> },
                    { label: "Manage Services",     action: () => setTab("Services"),     icon: <Wrench size={16} /> },
                    { label: "Manage Appointments", action: () => setTab("Appointments"), icon: <Calendar size={16} /> },
                    { label: "Manage Payments",     action: () => setTab("Payments"),     icon: <CreditCard size={16} /> },
                    { label: "Seed Services",       action: () => fetch("/api/services/seed", { method: "POST" }).then(() => alert("Services seeded!")), icon: <TrendingUp size={16} /> },
                  ].map((item) => (
                    <motion.button key={item.label} whileHover={{ x: 4 }} onClick={item.action}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-left"
                      style={{ background: "var(--color-bg)", border: "1px solid var(--color-border)", color: "var(--color-secondary)" }}>
                      <span style={{ color: "var(--color-red)" }}>{item.icon}</span>{item.label}
                    </motion.button>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}

        {/* ─── APPOINTMENTS TAB ─── */}
        {tab === "Appointments" && (
          <div className="glass rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b" style={{ borderColor: "var(--color-border)" }}>
              <h3 className="text-base font-bold uppercase tracking-wide" style={{ fontFamily: "Rajdhani" }}>All Appointments</h3>
            </div>
            {recentApts.length === 0 ? (
              <div className="p-12 text-center" style={{ color: "var(--color-muted)" }}>No appointments yet</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr style={{ borderBottom: "1px solid var(--color-border)" }}>
                      {["#", "Customer", "Vehicle", "Date", "Service", "Status", "Mechanic", "Total", "Actions"].map((h) => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--color-muted)" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {recentApts.map((apt, i) => (
                      <motion.tr key={apt.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: Math.min(i * 0.03, 0.5) }}
                        style={{ borderBottom: "1px solid var(--color-border)" }}>
                        <td className="px-4 py-3 text-sm font-mono" style={{ color: "var(--color-muted)" }}>#{apt.id}</td>
                        <td className="px-4 py-3">
                          <div className="text-sm font-medium" style={{ color: "var(--color-primary)" }}>{apt.customerName ?? "—"}</div>
                          {apt.customerPhone && <div className="text-xs" style={{ color: "var(--color-muted)" }}>{apt.customerPhone}</div>}
                        </td>
                        <td className="px-4 py-3 text-sm" style={{ color: "var(--color-secondary)" }}>
                          {apt.vehicleMake ? `${apt.vehicleYear ?? ""} ${apt.vehicleMake} ${apt.vehicleModel ?? ""}`.trim() : <span style={{ color: "var(--color-muted)" }}>—</span>}
                        </td>
                        <td className="px-4 py-3 text-sm" style={{ color: "var(--color-secondary)" }}>{new Date(apt.scheduledAt ?? apt.createdAt).toLocaleDateString()}</td>
                        <td className="px-4 py-3 text-sm" style={{ color: "var(--color-secondary)" }}>
                          <div>{apt.serviceName ?? <span style={{ color: "var(--color-muted)" }}>—</span>}</div>
                          <div className="text-xs capitalize" style={{ color: "var(--color-muted)" }}>{apt.serviceType}</div>
                        </td>
                        <td className="px-4 py-3"><AptStatusSelect apt={apt} /></td>
                        <td className="px-4 py-3 text-sm" style={{ color: "var(--color-secondary)" }}>{apt.mechanicName ?? <span style={{ color: "var(--color-muted)" }}>—</span>}</td>
                        <td className="px-4 py-3 text-sm font-semibold" style={{ color: apt.totalCost ? "var(--color-red)" : "var(--color-muted)" }}>
                          {apt.totalCost ? `${Number(apt.totalCost).toFixed(2)}` : "—"}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1 flex-wrap">
                            <button onClick={() => setEditApt(apt)} className="p-1.5 rounded-lg hover:bg-white/5" title="Edit">
                              <Pencil size={13} style={{ color: "var(--color-muted)" }} />
                            </button>
                            <button onClick={() => setAssignApt(apt)} className="text-xs px-2 py-1 rounded-lg font-medium whitespace-nowrap" style={{ backgroundColor: "rgba(59,130,246,0.12)", color: "#3b82f6" }}>
                              <UserCheck size={10} className="inline mr-0.5" />Assign
                            </button>
                            {apt.status !== "completed" && apt.status !== "cancelled" && (
                              <button onClick={() => setSellApt(apt)} className="text-xs px-2 py-1 rounded-lg font-semibold whitespace-nowrap flex items-center gap-1"
                                style={{ backgroundColor: "rgba(34,197,94,0.12)", color: "#22c55e", border: "1px solid rgba(34,197,94,0.25)" }}>
                                <ShoppingCart size={10} />Sell
                              </button>
                            )}
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ─── SERVICES TAB ─── */}
        {tab === "Services" && (
          <div className="glass rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: "var(--color-border)" }}>
              <h3 className="text-base font-bold uppercase tracking-wide" style={{ fontFamily: "Rajdhani" }}>Services</h3>
              <button onClick={() => setAddService(true)}
                className="flex items-center gap-1.5 text-sm px-4 py-2 rounded-xl font-semibold text-white"
                style={{ backgroundColor: "var(--color-red)" }}>
                <Plus size={14} /> Add Service
              </button>
            </div>
            {services.length === 0 ? (
              <div className="p-12 text-center space-y-3" style={{ color: "var(--color-muted)" }}>
                <p>No services yet.</p>
                <button onClick={() => fetch("/api/services/seed", { method: "POST" }).then(() => window.location.reload())}
                  className="text-sm px-4 py-2 rounded-lg font-medium" style={{ backgroundColor: "rgba(224,32,32,0.12)", color: "var(--color-red)" }}>
                  Seed Default Services
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr style={{ borderBottom: "1px solid var(--color-border)" }}>
                      {["#", "Name", "Category", "Price", "Duration", "Status", "Actions"].map((h) => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--color-muted)" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {services.map((s, i) => (
                      <motion.tr key={s.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                        style={{ borderBottom: "1px solid var(--color-border)", opacity: s.isActive ? 1 : 0.5 }}>
                        <td className="px-4 py-3 text-sm font-mono" style={{ color: "var(--color-muted)" }}>#{s.id}</td>
                        <td className="px-4 py-3">
                          <div className="text-sm font-medium" style={{ color: "var(--color-primary)" }}>{s.name}</div>
                          {s.description && <div className="text-xs mt-0.5 max-w-xs truncate" style={{ color: "var(--color-muted)" }}>{s.description}</div>}
                        </td>
                        <td className="px-4 py-3 text-sm" style={{ color: "var(--color-secondary)" }}>
                          <span className="flex items-center gap-1"><Tag size={11} />{s.category}</span>
                        </td>
                        <td className="px-4 py-3 text-sm font-bold" style={{ color: "var(--color-red)" }}>${Number(s.basePrice).toFixed(2)}</td>
                        <td className="px-4 py-3 text-sm" style={{ color: "var(--color-secondary)" }}>
                          <span className="flex items-center gap-1"><Timer size={11} />{s.durationMinutes} min</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${s.isActive ? "text-green-400 bg-green-400/10" : "text-red-400 bg-red-400/10"}`}>
                            {s.isActive ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            <button onClick={() => setEditService(s)} className="p-1.5 rounded hover:bg-white/5" title="Edit">
                              <Pencil size={13} style={{ color: "var(--color-muted)" }} />
                            </button>
                            <button onClick={() => deleteService(s)} className="p-1.5 rounded hover:bg-white/5" title="Delete">
                              <Trash2 size={13} style={{ color: "#ef4444" }} />
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ─── CUSTOMERS TAB ─── */}
        {tab === "Customers" && (
          <div className="glass rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: "var(--color-border)" }}>
              <h3 className="text-base font-bold uppercase tracking-wide" style={{ fontFamily: "Rajdhani" }}>Customers</h3>
              <button onClick={() => setAddCustomer(true)}
                className="flex items-center gap-1.5 text-sm px-4 py-2 rounded-xl font-semibold text-white"
                style={{ backgroundColor: "var(--color-red)" }}>
                <Plus size={14} /> Add Customer
              </button>
            </div>
            {customers.length === 0 ? (
              <div className="p-12 text-center" style={{ color: "var(--color-muted)" }}>No customers yet</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr style={{ borderBottom: "1px solid var(--color-border)" }}>
                      <th className="px-4 py-3 w-8" />
                      {["Customer", "Phone", "Address", "Status", "Actions"].map((h) => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--color-muted)" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {customers.map((c) => (
                      <CustomerRow key={c.id} customer={c} isSuperAdmin={isSuperAdmin} />
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ─── PAYMENTS TAB ─── */}
        {tab === "Payments" && (
          <div className="glass rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b" style={{ borderColor: "var(--color-border)" }}>
              <h3 className="text-base font-bold uppercase tracking-wide" style={{ fontFamily: "Rajdhani" }}>Payments</h3>
            </div>
            {payments.length === 0 ? (
              <div className="p-12 text-center" style={{ color: "var(--color-muted)" }}>No payments on record</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr style={{ borderBottom: "1px solid var(--color-border)" }}>
                      {["#", "Appt", "Customer", "Amount", "Method", "Status", "Date", "Action"].map((h) => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--color-muted)" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[...payments].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map((p, i) => (
                      <motion.tr key={p.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 + i * 0.03 }}
                        style={{ borderBottom: "1px solid var(--color-border)" }}>
                        <td className="px-4 py-3 text-sm font-mono" style={{ color: "var(--color-muted)" }}>#{p.id}</td>
                        <td className="px-4 py-3 text-sm" style={{ color: "var(--color-secondary)" }}>#{p.appointmentId ?? "—"}</td>
                        <td className="px-4 py-3 text-sm" style={{ color: "var(--color-secondary)" }}>{p.customerName ?? "—"}</td>
                        <td className="px-4 py-3 text-sm font-bold" style={{ color: "var(--color-primary)" }}>${Number(p.amount).toFixed(2)}</td>
                        <td className="px-4 py-3 text-sm capitalize" style={{ color: "var(--color-secondary)" }}>{p.method}</td>
                        <td className="px-4 py-3"><StatusBadge status={p.status} /></td>
                        <td className="px-4 py-3 text-sm" style={{ color: "var(--color-muted)" }}>{new Date(p.createdAt).toLocaleDateString()}</td>
                        <td className="px-4 py-3">
                          <button onClick={() => setEditPayment(p)} className="text-xs px-2.5 py-1 rounded-lg font-medium" style={{ backgroundColor: "rgba(224,32,32,0.1)", color: "var(--color-red)" }}>
                            Update
                          </button>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

      </motion.div>

      {/* Modals */}
      <AnimatePresence>
        {assignApt   && <AssignMechanicModal apt={assignApt} mechanics={mechanics} onClose={() => setAssignApt(null)} />}
        {editPayment && <PaymentModal payment={editPayment} onClose={() => setEditPayment(null)} />}
        {addCustomer && <CustomerModal customer={null} onClose={() => setAddCustomer(false)} />}
        {createAdmin && <CreateAdminModal onClose={() => setCreateAdmin(false)} />}
        {addService  && <ServiceModal service={null} onClose={() => setAddService(false)} />}
        {editService && <ServiceModal service={editService} onClose={() => setEditService(null)} />}
        {editApt     && <EditAppointmentModal apt={editApt} services={services} onClose={() => setEditApt(null)} />}
        {sellApt     && <SellModal apt={sellApt} onClose={() => setSellApt(null)} />}
      </AnimatePresence>
    </DashboardLayout>
  );
}
