import { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "wouter";
import {
  Wrench, Car, Zap, Shield, Clock, MapPin,
  Mail, CheckCircle, ArrowRight, Gauge, Battery, Wind, Settings, Send, Loader2, Bell, ClipboardCheck
} from "lucide-react";
import { Navbar } from "../components/navbar";

const fadeUp = {
  initial: { opacity: 0, y: 40 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.6 },
};

const services = [
  { icon: <Gauge size={28} />, name: "Oil Change", desc: "Full synthetic or conventional oil change with filter replacement", price: "$49.99" },
  { icon: <Settings size={28} />, name: "Brake Repair", desc: "Pad replacement, rotor inspection and resurfacing", price: "$149.99" },
  { icon: <Zap size={28} />, name: "Engine Diagnostics", desc: "Full OBD-II scan and engine diagnostic report", price: "$79.99" },
  { icon: <Car size={28} />, name: "Tire Replacement", desc: "Tire swap, balance, and alignment check", price: "$99.99" },
  { icon: <Battery size={28} />, name: "Battery Service", desc: "Battery test, replacement, and terminal cleaning", price: "$89.99" },
  { icon: <Wind size={28} />, name: "AC Repair", desc: "Refrigerant recharge, leak inspection, compressor check", price: "$129.99" },
];

const platformFeatures = [
  { icon: <CalendarIcon />, title: "One clear booking flow", desc: "Choose a service, vehicle, preferred time, and payment method in one guided request." },
  { icon: <Bell size={22} />, title: "Updates in one place", desc: "Check appointments, notifications, service history, and reminders from your account." },
  { icon: <ClipboardCheck size={22} />, title: "Details before the work", desc: "Review the selected service and booking fee before confirming your request." },
];

function CalendarIcon() {
  return <Clock size={22} />;
}

const steps = [
  { step: "01", title: "Book Online", desc: "Select your service, date, and preferred mechanic in minutes" },
  { step: "02", title: "Mechanic Assigned", desc: "Our certified mechanic reviews your request and confirms" },
  { step: "03", title: "Service Completed", desc: "Real-time updates as your vehicle is serviced" },
  { step: "04", title: "Pay & Review", desc: "Secure payment and leave a rating for your mechanic" },
];

const pricing = [
  { name: "Basic", price: "$25", period: "booking fee", features: ["In-shop service", "Service tracking", "Email notifications", "Service history"], highlight: false },
  { name: "Home Service", price: "$35", period: "booking fee", features: ["Mobile mechanic", "Priority scheduling", "SMS + email alerts", "Diagnostic report", "All Basic features"], highlight: true },
  { name: "Fleet", price: "Custom", period: "per vehicle", features: ["Unlimited bookings", "Dedicated dispatcher", "Fleet analytics", "Priority support", "Custom invoicing"], highlight: false },
];

function ContactSection() {
  const [form, setForm] = useState({ name: "", email: "", phone: "", subject: "", message: "" });
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [errMsg, setErrMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("sending");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? "Failed");
      setStatus("success");
      setForm({ name: "", email: "", phone: "", subject: "", message: "" });
    } catch (err: any) {
      setErrMsg(err.message ?? "Something went wrong. Please try again.");
      setStatus("error");
    }
  };

  return (
    <section id="contact" className="py-24 px-6 md:px-10" style={{ backgroundColor: "var(--color-surface)" }}>
      <div className="max-w-[1280px] mx-auto">
        <motion.div {...fadeUp} className="text-center mb-12">
          <div className="text-sm font-semibold uppercase tracking-widest mb-3" style={{ color: "var(--color-red)" }}>Contact</div>
          <h2 className="text-4xl md:text-5xl font-bold mb-4" style={{ fontFamily: "Rajdhani" }}>GET IN TOUCH</h2>
          <p className="max-w-xl mx-auto" style={{ color: "var(--color-silver)" }}>Have questions? Send us a message and our team will get back to you shortly.</p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-10 max-w-5xl mx-auto">
          {/* Contact info */}
          <motion.div {...fadeUp} className="space-y-6">
            <div>
              <h3 className="text-xl font-bold mb-4" style={{ fontFamily: "Rajdhani" }}>REACH US DIRECTLY</h3>
              <div className="space-y-4">
                <a href="mailto:info@librepair.com" className="flex items-center gap-4 glass px-5 py-4 rounded-xl hover:border-red-500 transition-all group">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "rgba(224,32,32,0.1)", color: "var(--color-red)" }}>
                    <Mail size={18} />
                  </div>
                  <div>
                    <div className="text-xs mb-0.5" style={{ color: "var(--color-muted)" }}>Email</div>
                    <div className="font-semibold">info@librepair.com</div>
                  </div>
                </a>
                <a href="mailto:libsupport@librepair.com" className="flex items-center gap-4 glass px-5 py-4 rounded-xl hover:border-red-500 transition-all group">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "rgba(224,32,32,0.1)", color: "var(--color-red)" }}>
                    <Mail size={18} />
                  </div>
                  <div>
                    <div className="text-xs mb-0.5" style={{ color: "var(--color-muted)" }}>Support</div>
                    <div className="font-semibold">libsupport@librepair.com</div>
                  </div>
                </a>
              </div>
            </div>
            <div className="glass rounded-xl p-5" style={{ border: "1px solid var(--color-border)" }}>
              <div className="text-sm font-semibold mb-3" style={{ color: "var(--color-red)" }}>For faster help</div>
              <ul className="text-sm space-y-3" style={{ color: "var(--color-silver)" }}>
                <li className="flex gap-2"><CheckCircle size={16} className="shrink-0 mt-0.5" color="var(--color-red)"/> Include the vehicle year, make, and model.</li>
                <li className="flex gap-2"><CheckCircle size={16} className="shrink-0 mt-0.5" color="var(--color-red)"/> Describe warning lights, sounds, leaks, or recent work.</li>
                <li className="flex gap-2"><CheckCircle size={16} className="shrink-0 mt-0.5" color="var(--color-red)"/> Do not send passwords or complete payment-card details.</li>
              </ul>
            </div>
          </motion.div>

          {/* Contact form */}
          <motion.div {...fadeUp}>
            {status === "success" ? (
              <div className="glass rounded-2xl p-8 text-center h-full flex flex-col items-center justify-center gap-4">
                <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ backgroundColor: "rgba(34,197,94,0.1)", border: "2px solid #22c55e" }}>
                  <CheckCircle size={32} color="#22c55e" />
                </div>
                <h3 className="text-2xl font-bold" style={{ fontFamily: "Rajdhani" }}>Message Sent!</h3>
                <p style={{ color: "var(--color-silver)" }}>We'll get back to you within 24 hours.</p>
                <button onClick={() => setStatus("idle")} className="mt-2 text-sm underline" style={{ color: "var(--color-red)" }}>Send another message</button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="glass rounded-2xl p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--color-silver)" }}>Full Name *</label>
                    <input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="John Smith"
                      className="w-full px-4 py-3 rounded-lg text-sm outline-none transition-all" style={{ backgroundColor: "var(--color-surface2)", border: "1px solid var(--color-border)", color: "var(--color-white)" }} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--color-silver)" }}>Phone</label>
                    <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="+1 (555) 000-0000"
                      className="w-full px-4 py-3 rounded-lg text-sm outline-none" style={{ backgroundColor: "var(--color-surface2)", border: "1px solid var(--color-border)", color: "var(--color-white)" }} />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--color-silver)" }}>Email *</label>
                  <input required type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="you@example.com"
                    className="w-full px-4 py-3 rounded-lg text-sm outline-none" style={{ backgroundColor: "var(--color-surface2)", border: "1px solid var(--color-border)", color: "var(--color-white)" }} />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--color-silver)" }}>Subject</label>
                  <input value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} placeholder="How can we help?"
                    className="w-full px-4 py-3 rounded-lg text-sm outline-none" style={{ backgroundColor: "var(--color-surface2)", border: "1px solid var(--color-border)", color: "var(--color-white)" }} />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--color-silver)" }}>Message *</label>
                  <textarea required rows={4} value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} placeholder="Tell us about your vehicle or issue..."
                    className="w-full px-4 py-3 rounded-lg text-sm outline-none resize-none" style={{ backgroundColor: "var(--color-surface2)", border: "1px solid var(--color-border)", color: "var(--color-white)" }} />
                </div>
                {status === "error" && <p className="text-xs" style={{ color: "#e02020" }}>{errMsg}</p>}
                <button type="submit" disabled={status === "sending"} className="w-full flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-semibold text-white disabled:opacity-60 transition-all" style={{ backgroundColor: "var(--color-red)" }}>
                  {status === "sending" ? <><Loader2 size={16} className="animate-spin" /> Sending...</> : <><Send size={16} /> Send Message</>}
                </button>
              </form>
            )}
          </motion.div>
        </div>
      </div>
    </section>
  );
}

