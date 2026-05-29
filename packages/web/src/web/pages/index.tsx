import { motion } from "framer-motion";
import { Link } from "wouter";
import {
  Wrench, Car, Zap, Shield, Star, Clock, MapPin, ChevronRight,
  Phone, Mail, CheckCircle, ArrowRight, Gauge, Battery, Wind, Settings
} from "lucide-react";
import { Navbar } from "../components/navbar";
import { AnimatedLogo } from "../components/animated-logo";

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

const testimonials = [
  { name: "Marcus Johnson", role: "Tesla Model 3 Owner", rating: 5, comment: "LIBrepair saved my car and my time. The mechanic arrived within an hour and fixed the issue on-site. Incredible service." },
  { name: "Sarah Williams", role: "BMW X5 Owner", rating: 5, comment: "Professional, fast, and affordable. My oil change was done in 45 minutes. I'll never go to another shop." },
  { name: "David Chen", role: "Honda Accord Owner", rating: 5, comment: "The live tracking feature is amazing. I knew exactly when my car would be ready. Highly recommend LIBrepair." },
];

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

export default function LandingPage() {
  return (
    <div style={{ backgroundColor: "var(--color-bg)", color: "var(--color-white)", minHeight: "100vh" }}>
      <Navbar />

      {/* Hero */}
      <section className="relative min-h-screen flex items-center pt-[72px] overflow-hidden bg-grid">
        {/* Background gradient */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/4 w-[600px] h-[600px] rounded-full opacity-10" style={{ background: "radial-gradient(circle, #e02020, transparent 70%)" }} />
          <div className="absolute bottom-0 right-0 w-[400px] h-[400px] rounded-full opacity-5" style={{ background: "radial-gradient(circle, #c0c0c0, transparent 70%)" }} />
        </div>

        <div className="max-w-[1280px] mx-auto px-6 md:px-10 w-full">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <motion.div
                initial={{ opacity: 0, x: -40 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.7 }}
              >
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold mb-6" style={{ backgroundColor: "rgba(224,32,32,0.1)", color: "var(--color-red)", border: "1px solid rgba(224,32,32,0.2)" }}>
                  <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: "var(--color-red)" }} />
                  Premium Automotive Repair Platform
                </div>
                <h1 className="text-5xl md:text-7xl font-bold leading-tight mb-6" style={{ fontFamily: "Rajdhani, sans-serif" }}>
                  YOUR CAR,<br />
                  <span className="text-gradient">EXPERTLY</span><br />
                  REPAIRED.
                </h1>
                <p className="text-lg mb-8 leading-relaxed max-w-md" style={{ color: "var(--color-silver)" }}>
                  Book certified mechanics for in-shop or home service. Real-time tracking, secure payments, and maintenance reminders — all in one platform.
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

                <div className="flex items-center gap-8">
                  {[{ val: "10K+", label: "Cars Serviced" }, { val: "500+", label: "Mechanics" }, { val: "4.9★", label: "Rating" }].map((stat) => (
                    <div key={stat.label}>
                      <div className="text-2xl font-bold" style={{ fontFamily: "Rajdhani", color: "var(--color-white)" }}>{stat.val}</div>
                      <div className="text-xs" style={{ color: "var(--color-muted)" }}>{stat.label}</div>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>

            {/* Hero Visual — Animated Logo */}
            <div className="relative hidden lg:flex items-center justify-center">
              <div className="relative">
                <AnimatedLogo size={480} showGlow />

                {/* Floating badge — top right */}
                <motion.div
                  className="absolute top-8 -right-6 glass-red rounded-xl px-4 py-3"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0, y: [0, -6, 0] }}
                  transition={{
                    opacity: { duration: 0.5, delay: 0.8 },
                    x: { duration: 0.5, delay: 0.8 },
                    y: { duration: 3, repeat: Infinity, ease: "easeInOut", delay: 1.2 },
                  }}
                >
                  <div className="text-xs font-semibold" style={{ color: "var(--color-white)" }}>🔧 In Progress</div>
                  <div className="text-xs mt-1" style={{ color: "var(--color-silver)" }}>Oil Change — ETA 20min</div>
                </motion.div>

                {/* Floating badge — bottom left */}
                <motion.div
                  className="absolute bottom-8 -left-6 glass rounded-xl px-4 py-3"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0, y: [0, 6, 0] }}
                  transition={{
                    opacity: { duration: 0.5, delay: 1.0 },
                    x: { duration: 0.5, delay: 1.0 },
                    y: { duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 1.5 },
                  }}
                >
                  <div className="text-xs font-semibold" style={{ color: "var(--color-white)" }}>✓ Completed</div>
                  <div className="text-xs mt-1" style={{ color: "var(--color-silver)" }}>Brake Repair — Saved $80</div>
                </motion.div>

                {/* Floating badge — bottom right */}
                <motion.div
                  className="absolute bottom-16 -right-4 glass rounded-xl px-4 py-3"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: [0, -4, 0] }}
                  transition={{
                    opacity: { duration: 0.5, delay: 1.2 },
                    y: { duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1.8 },
                  }}
                >
                  <div className="text-xs font-semibold" style={{ color: "var(--color-white)" }}>⭐ 4.9 Rating</div>
                  <div className="text-xs mt-1" style={{ color: "var(--color-silver)" }}>10K+ Cars Served</div>
                </motion.div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Strip */}
      <section className="py-6 overflow-hidden" style={{ backgroundColor: "var(--color-red)" }}>
        <div className="flex gap-12 whitespace-nowrap animate-[slide_20s_linear_infinite]" style={{ display: "flex" }}>
          {Array(8).fill(null).map((_, i) => (
            <span key={i} className="text-white font-bold text-sm uppercase tracking-wider" style={{ fontFamily: "Rajdhani" }}>
              ★ Book Appointment &nbsp;&nbsp; ★ Oil Change &nbsp;&nbsp; ★ Home Service &nbsp;&nbsp; ★ Engine Diagnostics &nbsp;&nbsp;
            </span>
          ))}
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

      {/* Testimonials */}
      <section className="py-24 px-6 md:px-10">
        <div className="max-w-[1280px] mx-auto">
          <motion.div {...fadeUp} className="text-center mb-16">
            <div className="text-sm font-semibold uppercase tracking-widest mb-3" style={{ color: "var(--color-red)" }}>Testimonials</div>
            <h2 className="text-4xl md:text-5xl font-bold" style={{ fontFamily: "Rajdhani" }}>WHAT CUSTOMERS SAY</h2>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <motion.div
                key={t.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="glass rounded-xl p-6"
              >
                <div className="flex gap-1 mb-4">
                  {Array(t.rating).fill(null).map((_, j) => (
                    <Star key={j} size={14} fill="#e02020" color="#e02020" />
                  ))}
                </div>
                <p className="text-sm leading-relaxed mb-6" style={{ color: "var(--color-silver)" }}>"{t.comment}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white" style={{ backgroundColor: "var(--color-red)" }}>
                    {t.name[0]}
                  </div>
                  <div>
                    <div className="text-sm font-semibold">{t.name}</div>
                    <div className="text-xs" style={{ color: "var(--color-muted)" }}>{t.role}</div>
                  </div>
                </div>
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
                LIBrepair was founded by a team of automotive engineers and software builders who were tired of overpriced, opaque repair shops. We built a platform that puts certified mechanics at your fingertips — whether you're at home, at work, or on the road.
              </p>
              <p className="text-base leading-relaxed mb-10" style={{ color: "var(--color-silver)" }}>
                Every mechanic on our platform is background-checked, certified, and rated by real customers. We believe car repair should be fast, fair, and fully transparent.
              </p>

              {/* Stats row */}
              <div className="grid grid-cols-3 gap-6">
                {[
                  { val: "10K+", label: "Cars Serviced" },
                  { val: "500+", label: "Certified Mechanics" },
                  { val: "4.9★", label: "Average Rating" },
                ].map((stat) => (
                  <div key={stat.label} className="text-center glass rounded-xl p-4">
                    <div className="text-3xl font-bold mb-1" style={{ fontFamily: "Rajdhani", color: "var(--color-red)" }}>{stat.val}</div>
                    <div className="text-xs" style={{ color: "var(--color-muted)" }}>{stat.label}</div>
                  </div>
                ))}
              </div>
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
                { icon: <Shield size={24} />, title: "Certified Mechanics", desc: "Every technician is ASE-certified and background-verified before joining our platform." },
                { icon: <Clock size={24} />, title: "Same-Day Service", desc: "Book in minutes and get your car serviced the same day, at your convenience." },
                { icon: <Wrench size={24} />, title: "Guaranteed Work", desc: "All repairs come with a 90-day parts and labor warranty. No questions asked." },
                { icon: <Star size={24} />, title: "Transparent Pricing", desc: "No hidden fees. You know exactly what you pay before the work begins." },
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

      {/* App Download */}
      <section className="py-24 px-6 md:px-10">
        <div className="max-w-[1280px] mx-auto">
          <motion.div
            {...fadeUp}
            className="glass rounded-2xl p-8 md:p-14 text-center relative overflow-hidden"
          >
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-10" style={{ background: "radial-gradient(circle, #e02020, transparent 70%)" }} />
            </div>
            <div className="relative z-10">
              <div className="text-sm font-semibold uppercase tracking-widest mb-3" style={{ color: "var(--color-red)" }}>Mobile App</div>
              <h2 className="text-4xl md:text-5xl font-bold mb-4" style={{ fontFamily: "Rajdhani" }}>TAKE LIBREPAIR ANYWHERE</h2>
              <p className="mb-8 max-w-xl mx-auto" style={{ color: "var(--color-silver)" }}>
                Book services, track repairs in real time, and get maintenance reminders — all from your phone.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <button className="flex items-center gap-3 px-6 py-3 rounded-xl font-medium" style={{ backgroundColor: "var(--color-surface2)", border: "1px solid var(--color-border)", color: "var(--color-white)" }}>
                  <span className="text-2xl">🍎</span>
                  <div className="text-left">
                    <div className="text-xs" style={{ color: "var(--color-muted)" }}>Download on the</div>
                    <div className="text-sm font-semibold">App Store</div>
                  </div>
                </button>
                <button className="flex items-center gap-3 px-6 py-3 rounded-xl font-medium" style={{ backgroundColor: "var(--color-surface2)", border: "1px solid var(--color-border)", color: "var(--color-white)" }}>
                  <span className="text-2xl">🤖</span>
                  <div className="text-left">
                    <div className="text-xs" style={{ color: "var(--color-muted)" }}>Get it on</div>
                    <div className="text-sm font-semibold">Google Play</div>
                  </div>
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Contact */}
      <section id="contact" className="py-24 px-6 md:px-10" style={{ backgroundColor: "var(--color-surface)" }}>
        <div className="max-w-[1280px] mx-auto text-center">
          <motion.div {...fadeUp}>
            <div className="text-sm font-semibold uppercase tracking-widest mb-3" style={{ color: "var(--color-red)" }}>Contact</div>
            <h2 className="text-4xl md:text-5xl font-bold mb-4" style={{ fontFamily: "Rajdhani" }}>GET IN TOUCH</h2>
            <p className="mb-10 max-w-xl mx-auto" style={{ color: "var(--color-silver)" }}>Have questions? Our support team is available 24/7 to help.</p>
            <div className="flex flex-wrap justify-center gap-6">
              <a href="tel:+1800LIBREPAIR" className="flex items-center gap-3 glass px-6 py-4 rounded-xl hover:border-red-500 transition-all">
                <Phone size={20} style={{ color: "var(--color-red)" }} />
                <span className="font-medium">1-800-LIBREPAIR</span>
              </a>
              <a href="mailto:support@librepair.com" className="flex items-center gap-3 glass px-6 py-4 rounded-xl hover:border-red-500 transition-all">
                <Mail size={20} style={{ color: "var(--color-red)" }} />
                <span className="font-medium">support@librepair.com</span>
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 px-6 md:px-10" style={{ borderTop: "1px solid var(--color-border)" }}>
        <div className="max-w-[1280px] mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="LIBrepair" className="h-8 w-auto" />
          </div>
          <p className="text-sm" style={{ color: "var(--color-muted)" }}>© 2025 LIBrepair. All rights reserved.</p>
          <div className="flex gap-6 text-sm" style={{ color: "var(--color-muted)" }}>
            <a href="#" className="hover:text-white transition-colors">Privacy</a>
            <a href="#" className="hover:text-white transition-colors">Terms</a>
            <a href="#" className="hover:text-white transition-colors">Support</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
