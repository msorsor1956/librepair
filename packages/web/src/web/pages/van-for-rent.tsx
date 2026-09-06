import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, Phone, Mail, ChevronLeft, ChevronRight, Calendar, Gauge, Fuel,
  Settings, Users, Tag, Shield, AlertTriangle, CheckCircle, Clock,
  CreditCard, DollarSign, Car, Star, Info
} from "lucide-react";
import { Navbar } from "../components/navbar";
import { authClient } from "../lib/auth";
import { useLocation } from "wouter";

const API = import.meta.env.VITE_API_URL ?? "";

interface RentalVehicle {
  id: number;
  make: string;
  model: string;
  year: number;
  color: string | null;
  mileage: number;
  fuelType: string;
  transmission: string;
  seats: number;
  dailyRate: number;
  depositAmount: number;
  description: string | null;
  photos: string[];
  isAvailable: boolean;
}

function fmt(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(n);
}
function fmtMiles(n: number) {
  return new Intl.NumberFormat("en-US").format(n) + " mi";
}

const paymentMethods = [
  { id: "credit_card", label: "Credit Card", icon: "💳" },
  { id: "debit_card", label: "Debit Card", icon: "💳" },
  { id: "cashapp", label: "Cash App", icon: "📱" },
  { id: "zelle", label: "Zelle", icon: "📲" },
  { id: "paypal", label: "PayPal", icon: "🅿️" },
  { id: "cash", label: "Cash on Pickup", icon: "💵" },
];