export default function LandingPage() {
  return (
    <div style={{ backgroundColor: "var(--color-bg)", color: "var(--color-white)", minHeight: "100vh" }}>
      <Navbar />

      {/* Hero */}
      <section className="premium-hero relative min-h-[100dvh] flex items-center pt-[72px] overflow-hidden">
        <img src="/librepair-service-bay.webp" alt="Automotive technician inspecting a sedan in a professional service bay" className="absolute inset-0 w-full h-full object-cover object-[67%_center]" fetchPriority="high" />
        <div className="premium-hero-shade absolute inset-0" />
        <div className="max-w-[1280px] mx-auto px-6 md:px-10 w-full relative z-10 py-16">
          <div className="grid lg:grid-cols-[minmax(0,1.05fr)_minmax(300px,.62fr)] gap-10 items-end">
            <div className="max-w-2xl">
              <motion.div
                initial={{ opacity: 0, x: -40 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.7 }}
              >
                <div className="text-sm font-semibold uppercase tracking-[.18em] mb-5" style={{ color: "#ff5a55" }}>Automotive service, organized online</div>
                <h1 className="text-[clamp(3.4rem,7vw,6.8rem)] font-bold leading-[.88] tracking-[-.045em] mb-6" style={{ fontFamily: "Rajdhani, sans-serif" }}>
                  REPAIR,<br /><span style={{ color: "#ff4b46" }}>WITHOUT THE</span><br />RUNAROUND.
                </h1>
                <p className="text-lg md:text-xl mb-8 leading-relaxed max-w-xl" style={{ color: "#d8dadd" }}>
                  Request service, choose where it happens, and keep every appointment organized in one account.
                </p>

                <div className="flex flex-wrap gap-3 mb-10">
                  <Link to="/book">
                    <motion.button
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      className="flex items-center gap-2 px-7 py-3.5 rounded-md font-semibold text-white red-glow"
                      style={{ backgroundColor: "var(--color-red)" }}
                    >
                      <Car size={18} />
                      Book Appointment
                    </motion.button>
                  </Link>
                  <Link to="/book?type=home">
                    <motion.button
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      className="flex items-center gap-2 px-7 py-3.5 rounded-md font-semibold"
                      style={{ border: "1px solid var(--color-border)", color: "var(--color-white)", backgroundColor: "var(--color-surface2)" }}
                    >
                      <MapPin size={18} />
                      Home Service
                    </motion.button>
                  </Link>
                </div>

              </motion.div>
            </div>
            <motion.aside initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .35, duration: .6 }} className="service-console">
              <p className="text-sm font-semibold mb-5">Choose your service path</p>
              <Link to="/book"><div className="service-console-row"><span><Wrench size={20}/> In-shop service</span><ArrowRight size={18}/></div></Link>
              <Link to="/book?type=home"><div className="service-console-row"><span><MapPin size={20}/> Mobile service</span><ArrowRight size={18}/></div></Link>
              <Link to="/cars-for-sale"><div className="service-console-row"><span><Car size={20}/> Vehicle listings</span><ArrowRight size={18}/></div></Link>
              <p className="text-sm mt-5" style={{ color: "#a9adb2" }}>Sign in to save vehicles and follow appointments.</p>
            </motion.aside>
          </div>
        </div>
      </section>

      {/* Services */}
      <section id="services" className="py-24 px-6 md:px-10">
        <div className="max-w-[1280px] mx-auto">
          <motion.div {...fadeUp} className="text-center mb-16">
            <div className="text-sm font-semibold uppercase tracking-widest mb-3" style={{ color: "var(--color-red)" }}>Our Services</div>
            <h2 className="text-4xl md:text-5xl font-bold" style={{ fontFamily: "Rajdhani" }}>WHAT WE FIX</h2>
            <p className="mt-4 max-w-xl mx-auto" style={{ color: "var(--color-silver)" }}>Professional automotive repair and maintenance services, delivered at your convenience.</p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service, i) => (
              <motion.div
                key={service.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                whileHover={{ y: -4, boxShadow: "0 0 30px rgba(224,32,32,0.1)" }}
                className="glass rounded-xl p-6 cursor-pointer transition-all"
              >
                <div className="w-12 h-12 rounded-lg flex items-center justify-center mb-4" style={{ backgroundColor: "rgba(224,32,32,0.1)", color: "var(--color-red)" }}>
                  {service.icon}
                </div>
                <h3 className="text-xl font-bold mb-2" style={{ fontFamily: "Rajdhani" }}>{service.name}</h3>
                <p className="text-sm leading-relaxed mb-4" style={{ color: "var(--color-silver)" }}>{service.desc}</p>
                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold" style={{ color: "var(--color-red)", fontFamily: "Rajdhani" }}>From {service.price}</span>
                  <Link to="/book">
                    <button className="flex items-center gap-1 text-xs font-semibold hover:gap-2 transition-all" style={{ color: "var(--color-white)" }}>
                      Book <ArrowRight size={12} />
                    </button>
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Process */}
      <section className="py-24 px-6 md:px-10" style={{ backgroundColor: "var(--color-surface)" }}>
        <div className="max-w-[1280px] mx-auto">
          <motion.div {...fadeUp} className="text-center mb-16">
            <div className="text-sm font-semibold uppercase tracking-widest mb-3" style={{ color: "var(--color-red)" }}>How It Works</div>
            <h2 className="text-4xl md:text-5xl font-bold" style={{ fontFamily: "Rajdhani" }}>THE PROCESS</h2>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, i) => (
              <motion.div
                key={step.step}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.15 }}
                className="text-center relative"
              >
                <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold red-glow" style={{ backgroundColor: "rgba(224,32,32,0.1)", border: "2px solid rgba(224,32,32,0.3)", color: "var(--color-red)", fontFamily: "Rajdhani" }}>
                  {step.step}
                </div>
                {i < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-8 left-[calc(50%+32px)] right-[-calc(50%-32px)] h-px" style={{ backgroundColor: "var(--color-border)" }} />
                )}
                <h3 className="text-lg font-bold mb-2" style={{ fontFamily: "Rajdhani" }}>{step.title}</h3>
                <p className="text-sm" style={{ color: "var(--color-silver)" }}>{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Platform features */}
      <section className="py-24 px-6 md:px-10">
        <div className="max-w-[1280px] mx-auto">
          <motion.div {...fadeUp} className="text-center mb-16">
            <div className="text-sm font-semibold uppercase tracking-widest mb-3" style={{ color: "var(--color-red)" }}>Built for clarity</div>
            <h2 className="text-4xl md:text-5xl font-bold" style={{ fontFamily: "Rajdhani" }}>LESS GUESSWORK. MORE CONTROL.</h2>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {platformFeatures.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="glass rounded-xl p-6"
              >
                <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-5" style={{ color: "var(--color-red)", background: "rgba(224,32,32,.1)" }}>{feature.icon}</div>
                <h3 className="text-xl font-bold mb-2" style={{ fontFamily: "Rajdhani" }}>{feature.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: "var(--color-silver)" }}>{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* About */}
      <section id="about" className="py-24 px-6 md:px-10" style={{ backgroundColor: "var(--color-surface)" }}>
        <div className="max-w-[1280px] mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left — text */}
            <motion.div {...fadeUp}>
              <div className="text-sm font-semibold uppercase tracking-widest mb-3" style={{ color: "var(--color-red)" }}>About Us</div>
              <h2 className="text-4xl md:text-5xl font-bold mb-6" style={{ fontFamily: "Rajdhani" }}>
                WE'RE BUILT FOR<br />
                <span className="text-gradient">CAR OWNERS</span>
              </h2>
              <p className="text-base leading-relaxed mb-6" style={{ color: "var(--color-silver)" }}>
                LIBrepair brings booking, vehicle information, appointment updates, and service records into one straightforward experience.
              </p>
              <p className="text-base leading-relaxed mb-10" style={{ color: "var(--color-silver)" }}>
                Start with the service you need, choose where it should happen, and review your request before submitting it. Availability and final repair cost are confirmed with your appointment.
              </p>

              <Link to="/welcome"><button className="px-6 py-3 rounded-lg font-semibold text-white" style={{ background: "var(--color-red)" }}>Create your account</button></Link>
            </motion.div>

            {/* Right — values grid */}
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="grid grid-cols-2 gap-4"
            >
              {[
                { icon: <Shield size={24} />, title: "Account access", desc: "Your vehicles, appointments, and service details are organized behind your sign-in." },
                { icon: <Clock size={24} />, title: "Preferred scheduling", desc: "Request the date and time that works for you, subject to confirmation." },
                { icon: <Wrench size={24} />, title: "In-shop or mobile", desc: "Choose the service location that fits your request and availability." },
                { icon: <CheckCircle size={24} />, title: "Review before submit", desc: "See your selected service, vehicle, schedule, and fee before confirmation." },
              ].map((item, i) => (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.1 }}
                  className="glass rounded-xl p-5"
                >
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-3" style={{ backgroundColor: "rgba(224,32,32,0.1)", color: "var(--color-red)" }}>
                    {item.icon}
                  </div>
                  <h3 className="text-base font-bold mb-2" style={{ fontFamily: "Rajdhani" }}>{item.title}</h3>
                  <p className="text-xs leading-relaxed" style={{ color: "var(--color-muted)" }}>{item.desc}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24 px-6 md:px-10" style={{ backgroundColor: "var(--color-surface)" }}>
        <div className="max-w-[1280px] mx-auto">
          <motion.div {...fadeUp} className="text-center mb-16">
            <div className="text-sm font-semibold uppercase tracking-widest mb-3" style={{ color: "var(--color-red)" }}>Pricing</div>
            <h2 className="text-4xl md:text-5xl font-bold" style={{ fontFamily: "Rajdhani" }}>SIMPLE BOOKING FEES</h2>
            <p className="mt-4 max-w-lg mx-auto" style={{ color: "var(--color-silver)" }}>Pay a small booking fee upfront. The rest is settled after service completion.</p>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {pricing.map((plan, i) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className={`rounded-xl p-6 relative ${plan.highlight ? "red-glow" : ""}`}
                style={{
                  backgroundColor: plan.highlight ? "rgba(224,32,32,0.08)" : "var(--color-surface2)",
                  border: plan.highlight ? "1px solid rgba(224,32,32,0.3)" : "1px solid var(--color-border)",
                }}
              >
                {plan.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-xs font-bold px-3 py-1 rounded-full text-white" style={{ backgroundColor: "var(--color-red)" }}>
                    POPULAR
                  </div>
                )}
                <div className="text-sm font-semibold mb-2" style={{ color: "var(--color-silver)" }}>{plan.name}</div>
                <div className="text-4xl font-bold mb-1" style={{ fontFamily: "Rajdhani", color: plan.highlight ? "var(--color-red)" : "var(--color-white)" }}>{plan.price}</div>
                <div className="text-xs mb-6" style={{ color: "var(--color-muted)" }}>{plan.period}</div>
                <ul className="space-y-3 mb-6">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm" style={{ color: "var(--color-silver)" }}>
                      <CheckCircle size={14} style={{ color: "var(--color-red)", flexShrink: 0 }} />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link to="/book">
                  <button
                    className="w-full py-3 rounded-md text-sm font-semibold transition-all"
                    style={plan.highlight
                      ? { backgroundColor: "var(--color-red)", color: "white" }
                      : { border: "1px solid var(--color-border)", color: "var(--color-white)", backgroundColor: "transparent" }
                    }
                  >
                    Book Now
                  </button>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Cars for Sale CTA */}
      <section className="py-20 px-6 md:px-10 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 opacity-5" style={{ background: "linear-gradient(135deg, #e02020 0%, transparent 60%)" }} />
        </div>
        <div className="max-w-[1280px] mx-auto">
          <motion.div {...fadeUp}
            className="rounded-2xl p-10 md:p-14 flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden"
            style={{ background: "linear-gradient(135deg, #1a0a0a 0%, var(--color-surface) 100%)", border: "1px solid rgba(224,32,32,0.25)" }}>
            <div className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-10 pointer-events-none"
              style={{ background: "radial-gradient(circle, #e02020, transparent 70%)", transform: "translate(30%, -30%)" }} />
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold mb-4"
                style={{ backgroundColor: "rgba(224,32,32,0.1)", color: "var(--color-red)", border: "1px solid rgba(224,32,32,0.2)" }}>
                <Car size={11} /> Vehicles For Sale
              </div>
              <h2 className="text-3xl md:text-4xl font-bold mb-3" style={{ fontFamily: "Rajdhani" }}>
                LOOKING FOR YOUR<br /><span className="text-gradient">NEXT VEHICLE?</span>
              </h2>
              <p className="max-w-md" style={{ color: "var(--color-silver)" }}>
                Review current vehicle listings and contact the team for availability, condition details, and the next step.
              </p>
            </div>
            <div className="flex-shrink-0">
              <Link to="/cars-for-sale">
                <button className="flex items-center gap-2 px-8 py-4 rounded-xl font-semibold text-white text-base transition-opacity hover:opacity-90"
                  style={{ backgroundColor: "var(--color-red)" }}>
                  Browse Inventory <ArrowRight size={18} />
                </button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Contact */}
      <ContactSection />

      {/* Footer */}
      <footer className="py-10 px-6 md:px-10" style={{ borderTop: "1px solid var(--color-border)" }}>
        <div className="max-w-[1280px] mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="LIBrepair" className="h-8 w-auto" />
          </div>
          <p className="text-sm" style={{ color: "var(--color-muted)" }}>© 2026 LIBrepair. All rights reserved.</p>
          <div className="flex gap-6 text-sm" style={{ color: "var(--color-muted)" }}>
            <Link to="/privacy"><span className="hover:text-white transition-colors">Privacy</span></Link>
            <Link to="/terms"><span className="hover:text-white transition-colors">Terms</span></Link>
            <Link to="/support"><span className="hover:text-white transition-colors">Support</span></Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
