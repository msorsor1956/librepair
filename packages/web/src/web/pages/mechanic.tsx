import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";
import { authClient } from "../lib/auth";
import { DashboardLayout } from "../components/dashboard-layout";
import {
  Wrench, User, Car, Package, StickyNote, ChevronDown, ChevronUp,
  Plus, Save, Clock, CheckCircle, AlertCircle, X
} from "lucide-react";

/* ── helpers ── */
function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { color: string; bg: string }> = {
    pending:      { color: "#f59e0b", bg: "rgba(245,158,11,0.12)" },
    confirmed:    { color: "#3b82f6", bg: "rgba(59,130,246,0.12)" },
    "in-progress":{ color: "var(--color-red)", bg: "rgba(224,32,32,0.12)" },
    completed:    { color: "#22c55e", bg: "rgba(34,197,94,0.12)" },
    cancelled:    { color: "#6b7280", bg: "rgba(107,114,128,0.12)" },
  };
  const s = map[status] ?? { color: "var(--color-muted)", bg: "rgba(255,255,255,0.06)" };
  return (
    <span className="text-xs px-2.5 py-1 rounded-full font-semibold"
      style={{ color: s.color, backgroundColor: s.bg }}>
      {status.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
    </span>
  );
}

/* ── Job detail panel ── */
function JobPanel({ job, onClose }: { job: any; onClose: () => void }) {
  const qc = useQueryClient();
  const [statusVal, setStatusVal] = useState(job.status);
  const [notes, setNotes]         = useState("");
  const [partName, setPartName]   = useState("");
  const [partQty, setPartQty]     = useState("1");
  const [partPrice, setPartPrice] = useState("");
  const [saving, setSaving]       = useState(false);
  const [toast, setToast]         = useState<string | null>(null);

  // Customer info editing
  const [editingCustomer, setEditingCustomer] = useState(false);
  const [custName,  setCustName]  = useState(job.customerName  ?? "");
  const [custPhone, setCustPhone] = useState(job.customerPhone ?? "");
  const [custEmail, setCustEmail] = useState(job.customerEmail ?? "");

  // Vehicle editing
  const [editingVehicle, setEditingVehicle] = useState(false);
  const [vMake,  setVMake]  = useState(job.vehicle?.make  ?? "");
  const [vModel, setVModel] = useState(job.vehicle?.model ?? "");
  const [vYear,  setVYear]  = useState(job.vehicle?.year  ?? "");
  const [vPlate, setVPlate] = useState(job.vehicle?.licensePlate ?? "");
  const [vVin,   setVVin]   = useState(job.vehicle?.vin   ?? "");

  const { data: partsData } = useQuery({
    queryKey: ["mechanic-parts", job.id],
    queryFn: async () => {
      const r = await fetch(`/api/parts/${job.id}`);
      return r.json() as Promise<{ parts: any[] }>;
    },
  });
  const parts: any[] = partsData?.parts ?? [];

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

  async function updateStatus() {
    setSaving(true);
    await fetch(`/api/mechanics/appointments/${job.id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: statusVal }),
    });
    qc.invalidateQueries({ queryKey: ["mechanic-jobs"] });
    showToast("Status updated");
    setSaving(false);
  }

  async function addNote() {
    if (!notes.trim()) return;
    setSaving(true);
    await fetch(`/api/mechanics/appointments/${job.id}/notes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: notes }),
    });
    setNotes("");
    showToast("Note added");
    setSaving(false);
  }

  async function addPart() {
    if (!partName || !partPrice) return;
    setSaving(true);
    await fetch(`/api/parts/${job.id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: partName,
        quantity: Number(partQty),
        unitCost: Number(partPrice),
      }),
    });
    qc.invalidateQueries({ queryKey: ["mechanic-parts", job.id] });
    setPartName(""); setPartQty("1"); setPartPrice("");
    showToast("Part added");
    setSaving(false);
  }

  async function saveCustomer() {
    setSaving(true);
    await fetch(`/api/mechanics/appointments/${job.id}/customer`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: custName, phone: custPhone, email: custEmail }),
    });
    setEditingCustomer(false);
    showToast("Customer info saved");
    setSaving(false);
  }

  async function saveVehicle() {
    setSaving(true);
    await fetch(`/api/mechanics/appointments/${job.id}/vehicle`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ make: vMake, model: vModel, year: Number(vYear), licensePlate: vPlate, vin: vVin }),
    });
    setEditingVehicle(false);
    showToast("Vehicle info saved");
    setSaving(false);
  }

  const partsTotal = parts.reduce((s: number, p: any) => s + Number(p.totalCost ?? 0), 0);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}>
      <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 40 }}
        className="w-full max-w-2xl rounded-2xl overflow-hidden"
        style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", maxHeight: "92vh", overflowY: "auto" }}>

        {/* Toast */}
        <AnimatePresence>
          {toast && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="mx-4 mt-4 px-4 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2"
              style={{ backgroundColor: "rgba(34,197,94,0.15)", color: "#22c55e" }}>
              <CheckCircle size={14} /> {toast}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: "var(--color-border)" }}>
          <div>
            <h2 className="text-lg font-bold" style={{ fontFamily: "Rajdhani" }}>Job #{job.id}</h2>
            <p className="text-xs mt-0.5" style={{ color: "var(--color-muted)" }}>
              {new Date(job.scheduledAt).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
              {" · "}
              {job.serviceType === "home-service" ? "Home Service" : "In-Shop"}
            </p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10">
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-5">

          {/* Status update */}
          <div className="p-4 rounded-xl" style={{ backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid var(--color-border)" }}>
            <div className="text-xs font-semibold mb-2" style={{ color: "var(--color-muted)" }}>UPDATE STATUS</div>
            <div className="flex items-center gap-3">
              <select value={statusVal} onChange={(e) => setStatusVal(e.target.value)}
                className="flex-1 px-3 py-2 rounded-lg text-sm"
                style={{ background: "var(--color-bg)", border: "1px solid var(--color-border)", color: "var(--color-primary)" }}>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="in-progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
              <button onClick={updateStatus} disabled={saving}
                className="px-4 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-50"
                style={{ backgroundColor: "var(--color-red)" }}>
                {saving ? "Saving…" : "Update"}
              </button>
            </div>
          </div>

          {/* Customer info */}
          <div className="p-4 rounded-xl" style={{ backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid var(--color-border)" }}>
            <div className="flex items-center justify-between mb-3">
              <div className="text-xs font-semibold flex items-center gap-1.5" style={{ color: "var(--color-muted)" }}>
                <User size={12} /> CUSTOMER INFO
              </div>
              <button onClick={() => setEditingCustomer(!editingCustomer)}
                className="text-xs px-2.5 py-1 rounded-lg font-medium"
                style={{ color: "var(--color-red)", backgroundColor: "rgba(224,32,32,0.1)" }}>
                {editingCustomer ? "Cancel" : "Edit"}
              </button>
            </div>
            {editingCustomer ? (
              <div className="space-y-2">
                <input value={custName}  onChange={(e) => setCustName(e.target.value)}  placeholder="Full name"
                  className="w-full px-3 py-2 rounded-lg text-sm"
                  style={{ background: "var(--color-bg)", border: "1px solid var(--color-border)", color: "var(--color-primary)" }} />
                <input value={custPhone} onChange={(e) => setCustPhone(e.target.value)} placeholder="Phone number"
                  className="w-full px-3 py-2 rounded-lg text-sm"
                  style={{ background: "var(--color-bg)", border: "1px solid var(--color-border)", color: "var(--color-primary)" }} />
                <input value={custEmail} onChange={(e) => setCustEmail(e.target.value)} placeholder="Email"
                  className="w-full px-3 py-2 rounded-lg text-sm"
                  style={{ background: "var(--color-bg)", border: "1px solid var(--color-border)", color: "var(--color-primary)" }} />
                <button onClick={saveCustomer} disabled={saving}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-50"
                  style={{ backgroundColor: "var(--color-red)" }}>
                  <Save size={13} /> Save
                </button>
              </div>
            ) : (
              <div className="text-sm space-y-1">
                <div className="font-medium">{custName || <span style={{ color: "var(--color-muted)" }}>No name on file</span>}</div>
                {custPhone && <div style={{ color: "var(--color-muted)" }}>{custPhone}</div>}
                {custEmail && <div style={{ color: "var(--color-muted)" }}>{custEmail}</div>}
              </div>
            )}
          </div>

          {/* Vehicle info */}
          <div className="p-4 rounded-xl" style={{ backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid var(--color-border)" }}>
            <div className="flex items-center justify-between mb-3">
              <div className="text-xs font-semibold flex items-center gap-1.5" style={{ color: "var(--color-muted)" }}>
                <Car size={12} /> VEHICLE
              </div>
              <button onClick={() => setEditingVehicle(!editingVehicle)}
                className="text-xs px-2.5 py-1 rounded-lg font-medium"
                style={{ color: "var(--color-red)", backgroundColor: "rgba(224,32,32,0.1)" }}>
                {editingVehicle ? "Cancel" : "Edit"}
              </button>
            </div>
            {editingVehicle ? (
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: "Make",    val: vMake,  set: setVMake  },
                  { label: "Model",   val: vModel, set: setVModel },
                  { label: "Year",    val: vYear,  set: setVYear  },
                  { label: "Plate",   val: vPlate, set: setVPlate },
                  { label: "VIN",     val: vVin,   set: setVVin   },
                ].map(({ label, val, set }) => (
                  <input key={label} value={val} onChange={(e) => set(e.target.value)} placeholder={label}
                    className="px-3 py-2 rounded-lg text-sm col-span-1"
                    style={{ background: "var(--color-bg)", border: "1px solid var(--color-border)", color: "var(--color-primary)" }} />
                ))}
                <button onClick={saveVehicle} disabled={saving}
                  className="col-span-2 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-50"
                  style={{ backgroundColor: "var(--color-red)" }}>
                  <Save size={13} /> Save Vehicle
                </button>
              </div>
            ) : (
              <div className="text-sm">
                {(vMake || vModel || vYear)
                  ? <span className="font-medium">{vYear} {vMake} {vModel}</span>
                  : <span style={{ color: "var(--color-muted)" }}>No vehicle on file</span>}
                {vPlate && <span className="text-xs ml-2 opacity-60">· {vPlate}</span>}
                {vVin   && <div className="text-xs mt-0.5" style={{ color: "var(--color-muted)" }}>VIN: {vVin}</div>}
              </div>
            )}
          </div>

          {/* Parts */}
          <div className="p-4 rounded-xl" style={{ backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid var(--color-border)" }}>
            <div className="text-xs font-semibold mb-3 flex items-center gap-1.5" style={{ color: "var(--color-muted)" }}>
              <Package size={12} /> PARTS & MATERIALS
            </div>

            {/* Add part form */}
            <div className="grid grid-cols-6 gap-2 mb-3">
              <input value={partName} onChange={(e) => setPartName(e.target.value)} placeholder="Part name"
                className="col-span-3 px-3 py-2 rounded-lg text-sm"
                style={{ background: "var(--color-bg)", border: "1px solid var(--color-border)", color: "var(--color-primary)" }} />
              <input value={partQty} onChange={(e) => setPartQty(e.target.value)} placeholder="Qty" type="number" min="1"
                className="col-span-1 px-3 py-2 rounded-lg text-sm"
                style={{ background: "var(--color-bg)", border: "1px solid var(--color-border)", color: "var(--color-primary)" }} />
              <input value={partPrice} onChange={(e) => setPartPrice(e.target.value)} placeholder="$/unit" type="number" min="0"
                className="col-span-1 px-3 py-2 rounded-lg text-sm"
                style={{ background: "var(--color-bg)", border: "1px solid var(--color-border)", color: "var(--color-primary)" }} />
              <button onClick={addPart} disabled={saving || !partName || !partPrice}
                className="col-span-1 flex items-center justify-center gap-1 rounded-lg text-sm font-semibold text-white disabled:opacity-40"
                style={{ backgroundColor: "var(--color-red)" }}>
                <Plus size={14} />
              </button>
            </div>

            {/* Parts list */}
            {parts.length > 0 ? (
              <>
                {parts.map((p: any) => (
                  <div key={p.id} className="flex justify-between items-center py-2 border-b text-sm last:border-0"
                    style={{ borderColor: "var(--color-border)" }}>
                    <div>
                      <span className="font-medium">{p.name}</span>
                      <span className="text-xs ml-2 opacity-60">{p.quantity} × ${Number(p.unitPrice).toFixed(2)}</span>
                    </div>
                    <span className="font-bold">${Number(p.totalCost).toFixed(2)}</span>
                  </div>
                ))}
                <div className="flex justify-between pt-2 text-sm font-bold">
                  <span>Total</span>
                  <span style={{ color: "var(--color-red)" }}>${partsTotal.toFixed(2)}</span>
                </div>
              </>
            ) : (
              <p className="text-xs text-center py-3" style={{ color: "var(--color-muted)" }}>No parts added yet</p>
            )}
          </div>

          {/* Add mechanic note */}
          <div className="p-4 rounded-xl" style={{ backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid var(--color-border)" }}>
            <div className="text-xs font-semibold mb-2 flex items-center gap-1.5" style={{ color: "var(--color-muted)" }}>
              <StickyNote size={12} /> ADD NOTE
            </div>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)}
              placeholder="Add a note about this job (visible to customer)…"
              rows={3}
              className="w-full px-3 py-2 rounded-lg text-sm mb-2 resize-none"
              style={{ background: "var(--color-bg)", border: "1px solid var(--color-border)", color: "var(--color-primary)" }} />
            <button onClick={addNote} disabled={saving || !notes.trim()}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-40"
              style={{ backgroundColor: "var(--color-red)" }}>
              <Plus size={14} /> Add Note
            </button>
          </div>

        </div>
      </motion.div>
    </div>
  );
}

/* ── Main mechanic page ── */
export default function MechanicPage() {
  const [, navigate] = useLocation();
  const [selectedJob, setSelectedJob] = useState<any | null>(null);

  const { data: session } = useQuery({
    queryKey: ["session"],
    queryFn: () => authClient.getSession(),
  });

  const user = (session as any)?.data?.user;

  // Redirect if not mechanic or admin
  if (session !== undefined && !["mechanic", "admin"].includes((user as any)?.role)) {
    navigate("/dashboard");
    return null;
  }

  const { data, isLoading } = useQuery({
    queryKey: ["mechanic-jobs"],
    queryFn: async () => {
      const r = await fetch("/api/mechanics/my-jobs");
      return r.json() as Promise<{ appointments: any[] }>;
    },
    enabled: !!user,
  });

  const jobs: any[] = data?.appointments ?? [];
  const active   = jobs.filter((j) => ["pending", "confirmed", "in-progress"].includes(j.status));
  const done     = jobs.filter((j) => ["completed", "cancelled"].includes(j.status));

  return (
    <DashboardLayout title="My Jobs">
      <div className="max-w-4xl space-y-6">
        {/* Stats row */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Assigned",    value: jobs.length,   color: "rgba(224,32,32,0.15)",   textColor: "var(--color-red)"  },
            { label: "Active",      value: active.length, color: "rgba(59,130,246,0.12)",  textColor: "#3b82f6"           },
            { label: "Completed",   value: done.filter((j) => j.status === "completed").length, color: "rgba(34,197,94,0.12)", textColor: "#22c55e" },
          ].map((c, i) => (
            <motion.div key={c.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
              className="glass rounded-xl p-5">
              <div className="text-3xl font-bold mb-1" style={{ fontFamily: "Rajdhani", color: c.textColor }}>{c.value}</div>
              <div className="text-xs" style={{ color: "var(--color-muted)" }}>{c.label}</div>
            </motion.div>
          ))}
        </div>

        {/* Active jobs */}
        <div>
          <h2 className="text-sm font-semibold mb-3" style={{ color: "var(--color-muted)" }}>ACTIVE JOBS ({active.length})</h2>
          {isLoading ? (
            <div className="space-y-3">{[1,2].map((i) => <div key={i} className="glass rounded-xl h-20 animate-pulse" />)}</div>
          ) : active.length === 0 ? (
            <div className="glass rounded-xl p-10 text-center">
              <Wrench size={40} className="mx-auto mb-3 opacity-20" />
              <p className="text-sm" style={{ color: "var(--color-muted)" }}>No active jobs assigned to you</p>
            </div>
          ) : (
            <div className="space-y-3">
              {active.map((job: any, i: number) => (
                <motion.div key={job.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                  <button onClick={() => setSelectedJob(job)} className="w-full text-left glass rounded-xl p-5 hover:border-red-500/30 transition-all"
                    style={{ border: "1px solid transparent" }}>
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                          style={{ backgroundColor: "rgba(224,32,32,0.1)", color: "var(--color-red)" }}>
                          <Wrench size={18} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span className="text-sm font-semibold">Job #{job.id}</span>
                            <StatusBadge status={job.status} />
                          </div>
                          <div className="flex items-center gap-3 text-xs" style={{ color: "var(--color-muted)" }}>
                            <span className="flex items-center gap-1"><Clock size={11} />
                              {new Date(job.scheduledAt).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                            </span>
                            {job.customerName && <span>{job.customerName}</span>}
                            {job.vehicle && <span>{job.vehicle.year} {job.vehicle.make} {job.vehicle.model}</span>}
                          </div>
                        </div>
                      </div>
                      <ChevronDown size={16} style={{ color: "var(--color-muted)" }} />
                    </div>
                  </button>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Completed jobs */}
        {done.length > 0 && (
          <div>
            <h2 className="text-sm font-semibold mb-3" style={{ color: "var(--color-muted)" }}>COMPLETED / CANCELLED ({done.length})</h2>
            <div className="space-y-2">
              {done.map((job: any, i: number) => (
                <motion.div key={job.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                  <button onClick={() => setSelectedJob(job)} className="w-full text-left glass rounded-xl p-4 opacity-70 hover:opacity-100 transition-opacity">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                          style={{ backgroundColor: "rgba(255,255,255,0.06)" }}>
                          <Wrench size={14} style={{ color: "var(--color-muted)" }} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">Job #{job.id}</span>
                            <StatusBadge status={job.status} />
                          </div>
                          <div className="text-xs mt-0.5" style={{ color: "var(--color-muted)" }}>
                            {new Date(job.scheduledAt).toLocaleDateString()}
                            {job.customerName && ` · ${job.customerName}`}
                          </div>
                        </div>
                      </div>
                    </div>
                  </button>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Job detail panel */}
      <AnimatePresence>
        {selectedJob && <JobPanel job={selectedJob} onClose={() => setSelectedJob(null)} />}
      </AnimatePresence>
    </DashboardLayout>
  );
}