export default function VanForRentPage() {
  const [vehicles, setVehicles] = useState<RentalVehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<RentalVehicle | null>(null);
  const [photoIndex, setPhotoIndex] = useState(0);
  const [bookingVehicle, setBookingVehicle] = useState<RentalVehicle | null>(null);
  const [booking, setBooking] = useState({ startDate: "", endDate: "", paymentMethod: "credit_card", notes: "" });
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState<any>(null);
  const [bookingError, setBookingError] = useState("");
  const { data: session } = authClient.useSession();
  const [, navigate] = useLocation();

  useEffect(() => {
    fetch(`${API}/api/rentals/vehicles`)
      .then(r => r.json())
      .then(d => setVehicles(d.vehicles ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const totalDays = () => {
    if (!booking.startDate || !booking.endDate) return 0;
    const diff = new Date(booking.endDate).getTime() - new Date(booking.startDate).getTime();
    return Math.max(1, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  const handleBook = async () => {
    if (!session) { navigate("/sign-in"); return; }
    if (!bookingVehicle) return;
    if (!booking.startDate || !booking.endDate) { setBookingError("Please select rental dates."); return; }
    if (new Date(booking.endDate) <= new Date(booking.startDate)) { setBookingError("End date must be after start date."); return; }
    setBookingLoading(true);
    setBookingError("");
    try {
      const res = await fetch(`${API}/api/rentals/book`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vehicleId: bookingVehicle.id,
          startDate: new Date(booking.startDate).toISOString(),
          endDate: new Date(booking.endDate).toISOString(),
          paymentMethod: booking.paymentMethod,
          customerNotes: booking.notes,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setBookingError(data.message ?? "Booking failed."); return; }
      setBookingSuccess(data);
    } catch {
      setBookingError("Network error. Try again.");
    } finally {
      setBookingLoading(false);
    }
  };

  return (
    <div style={{ backgroundColor: "var(--color-bg)", color: "var(--color-white)", minHeight: "100vh" }}>
      <Navbar />

      {/* Hero */}
      <section className="pt-[100px] pb-14 px-6 md:px-10 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/3 w-[600px] h-[600px] rounded-full opacity-5"
            style={{ background: "radial-gradient(circle, #e02020, transparent 70%)" }} />
        </div>
        <div className="max-w-[1280px] mx-auto">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold mb-4"
              style={{ backgroundColor: "rgba(224,32,32,0.1)", color: "var(--color-red)", border: "1px solid rgba(224,32,32,0.2)" }}>
              <Car size={12} /> Van Rental
            </div>
            <h1 className="text-4xl md:text-6xl font-bold mb-4" style={{ fontFamily: "Rajdhani, sans-serif" }}>
              VAN FOR <span className="text-gradient">RENT</span>
            </h1>
            <p className="text-lg max-w-2xl mb-6" style={{ color: "var(--color-silver)" }}>
              Reliable vehicles at $100/day. Simple booking, transparent pricing, no hidden fees.
            </p>

            {/* Quick stats */}
            <div className="flex flex-wrap gap-4">
              {[
                { icon: <DollarSign size={16} />, label: "$100.00 / 24 Hours" },
                { icon: <Shield size={16} />, label: "$25.00 Deposit to Book" },
                { icon: <Fuel size={16} />, label: "Return with Full Tank" },
                { icon: <CreditCard size={16} />, label: "Card · CashApp · Zelle · PayPal" },
              ].map(({ icon, label }) => (
                <div key={label} className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm"
                  style={{ backgroundColor: "var(--color-surface)", border: "1px solid var(--color-border)", color: "var(--color-silver)" }}>
                  <span style={{ color: "var(--color-red)" }}>{icon}</span> {label}
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Rental Policy */}
      <section className="px-6 md:px-10 pb-10">
        <div className="max-w-[1280px] mx-auto">
          <div className="rounded-2xl p-6 md:p-8" style={{ backgroundColor: "rgba(224,32,32,0.05)", border: "1px solid rgba(224,32,32,0.2)" }}>
            <div className="flex items-center gap-2 mb-4">
              <Shield size={18} style={{ color: "var(--color-red)" }} />
              <h2 className="text-lg font-bold">Rental Policy</h2>
            </div>
            <div className="grid md:grid-cols-2 gap-3">
              {[
                "Rental Fee: $100.00 per 24-hour period.",
                "A non-refundable booking deposit of $25.00 is required to reserve a vehicle.",
                "The deposit will be credited toward the total rental amount at vehicle pickup.",
                "Customer is responsible for replacing all fuel used during the rental period.",
                "If the customer does not show up, does not call, or cancels after booking, the deposit will not be refunded.",
                "A new booking and deposit will be required for any future reservation.",
              ].map((t, i) => (
                <div key={i} className="flex items-start gap-2 text-sm" style={{ color: "var(--color-silver)" }}>
                  <CheckCircle size={14} className="mt-0.5 flex-shrink-0" style={{ color: "var(--color-red)" }} />
                  <span>{t}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Vehicles Grid */}
      <section className="px-6 md:px-10 pb-20">
        <div className="max-w-[1280px] mx-auto">
          <h2 className="text-2xl font-bold mb-6" style={{ fontFamily: "Rajdhani, sans-serif" }}>
            AVAILABLE <span className="text-gradient">VEHICLES</span>
          </h2>
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-80 rounded-xl animate-pulse" style={{ backgroundColor: "var(--color-surface)" }} />
              ))}
            </div>
          ) : vehicles.length === 0 ? (
            <div className="text-center py-24">
              <div className="text-6xl mb-4">🚐</div>
              <p className="text-xl font-semibold mb-2">No vehicles available</p>
              <p style={{ color: "var(--color-silver)" }}>Check back soon for new listings.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {vehicles.map((v, i) => (
                <motion.div
                  key={v.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.07 }}
                  className="rounded-xl overflow-hidden cursor-pointer group transition-transform hover:-translate-y-1"
                  style={{ backgroundColor: "var(--color-surface)", border: "1px solid var(--color-border)" }}
                  onClick={() => { setSelected(v); setPhotoIndex(0); }}
                >
                  {/* Photo */}
                  <div className="relative h-52 bg-black overflow-hidden">
                    {v.photos.length > 0 ? (
                      <img src={v.photos[0]} alt={`${v.year} ${v.make} ${v.model}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-5xl">🚐</div>
                    )}
                    <div className="absolute top-3 left-3">
                      <span className="px-2.5 py-1 rounded-full text-xs font-bold uppercase"
                        style={{
                          backgroundColor: v.isAvailable ? "rgba(34,197,94,0.15)" : "rgba(224,32,32,0.15)",
                          color: v.isAvailable ? "#22c55e" : "#e02020",
                          border: `1px solid ${v.isAvailable ? "rgba(34,197,94,0.3)" : "rgba(224,32,32,0.3)"}`,
                        }}>
                        {v.isAvailable ? "Available" : "Unavailable"}
                      </span>
                    </div>
                    {v.photos.length > 1 && (
                      <div className="absolute bottom-3 left-3 px-2 py-0.5 rounded-full text-xs"
                        style={{ backgroundColor: "rgba(0,0,0,0.7)", color: "var(--color-silver)" }}>
                        {v.photos.length} photos
                      </div>
                    )}
                  </div>
                  {/* Info */}
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="font-bold text-base" style={{ fontFamily: "Rajdhani, sans-serif" }}>
                        {v.year} {v.make} {v.model}
                      </h3>
                      <span className="text-lg font-bold whitespace-nowrap" style={{ color: "var(--color-red)" }}>
                        {fmt(v.dailyRate)}<span className="text-xs font-normal" style={{ color: "var(--color-silver)" }}>/day</span>
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-3 text-xs mb-4" style={{ color: "var(--color-silver)" }}>
                      <span className="flex items-center gap-1"><Gauge size={11} /> {fmtMiles(v.mileage)}</span>
                      <span className="flex items-center gap-1"><Fuel size={11} /> {v.fuelType}</span>
                      <span className="flex items-center gap-1"><Settings size={11} /> {v.transmission}</span>
                      <span className="flex items-center gap-1"><Users size={11} /> {v.seats} seats</span>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); if (v.isAvailable) { setBookingVehicle(v); setBookingSuccess(null); setBookingError(""); setBooking({ startDate: "", endDate: "", paymentMethod: "credit_card", notes: "" }); } }}
                      disabled={!v.isAvailable}
                      className="w-full py-2.5 rounded-lg text-sm font-bold transition-all"
                      style={{
                        backgroundColor: v.isAvailable ? "var(--color-red)" : "var(--color-surface2)",
                        color: v.isAvailable ? "#fff" : "var(--color-silver)",
                        opacity: v.isAvailable ? 1 : 0.6,
                        cursor: v.isAvailable ? "pointer" : "not-allowed",
                      }}>
                      {v.isAvailable ? `Book Now — ${fmt(v.depositAmount)} Deposit` : "Not Available"}
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Vehicle Detail Modal */}
      <AnimatePresence>
        {selected && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-start justify-center overflow-y-auto py-8 px-4"
            style={{ backgroundColor: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)" }}
            onClick={e => e.target === e.currentTarget && setSelected(null)}>
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }} transition={{ duration: 0.25 }}
              className="w-full max-w-3xl rounded-2xl overflow-hidden"
              style={{ backgroundColor: "var(--color-bg)", border: "1px solid var(--color-border)" }}>
              {/* Photos */}
              <div className="relative bg-black aspect-video">
                {selected.photos.length > 0 ? (
                  <img src={selected.photos[photoIndex]} alt={`${selected.year} ${selected.make}`}
                    className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-6xl">🚐</div>
                )}
                {selected.photos.length > 1 && (
                  <>
                    <button onClick={() => setPhotoIndex(i => (i - 1 + selected.photos.length) % selected.photos.length)}
                      className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: "rgba(0,0,0,0.7)" }}>
                      <ChevronLeft size={18} className="text-white" />
                    </button>
                    <button onClick={() => setPhotoIndex(i => (i + 1) % selected.photos.length)}
                      className="absolute right-10 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: "rgba(0,0,0,0.7)" }}>
                      <ChevronRight size={18} className="text-white" />
                    </button>
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                      {selected.photos.map((_, idx) => (
                        <button key={idx} onClick={() => setPhotoIndex(idx)}
                          className="w-2 h-2 rounded-full transition-all"
                          style={{ backgroundColor: idx === photoIndex ? "white" : "rgba(255,255,255,0.4)" }} />
                      ))}
                    </div>
                  </>
                )}
                <button onClick={() => setSelected(null)}
                  className="absolute top-3 right-3 w-9 h-9 rounded-full flex items-center justify-center z-10"
                  style={{ backgroundColor: "rgba(0,0,0,0.7)", border: "1px solid rgba(255,255,255,0.1)" }}>
                  <X size={16} className="text-white" />
                </button>
              </div>
              {/* Details */}
              <div className="p-6 md:p-8">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-6">
                  <div>
                    <h2 className="text-2xl font-bold mb-1" style={{ fontFamily: "Rajdhani, sans-serif" }}>
                      {selected.year} {selected.make} {selected.model}
                    </h2>
                    {selected.color && <p className="text-sm" style={{ color: "var(--color-silver)" }}>Color: {selected.color}</p>}
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold" style={{ color: "var(--color-red)", fontFamily: "Rajdhani" }}>
                      {fmt(selected.dailyRate)}<span className="text-sm font-normal text-gray-400">/day</span>
                    </div>
                    <div className="text-sm" style={{ color: "var(--color-silver)" }}>
                      {fmt(selected.depositAmount)} deposit to book
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                  {[
                    { label: "Mileage", value: fmtMiles(selected.mileage), icon: <Gauge size={14} /> },
                    { label: "Fuel", value: selected.fuelType, icon: <Fuel size={14} /> },
                    { label: "Transmission", value: selected.transmission, icon: <Settings size={14} /> },
                    { label: "Seats", value: String(selected.seats), icon: <Users size={14} /> },
                  ].map(({ label, value, icon }) => (
                    <div key={label} className="rounded-lg p-3" style={{ backgroundColor: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
                      <div className="flex items-center gap-1.5 mb-1 text-xs" style={{ color: "var(--color-silver)" }}>{icon} {label}</div>
                      <div className="font-semibold capitalize text-sm">{value}</div>
                    </div>
                  ))}
                </div>
                {selected.description && (
                  <p className="text-sm leading-relaxed mb-6" style={{ color: "var(--color-silver)" }}>{selected.description}</p>
                )}
                <button
                  onClick={() => { setSelected(null); if (selected.isAvailable) { setBookingVehicle(selected); setBookingSuccess(null); setBookingError(""); setBooking({ startDate: "", endDate: "", paymentMethod: "credit_card", notes: "" }); } }}
                  disabled={!selected.isAvailable}
                  className="w-full py-3 rounded-xl font-bold text-sm transition-all"
                  style={{ backgroundColor: selected.isAvailable ? "var(--color-red)" : "#333", color: "#fff", opacity: selected.isAvailable ? 1 : 0.5 }}>
                  {selected.isAvailable ? `Book This Vehicle — ${fmt(selected.depositAmount)} Deposit` : "Currently Unavailable"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Booking Modal */}
      <AnimatePresence>
        {bookingVehicle && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[300] flex items-start justify-center overflow-y-auto py-8 px-4"
            style={{ backgroundColor: "rgba(0,0,0,0.9)", backdropFilter: "blur(10px)" }}
            onClick={e => e.target === e.currentTarget && !bookingLoading && setBookingVehicle(null)}>
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }} transition={{ duration: 0.25 }}
              className="w-full max-w-lg rounded-2xl overflow-hidden"
              style={{ backgroundColor: "var(--color-bg)", border: "1px solid var(--color-border)" }}>
              {bookingSuccess ? (
                <div className="p-8 text-center">
                  <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                    style={{ backgroundColor: "rgba(34,197,94,0.15)" }}>
                    <CheckCircle size={32} style={{ color: "#22c55e" }} />
                  </div>
                  <h3 className="text-2xl font-bold mb-2" style={{ fontFamily: "Rajdhani" }}>Booking Received!</h3>
                  <p className="text-sm mb-4" style={{ color: "var(--color-silver)" }}>
                    Ref: <strong style={{ color: "var(--color-red)" }}>{bookingSuccess.booking?.bookingRef}</strong>
                  </p>
                  <div className="rounded-xl p-4 mb-6 text-sm text-left" style={{ backgroundColor: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
                    <div className="flex justify-between mb-2"><span style={{ color: "var(--color-silver)" }}>Vehicle</span><span>{bookingVehicle.year} {bookingVehicle.make} {bookingVehicle.model}</span></div>
                    <div className="flex justify-between mb-2"><span style={{ color: "var(--color-silver)" }}>Dates</span><span>{new Date(booking.startDate).toLocaleDateString()} – {new Date(booking.endDate).toLocaleDateString()}</span></div>
                    <div className="flex justify-between mb-2"><span style={{ color: "var(--color-silver)" }}>Days</span><span>{totalDays()}</span></div>
                    <div className="flex justify-between mb-2"><span style={{ color: "var(--color-silver)" }}>Total</span><span>{fmt(totalDays() * bookingVehicle.dailyRate)}</span></div>
                    <div className="flex justify-between font-bold pt-2" style={{ borderTop: "1px solid var(--color-border)" }}>
                      <span style={{ color: "var(--color-red)" }}>Deposit Due Now</span>
                      <span style={{ color: "var(--color-red)" }}>{fmt(bookingVehicle.depositAmount)}</span>
                    </div>
                  </div>
                  <p className="text-xs mb-6" style={{ color: "var(--color-silver)" }}>
                    We'll review your booking and confirm shortly. The ${bookingVehicle.depositAmount.toFixed(2)} deposit secures your reservation and is credited toward your total at pickup.
                  </p>
                  <button onClick={() => setBookingVehicle(null)}
                    className="w-full py-3 rounded-xl font-bold text-sm"
                    style={{ backgroundColor: "var(--color-red)", color: "#fff" }}>
                    Done
                  </button>
                </div>
              ) : (
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold" style={{ fontFamily: "Rajdhani" }}>Book Vehicle</h3>
                    <button onClick={() => !bookingLoading && setBookingVehicle(null)}
                      className="w-8 h-8 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: "var(--color-surface)" }}>
                      <X size={14} />
                    </button>
                  </div>

                  {/* Vehicle summary */}
                  <div className="flex items-center gap-3 p-3 rounded-xl mb-6" style={{ backgroundColor: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
                    {bookingVehicle.photos[0] && (
                      <img src={bookingVehicle.photos[0]} alt="" className="w-16 h-12 rounded-lg object-cover" />
                    )}
                    <div className="flex-1">
                      <p className="font-bold text-sm">{bookingVehicle.year} {bookingVehicle.make} {bookingVehicle.model}</p>
                      <p className="text-xs" style={{ color: "var(--color-silver)" }}>{fmt(bookingVehicle.dailyRate)}/day · {fmt(bookingVehicle.depositAmount)} deposit</p>
                    </div>
                  </div>

                  {bookingError && (
                    <div className="flex items-center gap-2 p-3 rounded-lg mb-4 text-sm"
                      style={{ backgroundColor: "rgba(224,32,32,0.1)", border: "1px solid rgba(224,32,32,0.2)", color: "#e02020" }}>
                      <AlertTriangle size={14} /> {bookingError}
                    </div>
                  )}

                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium mb-1" style={{ color: "var(--color-silver)" }}>Pick-up Date</label>
                        <input type="date" value={booking.startDate} min={new Date().toISOString().split("T")[0]}
                          onChange={e => setBooking(b => ({ ...b, startDate: e.target.value }))}
                          className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
                          style={{ backgroundColor: "var(--color-surface)", border: "1px solid var(--color-border)", color: "var(--color-white)" }} />
                      </div>
                      <div>
                        <label className="block text-xs font-medium mb-1" style={{ color: "var(--color-silver)" }}>Return Date</label>
                        <input type="date" value={booking.endDate} min={booking.startDate || new Date().toISOString().split("T")[0]}
                          onChange={e => setBooking(b => ({ ...b, endDate: e.target.value }))}
                          className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
                          style={{ backgroundColor: "var(--color-surface)", border: "1px solid var(--color-border)", color: "var(--color-white)" }} />
                      </div>
                    </div>

                    {/* Cost summary */}
                    {totalDays() > 0 && (
                      <div className="rounded-xl p-4 text-sm" style={{ backgroundColor: "rgba(224,32,32,0.05)", border: "1px solid rgba(224,32,32,0.15)" }}>
                        <div className="flex justify-between mb-1"><span style={{ color: "var(--color-silver)" }}>{totalDays()} day(s) × {fmt(bookingVehicle.dailyRate)}</span><span>{fmt(totalDays() * bookingVehicle.dailyRate)}</span></div>
                        <div className="flex justify-between mb-2"><span style={{ color: "var(--color-silver)" }}>Deposit (due now)</span><span style={{ color: "var(--color-red)" }}>− {fmt(bookingVehicle.depositAmount)}</span></div>
                        <div className="flex justify-between font-bold pt-2" style={{ borderTop: "1px solid rgba(224,32,32,0.2)" }}>
                          <span>Balance at Pickup</span>
                          <span>{fmt(Math.max(0, totalDays() * bookingVehicle.dailyRate - bookingVehicle.depositAmount))}</span>
                        </div>
                      </div>
                    )}

                    <div>
                      <label className="block text-xs font-medium mb-2" style={{ color: "var(--color-silver)" }}>Deposit Payment Method</label>
                      <div className="grid grid-cols-3 gap-2">
                        {paymentMethods.map(m => (
                          <button key={m.id} onClick={() => setBooking(b => ({ ...b, paymentMethod: m.id }))}
                            className="flex flex-col items-center gap-1 p-2 rounded-lg text-xs font-medium transition-all"
                            style={{
                              backgroundColor: booking.paymentMethod === m.id ? "rgba(224,32,32,0.15)" : "var(--color-surface)",
                              border: `1px solid ${booking.paymentMethod === m.id ? "var(--color-red)" : "var(--color-border)"}`,
                              color: booking.paymentMethod === m.id ? "var(--color-red)" : "var(--color-silver)",
                            }}>
                            <span>{m.icon}</span>
                            <span>{m.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium mb-1" style={{ color: "var(--color-silver)" }}>Notes (optional)</label>
                      <textarea value={booking.notes} onChange={e => setBooking(b => ({ ...b, notes: e.target.value }))}
                        placeholder="Any special requests..."
                        rows={2}
                        className="w-full px-3 py-2.5 rounded-lg text-sm outline-none resize-none"
                        style={{ backgroundColor: "var(--color-surface)", border: "1px solid var(--color-border)", color: "var(--color-white)" }} />
                    </div>

                    {/* Policy reminder */}
                    <div className="flex items-start gap-2 p-3 rounded-lg text-xs" style={{ backgroundColor: "rgba(212,160,23,0.08)", border: "1px solid rgba(212,160,23,0.2)", color: "#D4A017" }}>
                      <Info size={13} className="mt-0.5 flex-shrink-0" />
                      The {fmt(bookingVehicle.depositAmount)} deposit is non-refundable if you cancel or don't show up. It will be applied to your total at pickup.
                    </div>

                    <button onClick={handleBook} disabled={bookingLoading}
                      className="w-full py-3 rounded-xl font-bold text-sm transition-all"
                      style={{ backgroundColor: "var(--color-red)", color: "#fff", opacity: bookingLoading ? 0.7 : 1 }}>
                      {bookingLoading ? "Submitting..." : session ? `Confirm Booking — ${fmt(bookingVehicle.depositAmount)} Deposit` : "Sign In to Book"}
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
