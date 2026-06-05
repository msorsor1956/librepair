import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Link, useRoute } from "wouter";
import { api } from "../lib/api";
import { DashboardLayout } from "../components/dashboard-layout";
import {
  Calendar, Plus, Wrench, Clock, MapPin, ChevronRight,
  Package, StickyNote, CheckCircle, Circle, CreditCard,
  Car, User, ArrowLeft
} from "lucide-react";

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { color: string; bg: string }> = {
    pending:    { color: "#f59e0b", bg: "rgba(245,158,11,0.12)" },
    confirmed:  { color: "#3b82f6", bg: "rgba(59,130,246,0.12)" },
    "in-progress": { color: "var(--color-red)", bg: "rgba(224,32,32,0.12)" },
    completed:  { color: "#22c55e", bg: "rgba(34,197,94,0.12)" },
    cancelled:  { color: "#6b7280", bg: "rgba(107,114,128,0.12)" },
  };
  const s = map[status] ?? { color: "var(--color-muted)", bg: "rgba(255,255,255,0.06)" };
  return (
    <span className="text-xs px-2.5 py-1 rounded-full font-semibold"
      style={{ color: s.color, backgroundColor: s.bg }}>
      {status.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
    </span>
  );
}

const STEPS = [
  { key: "pending",     label: "Booked" },
  { key: "confirmed",   label: "Confirmed" },
  { key: "in-progress", label: "In Progress" },
  { key: "completed",   label: "Completed" },
];

