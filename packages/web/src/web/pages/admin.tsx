import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useLocation } from "wouter";
import { DashboardLayout } from "../components/dashboard-layout";
import { authClient } from "../lib/auth";
import { api } from "../lib/api";
import {
  Users, Calendar, Wrench, TrendingUp, Clock, CheckCircle,
  XCircle, AlertCircle, CreditCard, DollarSign, UserCheck, ChevronDown
} from "lucide-react";

function StatCard({ icon, label, value, color, delay }: {
  icon: React.ReactNode; label: string; value: string | number; color: string; delay: number;
}) {
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

const STATUS_COLOR: Record<string, string> = {
  pending: "#f59e0b", confirmed: "#3b82f6", completed: "#22c55e",
  cancelled: "#ef4444", "in-progress": "#8b5cf6",
};

function StatusBadge({ status }: { status: string }) {
  const color = STATUS_COLOR[status] ?? "#888";
  return (
    <span className="inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full font-semibold"
      style={{ color, backgroundColor: `${color}22` }}>
      {status.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
    </span>
  );
}

/* ── Assign mechanic modal ── */
function AssignMechanicModal({ apt, mechanics, onClose }: { apt: any; mechanics: any[]; onClose: () => void }) {
  const qc = useQueryClient();
  const [mechanicId, setMechanicId] = useState(apt.mechanicId ?? "");
  const [saving, setSaving] = useState(false);

  async function assign() {
    setSaving(true);
    await fetch(`/api/appointments/${apt.id}/assign`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mechanicId: mechanicId || null }),
    });
    qc.invalidateQueries({ queryKey: ["admin-appointments"] });
    setSaving(false);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}>
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-sm rounded-2xl p-6"
        style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
        <h2 className="text-lg font-bold mb-1" style={{ fontFamily: "Rajdhani" }}>Assign Mechanic</h2>
        <p className="text-sm mb-4" style={{ color: "var(--color-muted)" }}>Appointment #{apt.id}</p>
        <select value={mechanicId} onChange={(e) => setMechanicId(e.target.value)}
          className="w-full px-3 py-2.5 rounded-lg text-sm mb-4"
          style={{ background: "var(--color-bg)", border: "1px solid var(--color-border)", color: "var(--color-primary)" }}>
          <option value="">— Unassigned —</option>
          {mechanics.map((m: any) => (
            <option key={m.id} value={m.id}>{m.name ?? m.email}</option>
          ))}
        </select>
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 px-4 py-2 rounded-lg text-sm font-medium"
            style={{ border: "1px solid var(--color-border)", color: "var(--color-muted)" }}>Cancel</button>
          <button onClick={assign} disabled={saving}
            className="flex-1 px-4 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-50"
            style={{ backgroundColor: "var(--color-red)" }}>
            {saving ? "Saving…" : "Assign"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

/* ── Update payment status modal ── */
function PaymentModal({ payment, onClose }: { payment: any; onClose: () => void }) {
  const qc = useQueryClient();
  const [status, setStatus] = useState(payment.status);
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    await fetch(`/api/payments/${payment.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    qc.invalidateQueries({ queryKey: ["admin-payments"] });
    setSaving(false);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}>
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-sm rounded-2xl p-6"
        style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
        <h2 className="text-lg font-bold mb-1" style={{ fontFamily: "Rajdhani" }}>Update Payment</h2>
        <p className="text-sm mb-4" style={{ color: "var(--color-muted)" }}>
          Payment #{payment.id} · ${Number(payment.amount).toFixed(2)} via {payment.method}
        </p>
        <select value={status} onChange={(e) => setStatus(e.target.value)}
          className="w-full px-3 py-2.5 rounded-lg text-sm mb-4"
          style={{ background: "var(--color-bg)", border: "1px solid var(--color-border)", color: "var(--color-primary)" }}>
          <option value="pending">Pending</option>
          <option value="paid">Paid</option>
          <option value="overdue">Overdue</option>
          <option value="refunded">Refunded</option>
        </select>
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 px-4 py-2 rounded-lg text-sm font-medium"
            style={{ border: "1px solid var(--color-border)", color: "var(--color-muted)" }}>Cancel</button>
          <button onClick={save} disabled={saving}
            className="flex-1 px-4 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-50"
            style={{ backgroundColor: "var(--color-red)" }}>
            {saving ? "Saving…" : "Update"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

/* ── Appointment status update inline ── */
function AptStatusSelect({ apt }: { apt: any }) {
  const qc = useQueryClient();
  const [val, setVal] = useState(apt.status);

  async function update(newStatus: string) {
    setVal(newStatus);
    await fetch(`/api/appointments/${apt.id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    qc.invalidateQueries({ queryKey: ["admin-appointments"] });
  }

  return (
    <select value={val} onChange={(e) => update(e.target.value)}
      className="text-xs px-2 py-1 rounded-lg font-semibold"
      style={{
        background: `${STATUS_COLOR[val] ?? "#888"}18`,
        color: STATUS_COLOR[val] ?? "#888",
        border: `1px solid ${STATUS_COLOR[val] ?? "#888"}44`,
        outline: "none",
      }}>
      {["pending","confirmed","in-progress","completed","cancelled"].map((s) => (
        <option key={s} value={s}>{s.replace(/-/g," ").replace(/\b\w/g,(c)=>c.toUpperCase())}</option>
      ))}
    </select>
  );
}

/* ── Main ── */
export default function AdminPage() {
  const [, navigate] = useLocation();
  const [assignApt, setAssignApt]   = useState<any | null>(null);
  const [editPayment, setEditPayment] = useState<any | null>(null);

  const { data: session } = useQuery({
    queryKey: ["session"],
    queryFn: () => authClient.getSession(),
  });
  const user = (session as any)?.data?.user;

  if (session !== undefined && (user as any)?.role !== "admin") {
    navigate("/dashboard");
    return null;
  }

  const { data: usersData } = useQuery({
    queryKey: ["admin-users"],
    queryFn: () => api.users.$get().then((r) => r.json()) as Promise<{ users: any[] }>,
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

  const appointments: any[] = appointmentsData?.appointments ?? [];
  const users: any[]        = (usersData as any)?.users ?? [];
  const payments: any[]     = paymentsData?.payments ?? [];

  const mechanics = users.filter((u: any) => ["mechanic", "admin"].includes(u.role));

  const pending     = appointments.filter((a) => a.status === "pending").length;
  const inProgress  = appointments.filter((a) => a.status === "in-progress").length;
  const completed   = appointments.filter((a) => a.status === "completed").length;

  const revenue = payments.filter((p) => p.status === "paid").reduce((s, p) => s + Number(p.amount ?? 0), 0);
  const outstanding = payments.filter((p) => p.status === "pending").reduce((s, p) => s + Number(p.amount ?? 0), 0);

  const recentApts = [...appointments]
    .sort((a, b) => new Date(b.createdAt ?? b.scheduledAt).getTime() - new Date(a.createdAt ?? a.scheduledAt).getTime())
    .slice(0, 12);

  return (
    <DashboardLayout title="Admin">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">

        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold uppercase tracking-wide" style={{ fontFamily: "Rajdhani", color: "var(--color-primary)" }}>
            Admin Dashboard
          </h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--color-muted)" }}>Business overview & management</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard icon={<Users size={20} color="#fff" />}            label="Total Users"  value={users.length}    color="rgba(224,32,32,0.25)"  delay={0}    />
          <StatCard icon={<Calendar size={20} color="#fff" />}         label="Appointments" value={appointments.length} color="rgba(59,130,246,0.25)" delay={0.05} />
          <StatCard icon={<DollarSign size={20} color="#22c55e" />}    label="Revenue"      value={`$${revenue.toFixed(0)}`} color="rgba(34,197,94,0.2)" delay={0.1}  />
          <StatCard icon={<AlertCircle size={20} color="#f59e0b" />}   label="Outstanding"  value={`$${outstanding.toFixed(0)}`} color="rgba(245,158,11,0.2)" delay={0.15} />
        </div>

        {/* Status breakdown + Quick actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Status bars */}
          <div className="glass rounded-xl p-6">
            <h3 className="text-base font-bold uppercase tracking-wide mb-4" style={{ fontFamily: "Rajdhani" }}>
              Appointment Status
            </h3>
            {[
              { label: "Pending",     count: pending,    color: "#f59e0b" },
              { label: "In Progress", count: inProgress, color: "#8b5cf6" },
              { label: "Completed",   count: completed,  color: "#22c55e" },
              { label: "Cancelled",   count: appointments.filter((a) => a.status === "cancelled").length, color: "#ef4444" },
            ].map((item) => (
              <div key={item.label} className="mb-3">
                <div className="flex justify-between text-sm mb-1" style={{ color: "var(--color-secondary)" }}>
                  <span>{item.label}</span>
                  <span style={{ color: item.color, fontWeight: 600 }}>{item.count}</span>
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

          {/* Quick actions */}
          <div className="glass rounded-xl p-6">
            <h3 className="text-base font-bold uppercase tracking-wide mb-4" style={{ fontFamily: "Rajdhani" }}>
              Quick Actions
            </h3>
            <div className="space-y-3">
              {[
                { label: "View All Appointments", href: "/dashboard/appointments", icon: <Calendar size={16} /> },
                { label: "Manage Vehicles",       href: "/dashboard/vehicles",     icon: <Wrench size={16} /> },
                { label: "Seed Services",         action: "seed",                  icon: <TrendingUp size={16} /> },
              ].map((item) =>
                item.href ? (
                  <Link key={item.label} to={item.href}>
                    <motion.div whileHover={{ x: 4 }}
                      className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium cursor-pointer"
                      style={{ background: "var(--color-bg)", border: "1px solid var(--color-border)", color: "var(--color-secondary)" }}>
                      <span style={{ color: "var(--color-red)" }}>{item.icon}</span>
                      {item.label}
                    </motion.div>
                  </Link>
                ) : (
                  <motion.button key={item.label} whileHover={{ x: 4 }}
                    onClick={() => fetch("/api/services/seed", { method: "POST" }).then(() => alert("Services seeded!"))}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-left"
                    style={{ background: "var(--color-bg)", border: "1px solid var(--color-border)", color: "var(--color-secondary)" }}>
                    <span style={{ color: "var(--color-red)" }}>{item.icon}</span>
                    {item.label}
                  </motion.button>
                )
              )}
            </div>
          </div>
        </div>

        {/* Appointments table */}
        <div className="glass rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: "var(--color-border)" }}>
            <h3 className="text-base font-bold uppercase tracking-wide" style={{ fontFamily: "Rajdhani" }}>All Appointments</h3>
          </div>
          {recentApts.length === 0 ? (
            <div className="p-12 text-center" style={{ color: "var(--color-muted)" }}>No appointments yet</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--color-border)" }}>
                    {["#", "Customer", "Date", "Type", "Status", "Mechanic", "Total", "Actions"].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide"
                        style={{ color: "var(--color-muted)" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {recentApts.map((apt: any, i: number) => (
                    <motion.tr key={apt.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 + i * 0.03 }}
                      style={{ borderBottom: "1px solid var(--color-border)" }}>
                      <td className="px-4 py-3 text-sm font-mono" style={{ color: "var(--color-muted)" }}>#{apt.id}</td>
                      <td className="px-4 py-3 text-sm" style={{ color: "var(--color-secondary)" }}>
                        {apt.customerName ?? apt.userId ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-sm" style={{ color: "var(--color-secondary)" }}>
                        {new Date(apt.scheduledAt ?? apt.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-sm capitalize" style={{ color: "var(--color-secondary)" }}>
                        {apt.serviceType ?? "—"}
                      </td>
                      <td className="px-4 py-3">
                        <AptStatusSelect apt={apt} />
                      </td>
                      <td className="px-4 py-3 text-sm" style={{ color: "var(--color-secondary)" }}>
                        {apt.mechanicName ?? <span style={{ color: "var(--color-muted)" }}>—</span>}
                      </td>
                      <td className="px-4 py-3 text-sm font-semibold" style={{ color: "var(--color-red)" }}>
                        {apt.totalCost ? `$${Number(apt.totalCost).toFixed(2)}` : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <button onClick={() => setAssignApt(apt)}
                          className="text-xs px-2.5 py-1 rounded-lg font-medium whitespace-nowrap"
                          style={{ backgroundColor: "rgba(59,130,246,0.12)", color: "#3b82f6" }}>
                          <UserCheck size={11} className="inline mr-1" />
                          Assign
                        </button>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Payments table */}
        <div className="glass rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: "var(--color-border)" }}>
            <h3 className="text-base font-bold uppercase tracking-wide" style={{ fontFamily: "Rajdhani" }}>Payments</h3>
          </div>
          {payments.length === 0 ? (
            <div className="p-12 text-center" style={{ color: "var(--color-muted)" }}>No payments on record</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--color-border)" }}>
                    {["#", "Appt", "Customer", "Amount", "Method", "Status", "Date", "Actions"].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide"
                        style={{ color: "var(--color-muted)" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[...payments].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map((p: any, i: number) => (
                    <motion.tr key={p.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 + i * 0.03 }}
                      style={{ borderBottom: "1px solid var(--color-border)" }}>
                      <td className="px-4 py-3 text-sm font-mono" style={{ color: "var(--color-muted)" }}>#{p.id}</td>
                      <td className="px-4 py-3 text-sm" style={{ color: "var(--color-secondary)" }}>#{p.appointmentId ?? "—"}</td>
                      <td className="px-4 py-3 text-sm" style={{ color: "var(--color-secondary)" }}>{p.customerName ?? "—"}</td>
                      <td className="px-4 py-3 text-sm font-bold" style={{ color: "var(--color-primary)" }}>${Number(p.amount).toFixed(2)}</td>
                      <td className="px-4 py-3 text-sm capitalize" style={{ color: "var(--color-secondary)" }}>{p.method}</td>
                      <td className="px-4 py-3"><StatusBadge status={p.status} /></td>
                      <td className="px-4 py-3 text-sm" style={{ color: "var(--color-muted)" }}>
                        {new Date(p.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <button onClick={() => setEditPayment(p)}
                          className="text-xs px-2.5 py-1 rounded-lg font-medium"
                          style={{ backgroundColor: "rgba(224,32,32,0.1)", color: "var(--color-red)" }}>
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

      </motion.div>

      {/* Modals */}
      <AnimatePresence>
        {assignApt  && <AssignMechanicModal apt={assignApt} mechanics={mechanics} onClose={() => setAssignApt(null)} />}
        {editPayment && <PaymentModal payment={editPayment} onClose={() => setEditPayment(null)} />}
      </AnimatePresence>
    </DashboardLayout>
  );
}
