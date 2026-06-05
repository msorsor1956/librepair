import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Link, useLocation, useSearch } from "wouter";
import { api } from "../lib/api";
import { DashboardLayout } from "../components/dashboard-layout";
import { Car, MapPin, Calendar, CreditCard, CheckCircle, ArrowLeft, ArrowRight, Wrench, Plus } from "lucide-react";

const STEPS = ["Service", "Vehicle", "Schedule", "Payment", "Confirm"];
const PAYMENT_METHODS = [
  { value: "cash", label: "Cash" },
  { value: "zelle", label: "Zelle" },
  { value: "cashapp", label: "Cash App" },
  { value: "paypal", label: "PayPal" },
  { value: "stripe", label: "Credit / Debit Card" },
];

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
    paymentMethod: "cash",
  });
  const [success, setSuccess] = useState(false);
  const [bookedId, setBookedId] = useState<number | null>(null);

  // Add vehicle inline
  const [showAddVehicle, setShowAddVehicle] = useState(false);
  const [newVehicle, setNewVehicle] = useState({ make: "", model: "", year: "", licensePlate: "", color: "", vin: "" });

  const services = useQuery({ queryKey: ["services"], queryFn: async () => (await api.services.$get()).json() });
  const vehicles = useQuery({ queryKey: ["vehicles"], queryFn: async () => (await api.vehicles.$get()).json() });
  const mechanics = useQuery({ queryKey: ["mechanics"], queryFn: async () => (await api.mechanics.$get()).json() });

  const addVehicleMut = useMutation({
    mutationFn: async (v: typeof newVehicle) => (await api.vehicles.$post({ json: { ...v, year: parseInt(v.year) } })).json(),
    onSuccess: () => { vehicles.refetch(); setShowAddVehicle(false); setNewVehicle({ make: "", model: "", year: "", licensePlate: "", color: "", vin: "" }); },
  });

  const book = useMutation({
    mutationFn: async (data: typeof form) => (await api.appointments.$post({ json: data })).json(),
    onSuccess: (data: any) => { setBookedId(data.id); setSuccess(true); },
  });

  const servicesList: any[] = (services.data as any)?.services ?? services.data ?? [];
  const vehiclesList: any[] = (vehicles.data as any)?.vehicles ?? vehicles.data ?? [];
  const mechanicsList: any[] = (mechanics.data as any)?.mechanics ?? mechanics.data ?? [];
  const selectedService = servicesList.find((s: any) => s.id === form.serviceId);
  const selectedVehicle = vehiclesList.find((v: any) => v.id === form.vehicleId);
  const bookingFee = form.serviceType === "home-service" ? 35 : 25;

  if (success) {
    return (
      <DashboardLayout title="Book Service">
        <div className="max-w-lg mx-auto text-center py-16">
          <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
            <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6" style={{ backgroundColor: "rgba(34,197,94,0.1)", border: "2px solid #22c55e" }}>
              <CheckCircle size={40} color="#22c55e" />
            </div>
            <h2 className="text-3xl font-bold mb-2" style={{ fontFamily: "Rajdhani" }}>Booking Confirmed!</h2>
            <p className="mb-2" style={{ color: "var(--color-silver)" }}>Your appointment has been booked.</p>
            <p className="text-sm mb-8" style={{ color: "var(--color-muted)" }}>
              Payment method: <strong style={{ color: "var(--color-white)" }}>{PAYMENT_METHODS.find(m => m.value === form.paymentMethod)?.label}</strong>
              {" · "}Booking fee: <strong style={{ color: "var(--color-red)" }}>${bookingFee}</strong>
            </p>
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
        <div className="flex items-center gap-1 mb-8 overflow-x-auto pb-1">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center gap-1 flex-shrink-0">
              <div className="flex items-center gap-1.5 text-sm font-medium" style={{ color: i <= step ? "var(--color-red)" : "var(--color-muted)" }}>
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold" style={{
                  backgroundColor: i < step ? "var(--color-red)" : i === step ? "rgba(224,32,32,0.15)" : "var(--color-surface2)",
                  border: i <= step ? "1.5px solid var(--color-red)" : "1.5px solid var(--color-border)",
                  color: i <= step ? (i < step ? "white" : "var(--color-red)") : "var(--color-muted)",
                }}>
                  {i < step ? "✓" : i + 1}
                </div>
                <span className="hidden sm:inline">{s}</span>
              </div>
              {i < STEPS.length - 1 && <div className="h-px w-4 sm:w-6" style={{ backgroundColor: i < step ? "var(--color-red)" : "var(--color-border)" }} />}
            </div>
          ))}
        </div>

        {/* Step 0: Service */}
        {step === 0 && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
            <h2 className="text-2xl font-bold mb-1" style={{ fontFamily: "Rajdhani" }}>Select Service</h2>
            <p className="text-sm mb-4" style={{ color: "var(--color-muted)" }}>Choose the service you need</p>
            {services.isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">{[1,2,3,4].map(i => <div key={i} className="glass rounded-xl h-20 animate-pulse" />)}</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {servicesList.map((s: any) => (
                  <div key={s.id} onClick={() => setForm({ ...form, serviceId: s.id })} className="glass rounded-xl p-4 cursor-pointer transition-all" style={{
                    border: form.serviceId === s.id ? "1.5px solid var(--color-red)" : "1px solid var(--color-border)",
                    backgroundColor: form.serviceId === s.id ? "rgba(224,32,32,0.06)" : undefined,
                  }}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="text-sm font-semibold">{s.name}</div>
                      <div className="text-sm font-bold" style={{ color: "var(--color-red)", fontFamily: "Rajdhani" }}>${s.basePrice}</div>
                    </div>
                    <div className="text-xs" style={{ color: "var(--color-muted)" }}>{s.description}</div>
                    <div className="text-xs mt-1" style={{ color: "var(--color-muted)" }}>{s.durationMinutes} min · {s.category}</div>
                  </div>
                ))}
              </div>
            )}
            <div className="mt-5">
              <label className="block text-sm font-medium mb-2" style={{ color: "var(--color-silver)" }}>Service Type</label>
              <div className="flex gap-3">
                {[["in-shop", "In-Shop ($25 fee)"], ["home-service", "Home Service ($35 fee)"]].map(([val, label]) => (
                  <div key={val} onClick={() => setForm({ ...form, serviceType: val })} className="flex-1 flex items-center gap-2 px-4 py-3 rounded-xl cursor-pointer text-sm font-medium transition-all" style={{
                    border: form.serviceType === val ? "1.5px solid var(--color-red)" : "1px solid var(--color-border)",
                    backgroundColor: form.serviceType === val ? "rgba(224,32,32,0.06)" : "var(--color-surface2)",
                    color: form.serviceType === val ? "var(--color-red)" : "var(--color-silver)",
                  }}>
                    {val === "in-shop" ? <Wrench size={15} /> : <MapPin size={15} />} {label}
                  </div>
                ))}
              </div>
            </div>
            <div className="flex justify-end mt-6">
              <button onClick={() => setStep(1)} disabled={!form.serviceId} className="flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-semibold text-white disabled:opacity-50" style={{ backgroundColor: "var(--color-red)" }}>
                Next <ArrowRight size={16} />
              </button>
            </div>
          </motion.div>
        )}

        {/* Step 1: Vehicle */}
        {step === 1 && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
            <h2 className="text-2xl font-bold mb-1" style={{ fontFamily: "Rajdhani" }}>Select Vehicle</h2>
            <p className="text-sm mb-4" style={{ color: "var(--color-muted)" }}>Which vehicle needs service?</p>

            {vehicles.isLoading ? (
              <div className="space-y-3">{[1,2].map(i => <div key={i} className="glass rounded-xl h-16 animate-pulse" />)}</div>
            ) : (
              <div className="space-y-3">
                {vehiclesList.map((v: any) => (
                  <div key={v.id} onClick={() => setForm({ ...form, vehicleId: v.id })} className="glass rounded-xl p-4 cursor-pointer flex items-center gap-3 transition-all" style={{
                    border: form.vehicleId === v.id ? "1.5px solid var(--color-red)" : "1px solid var(--color-border)",
                    backgroundColor: form.vehicleId === v.id ? "rgba(224,32,32,0.06)" : undefined,
                  }}>
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: "rgba(224,32,32,0.1)", color: "var(--color-red)" }}><Car size={18} /></div>
                    <div className="flex-1">
                      <div className="text-sm font-semibold">{v.year} {v.make} {v.model}</div>
                      <div className="text-xs" style={{ color: "var(--color-muted)" }}>{v.color && `${v.color} · `}{v.licensePlate ?? v.vin ?? "No plate"}</div>
                    </div>
                    {form.vehicleId === v.id && <CheckCircle size={18} style={{ color: "var(--color-red)" }} />}
                  </div>
                ))}
              </div>
            )}

            {/* Add vehicle inline */}
            {!showAddVehicle ? (
              <button onClick={() => setShowAddVehicle(true)} className="mt-3 flex items-center gap-2 text-sm font-medium px-4 py-2.5 rounded-lg w-full justify-center" style={{ border: "1px dashed var(--color-border)", color: "var(--color-muted)" }}>
                <Plus size={15} /> Add New Vehicle
              </button>
            ) : (
              <div className="mt-3 glass rounded-xl p-4 space-y-3" style={{ border: "1px solid var(--color-border)" }}>
                <div className="text-sm font-semibold mb-1">New Vehicle</div>
                <div className="grid grid-cols-2 gap-3">
                  {[["make","Make*"],["model","Model*"],["year","Year*"],["licensePlate","License Plate"],["color","Color"],["vin","VIN"]].map(([field, ph]) => (
                    <input key={field} placeholder={ph} value={(newVehicle as any)[field]} onChange={e => setNewVehicle({...newVehicle,[field]:e.target.value})}
                      className="px-3 py-2 rounded-lg text-sm outline-none" style={{ backgroundColor: "var(--color-surface2)", border: "1px solid var(--color-border)", color: "var(--color-white)" }} />
                  ))}
                </div>
                <div className="flex gap-2 justify-end">
                  <button onClick={() => setShowAddVehicle(false)} className="px-4 py-2 rounded-lg text-sm" style={{ border: "1px solid var(--color-border)", color: "var(--color-muted)" }}>Cancel</button>
                  <button onClick={() => addVehicleMut.mutate(newVehicle)} disabled={!newVehicle.make || !newVehicle.model || !newVehicle.year || addVehicleMut.isPending}
                    className="px-4 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-50" style={{ backgroundColor: "var(--color-red)" }}>
                    {addVehicleMut.isPending ? "Saving..." : "Save"}
                  </button>
                </div>
              </div>
            )}

            {form.serviceType === "home-service" && (
              <div className="mt-4">
                <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--color-silver)" }}>Service Address *</label>
                <input value={form.customerAddress} onChange={(e) => setForm({ ...form, customerAddress: e.target.value })} placeholder="123 Main St, City, State"
                  className="w-full px-4 py-3 rounded-lg text-sm outline-none" style={{ backgroundColor: "var(--color-surface2)", border: "1px solid var(--color-border)", color: "var(--color-white)" }} />
              </div>
            )}

            <div className="flex justify-between mt-6">
              <button onClick={() => setStep(0)} className="flex items-center gap-2 px-5 py-3 rounded-lg text-sm font-medium" style={{ border: "1px solid var(--color-border)", color: "var(--color-white)" }}><ArrowLeft size={16} /> Back</button>
              <button onClick={() => setStep(2)} disabled={!form.vehicleId || (form.serviceType === "home-service" && !form.customerAddress)} className="flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-semibold text-white disabled:opacity-50" style={{ backgroundColor: "var(--color-red)" }}>
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
              <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--color-silver)" }}>Date & Time *</label>
              <input type="datetime-local" value={form.scheduledAt} min={new Date().toISOString().slice(0, 16)} onChange={(e) => setForm({ ...form, scheduledAt: e.target.value })}
                className="w-full px-4 py-3 rounded-lg text-sm outline-none" style={{ backgroundColor: "var(--color-surface2)", border: "1px solid var(--color-border)", color: "var(--color-white)" }} />
            </div>
            <div className="mt-4">
              <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--color-silver)" }}>Additional Notes (optional)</label>
              <textarea rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Describe the issue or any specific requests..."
                className="w-full px-4 py-3 rounded-lg text-sm outline-none resize-none" style={{ backgroundColor: "var(--color-surface2)", border: "1px solid var(--color-border)", color: "var(--color-white)" }} />
            </div>
            <div className="flex justify-between mt-6">
              <button onClick={() => setStep(1)} className="flex items-center gap-2 px-5 py-3 rounded-lg text-sm font-medium" style={{ border: "1px solid var(--color-border)", color: "var(--color-white)" }}><ArrowLeft size={16} /> Back</button>
              <button onClick={() => setStep(3)} disabled={!form.scheduledAt} className="flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-semibold text-white disabled:opacity-50" style={{ backgroundColor: "var(--color-red)" }}>
                Next <ArrowRight size={16} />
              </button>
            </div>
          </motion.div>
        )}

        {/* Step 3: Payment */}
        {step === 3 && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
            <h2 className="text-2xl font-bold mb-1" style={{ fontFamily: "Rajdhani" }}>Payment Method</h2>
            <p className="text-sm mb-6" style={{ color: "var(--color-muted)" }}>How would you like to pay the booking fee?</p>
            <div className="space-y-3">
              {PAYMENT_METHODS.map(m => (
                <div key={m.value} onClick={() => setForm({ ...form, paymentMethod: m.value })} className="glass rounded-xl px-5 py-4 cursor-pointer flex items-center justify-between transition-all" style={{
                  border: form.paymentMethod === m.value ? "1.5px solid var(--color-red)" : "1px solid var(--color-border)",
                  backgroundColor: form.paymentMethod === m.value ? "rgba(224,32,32,0.06)" : undefined,
                }}>
                  <span className="text-sm font-medium">{m.label}</span>
                  {form.paymentMethod === m.value && <CheckCircle size={18} style={{ color: "var(--color-red)" }} />}
                </div>
              ))}
            </div>
            <div className="mt-4 glass rounded-xl p-4" style={{ border: "1px solid var(--color-border)" }}>
              <p className="text-xs" style={{ color: "var(--color-muted)" }}>
                A booking fee of <strong style={{ color: "var(--color-red)" }}>${bookingFee}</strong> is due to confirm your appointment. 
                The remaining service cost will be calculated after the mechanic completes the job.
              </p>
            </div>
            <div className="flex justify-between mt-6">
              <button onClick={() => setStep(2)} className="flex items-center gap-2 px-5 py-3 rounded-lg text-sm font-medium" style={{ border: "1px solid var(--color-border)", color: "var(--color-white)" }}><ArrowLeft size={16} /> Back</button>
              <button onClick={() => setStep(4)} className="flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-semibold text-white" style={{ backgroundColor: "var(--color-red)" }}>
                Next <ArrowRight size={16} />
              </button>
            </div>
          </motion.div>
        )}

        {/* Step 4: Confirm */}
        {step === 4 && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
            <h2 className="text-2xl font-bold mb-1" style={{ fontFamily: "Rajdhani" }}>Confirm Booking</h2>
            <p className="text-sm mb-6" style={{ color: "var(--color-muted)" }}>Review your appointment details</p>
            <div className="glass rounded-xl p-5 space-y-4 mb-6">
              {[
                ["Service", selectedService?.name ?? "—"],
                ["Vehicle", selectedVehicle ? `${selectedVehicle.year} ${selectedVehicle.make} ${selectedVehicle.model}` : "—"],
                ["Type", form.serviceType === "home-service" ? "Home Service" : "In-Shop"],
                ["Date", form.scheduledAt ? new Date(form.scheduledAt).toLocaleString() : "—"],
                ["Payment", PAYMENT_METHODS.find(m => m.value === form.paymentMethod)?.label ?? "—"],
                ...(form.serviceType === "home-service" ? [["Address", form.customerAddress || "—"]] : []),
                ...(form.notes ? [["Notes", form.notes]] : []),
              ].map(([label, val]) => (
                <div key={label} className="flex items-start justify-between text-sm gap-4">
                  <span style={{ color: "var(--color-muted)", flexShrink: 0 }}>{label}</span>
                  <span className="font-medium text-right">{val}</span>
                </div>
              ))}
              <div className="h-px" style={{ backgroundColor: "var(--color-border)" }} />
              <div className="flex items-center justify-between text-base font-bold">
                <span>Booking Fee Due Now</span>
                <span style={{ color: "var(--color-red)", fontFamily: "Rajdhani" }}>${bookingFee}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span style={{ color: "var(--color-muted)" }}>Service Total</span>
                <span style={{ color: "var(--color-muted)" }}>Calculated after service</span>
              </div>
            </div>
            <div className="flex justify-between">
              <button onClick={() => setStep(3)} className="flex items-center gap-2 px-5 py-3 rounded-lg text-sm font-medium" style={{ border: "1px solid var(--color-border)", color: "var(--color-white)" }}><ArrowLeft size={16} /> Back</button>
              <button onClick={() => book.mutate(form)} disabled={book.isPending} className="flex items-center gap-2 px-7 py-3 rounded-lg text-sm font-semibold text-white disabled:opacity-60 red-glow" style={{ backgroundColor: "var(--color-red)" }}>
                <CreditCard size={16} /> {book.isPending ? "Booking..." : "Confirm & Book"}
              </button>
            </div>
            {book.isError && <p className="text-sm text-center mt-3" style={{ color: "#e02020" }}>Something went wrong. Please try again.</p>}
          </motion.div>
        )}
      </div>
    </DashboardLayout>
  );
}