function ProgressTracker({ status }: { status: string }) {
  const current = STEPS.findIndex((s) => s.key === status);
  if (status === "cancelled") {
    return (
      <div className="flex items-center gap-2 text-sm" style={{ color: "#6b7280" }}>
        <Circle size={14} /> Appointment cancelled
      </div>
    );
  }
  return (
    <div className="flex items-center gap-0">
      {STEPS.map((step, i) => {
        const done = i <= current;
        const active = i === current;
        return (
          <div key={step.key} className="flex items-center">
            <div className="flex flex-col items-center gap-1">
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all"
                style={{
                  borderColor: done ? "var(--color-red)" : "var(--color-border)",
                  backgroundColor: done ? (active ? "var(--color-red)" : "rgba(224,32,32,0.15)") : "transparent",
                  color: done ? (active ? "#fff" : "var(--color-red)") : "var(--color-muted)",
                  boxShadow: active ? "0 0 0 3px rgba(224,32,32,0.25)" : "none",
                }}>
                {done && !active ? <CheckCircle size={14} /> : i + 1}
              </div>
              <span className="text-xs whitespace-nowrap" style={{ color: done ? "var(--color-primary)" : "var(--color-muted)", fontWeight: done ? 600 : 400 }}>
                {step.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className="h-0.5 w-8 mb-4 mx-1" style={{ backgroundColor: i < current ? "var(--color-red)" : "var(--color-border)" }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ─── Detail View ─────────────────────────────────────── */
function AppointmentDetail({ id }: { id: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ["appointment", id],
    queryFn: async () => {
      const r = await fetch(`/api/appointments/${id}`);
      return r.json();
    },
  });

  // API returns flat object with parts[] and payments[] merged in
  const apt = data && !data.message ? data : null;
  const parts: any[] = data?.parts ?? [];
  const payments: any[] = data?.payments ?? [];
  const payment = payments[0]; // show first payment (booking fee)
  // mechanic notes stored as JSON string
  let notes: any[] = [];
  try { notes = apt?.mechanicNotes ? JSON.parse(apt.mechanicNotes) : []; } catch { notes = []; }

  if (isLoading) return (
    <DashboardLayout title="Appointment Detail">
      <div className="space-y-4 max-w-3xl">
        {[1, 2, 3].map((i) => <div key={i} className="glass rounded-xl h-24 animate-pulse" />)}
      </div>
    </DashboardLayout>
  );

  if (!apt) return (
    <DashboardLayout title="Appointment Not Found">
      <div className="glass rounded-xl p-14 text-center max-w-lg">
        <p style={{ color: "var(--color-muted)" }}>Appointment #{id} not found or you don't have access.</p>
        <Link to="/dashboard/appointments">
          <button className="mt-5 px-5 py-2 rounded-lg text-sm font-semibold text-white" style={{ backgroundColor: "var(--color-red)" }}>
            Back to Appointments
          </button>
        </Link>
      </div>
    </DashboardLayout>
  );

  const partsTotal = parts.reduce((s: number, p: any) => s + Number(p.totalCost ?? 0), 0);

  return (
    <DashboardLayout title={`Appointment #${id}`}>
      <div className="max-w-3xl space-y-5">
        {/* Back */}
        <Link to="/dashboard/appointments">
          <button className="flex items-center gap-2 text-sm" style={{ color: "var(--color-muted)" }}>
            <ArrowLeft size={14} /> Back to appointments
          </button>
        </Link>

        {/* Header card */}
        <div className="glass rounded-xl p-6">
          <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
            <div>
              <h2 className="text-xl font-bold" style={{ fontFamily: "Rajdhani" }}>
                Service Appointment
              </h2>
              <p className="text-xs mt-0.5" style={{ color: "var(--color-muted)" }}>#{id}</p>
            </div>
            <StatusBadge status={apt.status} />
          </div>

          {/* Progress tracker */}
          <div className="overflow-x-auto pb-1">
            <ProgressTracker status={apt.status} />
          </div>

          {/* Details row */}
          <div className="grid grid-cols-2 gap-4 mt-5 pt-5 border-t" style={{ borderColor: "var(--color-border)" }}>
            <div>
              <div className="text-xs mb-1" style={{ color: "var(--color-muted)" }}>Scheduled</div>
              <div className="text-sm font-semibold flex items-center gap-1.5">
                <Clock size={13} style={{ color: "var(--color-red)" }} />
                {new Date(apt.scheduledAt).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" })}
              </div>
            </div>
            <div>
              <div className="text-xs mb-1" style={{ color: "var(--color-muted)" }}>Service Type</div>
              <div className="text-sm font-semibold flex items-center gap-1.5">
                <MapPin size={13} style={{ color: "var(--color-red)" }} />
                {apt.serviceType === "home-service" ? "Home Service" : "In-Shop"}
              </div>
            </div>
            {(apt.vehicleMake || apt.vehicleModel) && (
              <div>
                <div className="text-xs mb-1" style={{ color: "var(--color-muted)" }}>Vehicle</div>
                <div className="text-sm font-semibold flex items-center gap-1.5">
                  <Car size={13} style={{ color: "var(--color-red)" }} />
                  {apt.vehicleYear} {apt.vehicleMake} {apt.vehicleModel}
                  {apt.vehiclePlate && <span className="text-xs opacity-60">· {apt.vehiclePlate}</span>}
                </div>
              </div>
            )}
            {apt.mechanicId && (
              <div>
                <div className="text-xs mb-1" style={{ color: "var(--color-muted)" }}>Mechanic Assigned</div>
                <div className="text-sm font-semibold flex items-center gap-1.5">
                  <User size={13} style={{ color: "var(--color-red)" }} />
                  Assigned
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Payment status */}
        {payment && (
          <div className="glass rounded-xl p-5">
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <CreditCard size={14} style={{ color: "var(--color-red)" }} /> Payment
            </h3>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm" style={{ color: "var(--color-muted)" }}>
                  {payment.description ?? "Service payment"}
                </div>
                <div className="text-xs mt-0.5 capitalize" style={{ color: "var(--color-muted)" }}>
                  via {payment.method}
                </div>
              </div>
              <div className="text-right">
                <div className="text-xl font-bold" style={{ fontFamily: "Rajdhani" }}>
                  ${Number(payment.amount).toFixed(2)}
                </div>
                <StatusBadge status={payment.status} />
              </div>
            </div>
          </div>
        )}

        {/* Parts used */}
        {parts.length > 0 && (
          <div className="glass rounded-xl p-5">
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Package size={14} style={{ color: "var(--color-red)" }} /> Parts & Materials
            </h3>
            <div className="space-y-2">
              {parts.map((part: any) => (
                <div key={part.id} className="flex items-center justify-between py-2 border-b last:border-0" style={{ borderColor: "var(--color-border)" }}>
                  <div>
                    <div className="text-sm font-medium">{part.name}</div>
                    <div className="text-xs mt-0.5" style={{ color: "var(--color-muted)" }}>
                      Qty: {part.quantity} × ${Number(part.unitPrice).toFixed(2)}
                    </div>
                  </div>
                  <div className="font-bold text-sm">${Number(part.totalCost).toFixed(2)}</div>
                </div>
              ))}
              <div className="flex justify-between pt-2 font-bold text-sm">
                <span>Parts Total</span>
                <span style={{ color: "var(--color-red)" }}>${partsTotal.toFixed(2)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Mechanic notes */}
        {notes.length > 0 && (
          <div className="glass rounded-xl p-5">
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <StickyNote size={14} style={{ color: "var(--color-red)" }} /> Mechanic Notes
            </h3>
            <div className="space-y-3">
              {notes.map((note: any, i: number) => (
                <div key={i} className="text-sm p-3 rounded-lg" style={{ backgroundColor: "rgba(255,255,255,0.04)" }}>
                  <p style={{ color: "var(--color-primary)" }}>{note.content}</p>
                  <p className="text-xs mt-1" style={{ color: "var(--color-muted)" }}>
                    {note.mechanicName ?? "Mechanic"} · {new Date(note.createdAt).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

/* ─── List View ───────────────────────────────────────── */
export default function AppointmentsPage() {
  const [matchDetail, params] = useRoute("/dashboard/appointments/:id");

  if (matchDetail && params?.id) {
    return <AppointmentDetail id={params.id} />;
  }

  return <AppointmentList />;
}

function AppointmentList() {
  const { data, isLoading } = useQuery({
    queryKey: ["appointments"],
    queryFn: async () => (await api.appointments.$get()).json(),
  });

  const list: any[] = (data as any)?.appointments ?? [];

  return (
    <DashboardLayout title="Appointments">
      <div className="max-w-4xl">
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm" style={{ color: "var(--color-muted)" }}>All your service appointments</p>
          <Link to="/book">
            <button className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold text-white" style={{ backgroundColor: "var(--color-red)" }}>
              <Plus size={16} /> Book Service
            </button>
          </Link>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <div key={i} className="glass rounded-xl h-20 animate-pulse" />)}
          </div>
        ) : list.length === 0 ? (
          <div className="glass rounded-xl p-14 text-center">
            <Calendar size={48} className="mx-auto mb-4 opacity-20" />
            <h3 className="text-xl font-bold mb-2" style={{ fontFamily: "Rajdhani" }}>No appointments yet</h3>
            <p className="text-sm mb-5" style={{ color: "var(--color-muted)" }}>Book your first service to get started</p>
            <Link to="/book">
              <button className="px-6 py-2.5 rounded-lg text-sm font-semibold text-white" style={{ backgroundColor: "var(--color-red)" }}>Book Service</button>
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {list.map((apt: any, i: number) => (
              <motion.div key={apt.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <Link to={`/dashboard/appointments/${apt.id}`}>
                  <div className="glass rounded-xl p-5 flex items-center justify-between gap-4 cursor-pointer hover:border-red-500/30 transition-all"
                    style={{ border: "1px solid transparent" }}>
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                        style={{ backgroundColor: "rgba(224,32,32,0.1)", color: "var(--color-red)" }}>
                        <Wrench size={18} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="text-sm font-semibold">Appointment #{apt.id}</span>
                          <StatusBadge status={apt.status} />
                        </div>
                        <div className="flex items-center gap-3 text-xs" style={{ color: "var(--color-muted)" }}>
                          <span className="flex items-center gap-1"><Clock size={11} />
                            {new Date(apt.scheduledAt).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                          </span>
                          <span className="flex items-center gap-1"><MapPin size={11} />
                            {apt.serviceType === "home-service" ? "Home Service" : "In-Shop"}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {apt.totalCost && (
                        <div className="text-right">
                          <div className="text-sm font-bold" style={{ color: "var(--color-red)", fontFamily: "Rajdhani" }}>
                            ${Number(apt.totalCost).toFixed(2)}
                          </div>
                          <div className="text-xs" style={{ color: "var(--color-muted)" }}>total</div>
                        </div>
                      )}
                      <ChevronRight size={16} style={{ color: "var(--color-muted)" }} />
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
