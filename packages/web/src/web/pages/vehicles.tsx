import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { api } from "../lib/api";
import { DashboardLayout } from "../components/dashboard-layout";
import { Plus, Car, Trash2, X } from "lucide-react";

function AddVehicleModal({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({ make: "", model: "", year: new Date().getFullYear(), vin: "", licensePlate: "", color: "", mileage: 0 });

  const add = useMutation({
    mutationFn: async (data: typeof form) => (await api.vehicles.$post({ json: data })).json(),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["vehicles"] }); onClose(); },
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ backgroundColor: "rgba(0,0,0,0.7)" }}>
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-md glass rounded-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold" style={{ fontFamily: "Rajdhani" }}>Add Vehicle</h3>
          <button onClick={onClose} style={{ color: "var(--color-muted)" }}><X size={20} /></button>
        </div>
        <form onSubmit={(e) => { e.preventDefault(); add.mutate(form); }} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {([["make", "Make", "Toyota"], ["model", "Model", "Camry"]] as const).map(([key, label, ph]) => (
              <div key={key}>
                <label className="block text-xs font-medium mb-1" style={{ color: "var(--color-silver)" }}>{label} *</label>
                <input required value={(form as any)[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} placeholder={ph}
                  className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
                  style={{ backgroundColor: "var(--color-surface2)", border: "1px solid var(--color-border)", color: "var(--color-white)" }}
                  onFocus={(e) => (e.target.style.borderColor = "#e02020")}
                  onBlur={(e) => (e.target.style.borderColor = "var(--color-border)")}
                />
              </div>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: "var(--color-silver)" }}>Year *</label>
              <input required type="number" value={form.year} onChange={(e) => setForm({ ...form, year: parseInt(e.target.value) })} min={1990} max={2030}
                className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
                style={{ backgroundColor: "var(--color-surface2)", border: "1px solid var(--color-border)", color: "var(--color-white)" }}
                onFocus={(e) => (e.target.style.borderColor = "#e02020")}
                onBlur={(e) => (e.target.style.borderColor = "var(--color-border)")}
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: "var(--color-silver)" }}>Color</label>
              <input value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} placeholder="Black"
                className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
                style={{ backgroundColor: "var(--color-surface2)", border: "1px solid var(--color-border)", color: "var(--color-white)" }}
                onFocus={(e) => (e.target.style.borderColor = "#e02020")}
                onBlur={(e) => (e.target.style.borderColor = "var(--color-border)")}
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: "var(--color-silver)" }}>VIN</label>
            <input value={form.vin} onChange={(e) => setForm({ ...form, vin: e.target.value })} placeholder="1HGCM82633A123456"
              className="w-full px-3 py-2.5 rounded-lg text-sm outline-none font-mono"
              style={{ backgroundColor: "var(--color-surface2)", border: "1px solid var(--color-border)", color: "var(--color-white)" }}
              onFocus={(e) => (e.target.style.borderColor = "#e02020")}
              onBlur={(e) => (e.target.style.borderColor = "var(--color-border)")}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: "var(--color-silver)" }}>License Plate</label>
              <input value={form.licensePlate} onChange={(e) => setForm({ ...form, licensePlate: e.target.value })} placeholder="ABC-1234"
                className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
                style={{ backgroundColor: "var(--color-surface2)", border: "1px solid var(--color-border)", color: "var(--color-white)" }}
                onFocus={(e) => (e.target.style.borderColor = "#e02020")}
                onBlur={(e) => (e.target.style.borderColor = "var(--color-border)")}
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: "var(--color-silver)" }}>Mileage</label>
              <input type="number" value={form.mileage} onChange={(e) => setForm({ ...form, mileage: parseInt(e.target.value) })} min={0}
                className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
                style={{ backgroundColor: "var(--color-surface2)", border: "1px solid var(--color-border)", color: "var(--color-white)" }}
                onFocus={(e) => (e.target.style.borderColor = "#e02020")}
                onBlur={(e) => (e.target.style.borderColor = "var(--color-border)")}
              />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-lg text-sm font-medium" style={{ border: "1px solid var(--color-border)", color: "var(--color-white)" }}>Cancel</button>
            <button type="submit" disabled={add.isPending} className="flex-1 py-2.5 rounded-lg text-sm font-semibold text-white disabled:opacity-60" style={{ backgroundColor: "var(--color-red)" }}>
              {add.isPending ? "Adding..." : "Add Vehicle"}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

export default function VehiclesPage() {
  const qc = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);

  const vehicles = useQuery({ queryKey: ["vehicles"], queryFn: async () => (await api.vehicles.$get()).json() });

  const remove = useMutation({
    mutationFn: async (id: number) => (await api.vehicles[":id"].$delete({ param: { id: String(id) } })).json(),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["vehicles"] }),
  });

  return (
    <DashboardLayout title="My Vehicles">
      {showAdd && <AddVehicleModal onClose={() => setShowAdd(false)} />}

      <div className="max-w-4xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-sm" style={{ color: "var(--color-muted)" }}>Manage and track all your registered vehicles</p>
          </div>
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold text-white"
            style={{ backgroundColor: "var(--color-red)" }}
          >
            <Plus size={16} /> Add Vehicle
          </button>
        </div>

        {vehicles.isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[1, 2].map((i) => <div key={i} className="glass rounded-xl h-36 animate-pulse" />)}
          </div>
        ) : (vehicles.data?.vehicles?.length ?? 0) === 0 ? (
          <div className="glass rounded-xl p-14 text-center">
            <Car size={48} className="mx-auto mb-4 opacity-20" />
            <h3 className="text-xl font-bold mb-2" style={{ fontFamily: "Rajdhani" }}>No vehicles yet</h3>
            <p className="text-sm mb-5" style={{ color: "var(--color-muted)" }}>Register your first vehicle to start booking services</p>
            <button onClick={() => setShowAdd(true)} className="px-6 py-2.5 rounded-lg text-sm font-semibold text-white" style={{ backgroundColor: "var(--color-red)" }}>
              Add Vehicle
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {vehicles.data?.vehicles?.map((v: any, i: number) => (
              <motion.div key={v.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="glass rounded-xl p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: "rgba(224,32,32,0.1)", color: "var(--color-red)" }}>
                    <Car size={20} />
                  </div>
                  <button onClick={() => remove.mutate(v.id)} className="opacity-0 hover:opacity-100 group-hover:opacity-100 transition-opacity p-1 rounded" style={{ color: "var(--color-muted)" }}>
                    <Trash2 size={16} />
                  </button>
                </div>
                <h3 className="text-xl font-bold mb-0.5" style={{ fontFamily: "Rajdhani" }}>{v.year} {v.make} {v.model}</h3>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-3">
                  {v.color && <div className="text-xs" style={{ color: "var(--color-muted)" }}>Color: <span style={{ color: "var(--color-silver)" }}>{v.color}</span></div>}
                  {v.mileage > 0 && <div className="text-xs" style={{ color: "var(--color-muted)" }}>Mileage: <span style={{ color: "var(--color-silver)" }}>{v.mileage?.toLocaleString()} mi</span></div>}
                  {v.licensePlate && <div className="text-xs font-mono" style={{ color: "var(--color-muted)" }}>Plate: <span style={{ color: "var(--color-silver)" }}>{v.licensePlate}</span></div>}
                  {v.vin && <div className="text-xs font-mono truncate" style={{ color: "var(--color-muted)" }}>VIN: <span style={{ color: "var(--color-silver)" }}>{v.vin?.slice(0, 8)}…</span></div>}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
