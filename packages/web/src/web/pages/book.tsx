import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Link, useLocation, useSearch } from "wouter";
import { api } from "../lib/api";
import { DashboardLayout } from "../components/dashboard-layout";
import { Car, MapPin, Calendar, CreditCard, CheckCircle, ArrowLeft, ArrowRight, Wrench } from "lucide-react";

const STEPS = ["Service", "Vehicle", "Schedule", "Confirm"];

export default function BookPage() {
  const search = useSearch();
  const params = new URLSearchParams(search);
  const isHome = params.get("type") === "home";

  const [, navigate] = useLocation();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    serviceId: 0,
    vehicleId: 0,
    serviceType: isHome ? "home-service" : "in-shop",
    scheduledAt: "",
    notes: "",
    customerAddress: "",
  });
  const [success, setSuccess] = useState(false);

  const services = useQuery({ queryKey: ["services"], queryFn: async () => (await api.services.$get()).json() });
  const vehicles = useQuery({ queryKey: ["vehicles"], queryFn: async () => (await api.vehicles.$get()).json() });

  const book = useMutation({
    mutationFn: async (data: typeof form) => (await api.appointments.$post({ json: data })).json(),
    onSuccess: () => setSuccess(true),
  });

  if (success) {
    return (
      <DashboardLayout title="Book Service">
        <div className="max-w-lg mx-auto text-center py-16">
          <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
            <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6" style={{ backgroundColor: "rgba(34,197,94,0.1)", border: "2px solid #22c55e" }}>
              <CheckCircle size={40} color="#22c55e" />
            </div>
            <h2 className="text-3xl font-bold mb-2" style={{ fontFamily: "Rajdhani" }}>Booking Confirmed!</h2>
            <p className="mb-8" style={{ color: "var(--color-silver)" }}>Your appointment has been booked. You'll receive a confirmation shortly.</p>
            <div className="flex gap-3 justify-center">
              <Link to="/dashboard/appointments">
                <button className="px-6 py-2.5 rounded-lg text-sm font-semibold text-white" style={{ backgroundColor: "var(--color-red)" }}>View Appointments</button>
              </Link>
              <Link to="/dashboard">
                <button className="px-6 py-2.5 rounded-lg text-sm font-medium" style={{ border: "1px solid var(--color-border)", color: "var(--color-white)" }}>Dashboard</button>
              </Link>
            </div>
          </motion.div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Book Service">
      <div className="max-w-2xl">
        {/* Stepper */}
        <div className="flex items-center gap-2 mb-8">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className="flex items-center gap-2 text-sm font-medium"
                style={{ color: i <= step ? "var(--color-red)" : "var(--color-muted)" }}
              >
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
                  style={{
                    backgroundColor: i < step ? "var(--color-red)" : i === step ? "rgba(224,32,32,0.15)" : "var(--color-surface2)",
                    border: i <= step ? "1.5px solid var(--color-red)" : "1.5px solid var(--color-border)",
                    color: i <= step ? (i < step ? "white" : "var(--color-red)") : "var(--color-muted)",
                  }}
                >
                  {i < step ? "✓" : i + 1}
                </div>
                <span className="hidden sm:inline">{s}</span>
              </div>
              {i < STEPS.length - 1 && <div className="flex-1 h-px min-w-6" style={{ backgroundColor: i < step ? "var(--color-red)" : "var(--color-border)" }} />}
            </div>
          ))}
        </div>

        {/* Step 0: Service */}
        {step === 0 && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
            <h2 className="text-2xl font-bold mb-1" style={{ fontFamily: "Rajdhani" }}>Select Service</h2>
            <p className="text-sm mb-6" style={{ color: "var(--color-muted)" }}>Choose the service you need for your vehicle</p>
            {services.isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[1,2,3,4].map(i => <div key={i} className="glass rounded-xl h-20 animate-pulse" />)}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {services.data?.services?.map((s: any) => (
                  <div
                    key={s.id}
                    onClick={() => setForm({ ...form, serviceId: s.id })}
                    className="glass rounded-xl p-4 cursor-pointer transition-all"
                    style={{
                      border: form.serviceId === s.id ? "1.5px solid var(--color-red)" : "1px solid var(--color-border)",
                      backgroundColor: form.serviceId === s.id ? "rgba(224,32,32,0.06)" : undefined,
                    }}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="text-sm font-semibold">{s.name}</div>
                      <div className="text-sm font-bold" style={{ color: "var(--color-red)", fontFamily: "Rajdhani" }}>${s.basePrice}</div>
                    </div>
                    <div className="text-xs" style={{ color: "var(--color-muted)" }}>{s.description}</div>
                  </div>
                ))}
              </div>
            )}
            <div className="mt-6">
              <label className="block text-sm font-medium mb-2" style={{ color: "var(--color-silver)" }}>Service Type</label>
              <div className="flex gap-3">
                {[["in-shop", "In-Shop ($25 fee)", <Wrench size={16} />], ["home-service", "Home Service ($35 fee)", <MapPin size={16} />]].map(([val, label, icon]) => (
                  <div
                    key={val as string}
                    onClick={() => setForm({ ...form, serviceType: val as string })}
                    className="flex-1 flex items-center gap-2 px-4 py-3 rounded-xl cursor-pointer text-sm font-medium transition-all"
                    style={{
                      border: form.serviceType === val ? "1.5px solid var(--color-red)" : "1px solid var(--color-border)",
                      backgroundColor: form.serviceType === val ? "rgba(224,32,32,0.06)" : "var(--color-surface2)",
                      color: form.serviceType === val ? "var(--color-red)" : "var(--color-silver)",
                    }}
                  >
                    {icon as any} {label as any}
                  </div>
                ))}
              </div>
            </div>
            <div className="flex justify-end mt-6">
              <button
                onClick={() => setStep(1)}
                disabled={!form.serviceId}
                className="flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-semibold text-white disabled:opacity-50"
                style={{ backgroundColor: "var(--color-red)" }}
              >
                Next <ArrowRight size={16} />
              </button>
            </div>
          </motion.div>
        )}

        {/* Step 1: Vehicle */}
        {step === 1 && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
            <h2 className="text-2xl font-bold mb-1" style={{ fontFamily: "Rajdhani" }}>Select Vehicle</h2>
            <p className="text-sm mb-6" style={{ color: "var(--color-muted)" }}>Which vehicle needs service?</p>
            {vehicles.isLoading ? (
              <div className="space-y-3">{[1,2].map(i => <div key={i} className="glass rounded-xl h-16 animate-pulse" />)}</div>
            ) : (vehicles.data?.vehicles?.length ?? 0) === 0 ? (
              <div className="glass rounded-xl p-8 text-center">
                <Car size={36} className="mx-auto mb-3 opacity-20" />
                <p className="text-sm mb-3" style={{ color: "var(--color-muted)" }}>No vehicles registered. Add one first.</p>
                <Link to="/dashboard/vehicles">
                  <button className="px-4 py-2 rounded-lg text-sm font-semibold text-white" style={{ backgroundColor: "var(--color-red)" }}>Add Vehicle</button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {vehicles.data?.vehicles?.map((v: any) => (
                  <div
                    key={v.id}
                    onClick={() => setForm({ ...form, vehicleId: v.id })}
                    className="glass rounded-xl p-4 cursor-pointer flex items-center gap-3 transition-all"
                    style={{
                      border: form.vehicleId === v.id ? "1.5px solid var(--color-red)" : "1px solid var(--color-border)",
                      backgroundColor: form.vehicleId === v.id ? "rgba(224,32,32,0.06)" : undefined,
                    }}
                  >
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: "rgba(224,32,32,0.1)", color: "var(--color-red)" }}>
                      <Car size={18} />
                    </div>
                    <div>
                      <div className="text-sm font-semibold">{v.year} {v.make} {v.model}</div>
                      <div className="text-xs" style={{ color: "var(--color-muted)" }}>{v.licensePlate ?? v.vin ?? "No plate"}</div>
                    </div>
                    {form.vehicleId === v.id && <CheckCircle size={18} className="ml-auto" style={{ color: "var(--color-red)" }} />}
                  </div>
                ))}
              </div>
            )}
            {form.serviceType === "home-service" && (
              <div className="mt-4">
                <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--color-silver)" }}>Service Address</label>
                <input
                  value={form.customerAddress}
                  onChange={(e) => setForm({ ...form, customerAddress: e.target.value })}
                  placeholder="123 Main St, City, State"
                  className="w-full px-4 py-3 rounded-lg text-sm outline-none"
                  style={{ backgroundColor: "var(--color-surface2)", border: "1px solid var(--color-border)", color: "var(--color-white)" }}
                  onFocus={(e) => (e.target.style.borderColor = "#e02020")}
                  onBlur={(e) => (e.target.style.borderColor = "var(--color-border)")}
                />
              </div>
            )}
            <div className="flex justify-between mt-6">
              <button onClick={() => setStep(0)} className="flex items-center gap-2 px-5 py-3 rounded-lg text-sm font-medium" style={{ border: "1px solid var(--color-border)", color: "var(--color-white)" }}>
                <ArrowLeft size={16} /> Back
              </button>
              <button
                onClick={() => setStep(2)}
                disabled={!form.vehicleId}
                className="flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-semibold text-white disabled:opacity-50"
                style={{ backgroundColor: "var(--color-red)" }}
              >
                Next <ArrowRight size={16} />
              </button>
            </div>
          </motion.div>
        )}

        {/* Step 2: Schedule */}
        {step === 2 && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
            <h2 className="text-2xl font-bold mb-1" style={{ fontFamily: "Rajdhani" }}>Schedule Date</h2>
            <p className="text-sm mb-6" style={{ color: "var(--color-muted)" }}>Pick your preferred date and time</p>
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--color-silver)" }}>Date & Time</label>
              <input
                type="datetime-local"
                value={form.scheduledAt}
                min={new Date().toISOString().slice(0, 16)}
                onChange={(e) => setForm({ ...form, scheduledAt: e.target.value })}
                className="w-full px-4 py-3 rounded-lg text-sm outline-none"
                style={{ backgroundColor: "var(--color-surface2)", border: "1px solid var(--color-border)", color: "var(--color-white)" }}
                onFocus={(e) => (e.target.style.borderColor = "#e02020")}
                onBlur={(e) => (e.target.style.borderColor = "var(--color-border)")}
              />
            </div>
            <div className="mt-4">
              <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--color-silver)" }}>Additional Notes (optional)</label>
              <textarea
                rows={3}
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Describe the issue or any specific requests..."
                className="w-full px-4 py-3 rounded-lg text-sm outline-none resize-none"
                style={{ backgroundColor: "var(--color-surface2)", border: "1px solid var(--color-border)", color: "var(--color-white)" }}
                onFocus={(e) => (e.target.style.borderColor = "#e02020")}
                onBlur={(e) => (e.target.style.borderColor = "var(--color-border)")}
              />
            </div>
            <div className="flex justify-between mt-6">
              <button onClick={() => setStep(1)} className="flex items-center gap-2 px-5 py-3 rounded-lg text-sm font-medium" style={{ border: "1px solid var(--color-border)", color: "var(--color-white)" }}>
                <ArrowLeft size={16} /> Back
              </button>
              <button
                onClick={() => setStep(3)}
                disabled={!form.scheduledAt}
                className="flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-semibold text-white disabled:opacity-50"
                style={{ backgroundColor: "var(--color-red)" }}
              >
                Next <ArrowRight size={16} />
              </button>
            </div>
          </motion.div>
        )}

        {/* Step 3: Confirm */}
        {step === 3 && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
            <h2 className="text-2xl font-bold mb-1" style={{ fontFamily: "Rajdhani" }}>Confirm Booking</h2>
            <p className="text-sm mb-6" style={{ color: "var(--color-muted)" }}>Review your appointment details</p>
            <div className="glass rounded-xl p-5 space-y-4 mb-6">
              {[
                ["Service", services.data?.services?.find((s: any) => s.id === form.serviceId)?.name ?? "—"],
                ["Type", form.serviceType === "home-service" ? "Home Service" : "In-Shop"],
                ["Date", form.scheduledAt ? new Date(form.scheduledAt).toLocaleString() : "—"],
                ["Booking Fee", form.serviceType === "home-service" ? "$35" : "$25"],
              ].map(([label, val]) => (
                <div key={label} className="flex items-center justify-between text-sm">
                  <span style={{ color: "var(--color-muted)" }}>{label}</span>
                  <span className="font-medium">{val}</span>
                </div>
              ))}
              <div className="h-px" style={{ backgroundColor: "var(--color-border)" }} />
              <div className="flex items-center justify-between text-base font-bold">
                <span>Total Due Now</span>
                <span style={{ color: "var(--color-red)", fontFamily: "Rajdhani" }}>{form.serviceType === "home-service" ? "$35" : "$25"}</span>
              </div>
            </div>
            <div className="flex justify-between">
              <button onClick={() => setStep(2)} className="flex items-center gap-2 px-5 py-3 rounded-lg text-sm font-medium" style={{ border: "1px solid var(--color-border)", color: "var(--color-white)" }}>
                <ArrowLeft size={16} /> Back
              </button>
              <button
                onClick={() => book.mutate(form)}
                disabled={book.isPending}
                className="flex items-center gap-2 px-7 py-3 rounded-lg text-sm font-semibold text-white disabled:opacity-60 red-glow"
                style={{ backgroundColor: "var(--color-red)" }}
              >
                <CreditCard size={16} />
                {book.isPending ? "Booking..." : "Confirm & Pay"}
              </button>
            </div>
            {book.isError && (
              <p className="text-sm text-center mt-3" style={{ color: "#e02020" }}>Something went wrong. Please try again.</p>
            )}
          </motion.div>
        )}
      </div>
    </DashboardLayout>
  );
}
