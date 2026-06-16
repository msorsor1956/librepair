import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import { authClient, clearToken } from "../lib/auth";
import { api } from "../lib/api";
import {
  LayoutDashboard, Car, Calendar, Clock, FileText, CreditCard,
  Bell, MessageCircle, User, LogOut, Menu, X, Wrench,
  ChevronRight, AlertCircle, TrendingUp, Shield
} from "lucide-react";

type Tab = "overview" | "vehicles" | "appointments" | "history" | "invoices" | "payments" | "reminders" | "notifications" | "profile" | "support";

export default function CustomerDashboardPage() {
  const [, navigate] = useLocation();
  const { data: session, isPending } = authClient.useSession();
  const [tab, setTab] = useState<Tab>("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isPending && !session) navigate("/welcome");
  }, [session, isPending]);

  useEffect(() => {
    if (!session) return;
    loadData();
  }, [session]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [notifRes, apptRes, vehRes, invRes, payRes] = await Promise.allSettled([
        fetch("/api/customer/notifications", { headers: { Authorization: `Bearer ${localStorage.getItem("bearer_token")}` } }),
        fetch("/api/customer/appointments", { headers: { Authorization: `Bearer ${localStorage.getItem("bearer_token")}` } }),
        fetch("/api/customer/vehicles", { headers: { Authorization: `Bearer ${localStorage.getItem("bearer_token")}` } }),
        fetch("/api/customer/invoices", { headers: { Authorization: `Bearer ${localStorage.getItem("bearer_token")}` } }),
        fetch("/api/customer/payments", { headers: { Authorization: `Bearer ${localStorage.getItem("bearer_token")}` } }),
      ]);
      if (notifRes.status === "fulfilled" && notifRes.value.ok) setNotifications((await notifRes.value.json()).notifications ?? []);
      if (apptRes.status === "fulfilled" && apptRes.value.ok) setAppointments((await apptRes.value.json()).appointments ?? []);
      if (vehRes.status === "fulfilled" && vehRes.value.ok) setVehicles((await vehRes.value.json()).vehicles ?? []);
      if (invRes.status === "fulfilled" && invRes.value.ok) setInvoices((await invRes.value.json()).invoices ?? []);
      if (payRes.status === "fulfilled" && payRes.value.ok) setPayments((await payRes.value.json()).payments ?? []);
    } catch { }
    setLoading(false);
  };

  const handleSignOut = async () => {
    await authClient.signOut();
    clearToken();
    navigate("/welcome");
  };

  if (isPending) return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "var(--color-bg)" }}>
      <div className="flex gap-2">
        {[0, 1, 2].map(i => (
          <motion.div key={i} className="w-2 h-2 rounded-full" style={{ backgroundColor: "var(--color-red)" }} animate={{ scale: [1, 1.4, 1] }} transition={{ duration: 1, delay: i * 0.2, repeat: Infinity }} />
        ))}
      </div>
    </div>
  );

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const nav: { id: Tab; label: string; icon: any; badge?: number }[] = [
    { id: "overview", label: "Dashboard", icon: LayoutDashboard },
    { id: "vehicles", label: "My Vehicles", icon: Car, badge: vehicles.length },
    { id: "appointments", label: "Appointments", icon: Calendar, badge: appointments.filter(a => a.status !== "completed" && a.status !== "cancelled").length },
    { id: "history", label: "Service History", icon: Clock },
    { id: "invoices", label: "Invoices", icon: FileText, badge: invoices.filter(i => i.status === "sent" || i.status === "overdue").length },
    { id: "payments", label: "Payments", icon: CreditCard },
    { id: "reminders", label: "Oil Reminders", icon: AlertCircle },
    { id: "notifications", label: "Notifications", icon: Bell, badge: unreadCount },
    { id: "profile", label: "My Profile", icon: User },
    { id: "support", label: "Support Chat", icon: MessageCircle },
  ];

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: "var(--color-bg)" }}>
      {/* Sidebar overlay (mobile) */}
      {sidebarOpen && <div className="fixed inset-0 z-40 bg-black/60 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* Sidebar */}
      <aside className={`fixed top-0 left-0 h-full z-50 w-64 flex flex-col transition-transform duration-300 lg:translate-x-0 lg:static lg:z-auto ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`} style={{ backgroundColor: "var(--color-surface)", borderRight: "1px solid var(--color-border)" }}>
        <div className="p-5 flex items-center justify-between border-b" style={{ borderColor: "var(--color-border)" }}>
          <img src="/logo.png" alt="LIBrepair" className="h-8 w-auto" />
          <button className="lg:hidden" onClick={() => setSidebarOpen(false)}><X size={18} style={{ color: "var(--color-muted)" }} /></button>
        </div>

        <div className="px-4 py-4 border-b" style={{ borderColor: "var(--color-border)" }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold" style={{ backgroundColor: "rgba(224,32,32,0.2)", color: "var(--color-red)" }}>
              {session?.user?.name?.[0]?.toUpperCase() ?? "C"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">{session?.user?.name ?? "Customer"}</p>
              <p className="text-xs truncate" style={{ color: "var(--color-muted)" }}>{session?.user?.email ?? ""}</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
          {nav.map(({ id, label, icon: Icon, badge }) => (
            <button
              key={id}
              onClick={() => { setTab(id); setSidebarOpen(false); }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all text-left"
              style={{
                backgroundColor: tab === id ? "rgba(224,32,32,0.12)" : "transparent",
                color: tab === id ? "var(--color-red)" : "var(--color-silver)",
              }}
            >
              <Icon size={17} />
              <span className="flex-1">{label}</span>
              {badge !== undefined && badge > 0 && (
                <span className="text-xs px-1.5 py-0.5 rounded-full font-bold" style={{ backgroundColor: "var(--color-red)", color: "white" }}>{badge}</span>
              )}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t" style={{ borderColor: "var(--color-border)" }}>
          <button onClick={handleSignOut} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all" style={{ color: "var(--color-muted)" }}>
            <LogOut size={17} /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-y-auto">
        {/* Topbar */}
        <div className="sticky top-0 z-30 px-6 py-4 flex items-center justify-between border-b" style={{ backgroundColor: "var(--color-bg)", borderColor: "var(--color-border)" }}>
          <div className="flex items-center gap-3">
            <button className="lg:hidden" onClick={() => setSidebarOpen(true)}><Menu size={22} /></button>
            <h2 className="text-xl font-bold" style={{ fontFamily: "Rajdhani" }}>{nav.find(n => n.id === tab)?.label}</h2>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => setTab("notifications")} className="relative p-2 rounded-lg" style={{ backgroundColor: "var(--color-surface2)" }}>
              <Bell size={18} />
              {unreadCount > 0 && <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full text-xs flex items-center justify-center font-bold" style={{ backgroundColor: "var(--color-red)", color: "white" }}>{unreadCount}</span>}
            </button>
            <Link to="/book">
              <button className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white red-glow" style={{ backgroundColor: "var(--color-red)" }}>
                <Calendar size={15} /> Book Service
              </button>
            </Link>
          </div>
        </div>

        <div className="p-6">
          {tab === "overview" && <OverviewTab session={session} appointments={appointments} vehicles={vehicles} invoices={invoices} payments={payments} navigate={navigate} setTab={setTab} />}
          {tab === "vehicles" && <VehiclesTab vehicles={vehicles} onRefresh={loadData} />}
          {tab === "appointments" && <AppointmentsTab appointments={appointments} />}
          {tab === "history" && <HistoryTab />}
          {tab === "invoices" && <InvoicesTab invoices={invoices} />}
          {tab === "payments" && <PaymentsTab payments={payments} />}
          {tab === "reminders" && <RemindersTab vehicles={vehicles} />}
          {tab === "notifications" && <NotificationsTab notifications={notifications} onRefresh={loadData} />}
          {tab === "profile" && <ProfileTab session={session} onRefresh={loadData} />}
          {tab === "support" && <SupportTab session={session} />}
        </div>
      </main>
    </div>
  );
}

// ── Overview Tab ──────────────────────────────────────────────────────────────
function OverviewTab({ session, appointments, vehicles, invoices, payments, navigate, setTab }: any) {
  const upcoming = appointments.filter((a: any) => a.status === "pending" || a.status === "confirmed");
  const totalSpent = payments.filter((p: any) => p.status === "paid").reduce((s: number, p: any) => s + p.amount, 0);
  const unpaidInvoices = invoices.filter((i: any) => i.status === "sent" || i.status === "overdue");

  const stats = [
    { label: "Vehicles", value: vehicles.length, icon: Car, color: "#3b82f6" },
    { label: "Upcoming", value: upcoming.length, icon: Calendar, color: "var(--color-warning)" },
    { label: "Total Spent", value: `$${totalSpent.toFixed(0)}`, icon: CreditCard, color: "var(--color-success)" },
    { label: "Open Invoices", value: unpaidInvoices.length, icon: FileText, color: "var(--color-red)" },
  ];

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h3 className="text-2xl font-bold mb-1" style={{ fontFamily: "Rajdhani" }}>
          Welcome back, {session?.user?.name?.split(" ")[0] ?? "Customer"}
        </h3>
        <p className="text-sm" style={{ color: "var(--color-muted)" }}>Here's what's happening with your vehicles</p>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(({ label, value, icon: Icon, color }, i) => (
          <motion.div key={label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className="glass rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm" style={{ color: "var(--color-muted)" }}>{label}</span>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${color}20` }}>
                <Icon size={16} style={{ color }} />
              </div>
            </div>
            <p className="text-3xl font-bold" style={{ fontFamily: "Rajdhani" }}>{value}</p>
          </motion.div>
        ))}
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <QuickAction icon={Calendar} title="Book Service" desc="Schedule your next appointment" onClick={() => navigate("/book")} color="var(--color-red)" />
        <QuickAction icon={Car} title="Manage Vehicles" desc="Add or update your vehicles" onClick={() => setTab("vehicles")} color="#3b82f6" />
        <QuickAction icon={FileText} title="View Invoices" desc={unpaidInvoices.length > 0 ? `${unpaidInvoices.length} invoice(s) awaiting payment` : "All invoices paid"} onClick={() => setTab("invoices")} color="var(--color-warning)" />
      </div>

      {/* Upcoming appointments */}
      {upcoming.length > 0 && (
        <div className="glass rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-semibold">Upcoming Appointments</h4>
            <button onClick={() => setTab("appointments")} className="text-xs" style={{ color: "var(--color-red)" }}>View all →</button>
          </div>
          <div className="space-y-3">
            {upcoming.slice(0, 3).map((a: any) => (
              <div key={a.id} className="flex items-center justify-between p-3 rounded-lg" style={{ backgroundColor: "var(--color-surface2)" }}>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: "rgba(224,32,32,0.15)" }}>
                    <Wrench size={16} style={{ color: "var(--color-red)" }} />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{a.serviceType === "home-service" ? "Home Service" : "In-Shop Service"}</p>
                    <p className="text-xs" style={{ color: "var(--color-muted)" }}>{new Date(a.scheduledAt).toLocaleDateString()}</p>
                  </div>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full status-${a.status}`}>{a.status}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Security badge */}
      <div className="glass rounded-xl p-4 flex items-center gap-3">
        <Shield size={20} style={{ color: "var(--color-success)" }} />
        <div>
          <p className="text-sm font-medium">Account Secured</p>
          <p className="text-xs" style={{ color: "var(--color-muted)" }}>JWT authentication · Encrypted data · Secure sessions</p>
        </div>
      </div>
    </div>
  );
}

function QuickAction({ icon: Icon, title, desc, onClick, color }: { icon: any; title: string; desc: string; onClick: () => void; color: string }) {
  return (
    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={onClick}
      className="glass rounded-xl p-4 text-left w-full flex items-start gap-3 transition-all">
      <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${color}20` }}>
        <Icon size={20} style={{ color }} />
      </div>
      <div>
        <p className="font-semibold text-sm mb-0.5">{title}</p>
        <p className="text-xs" style={{ color: "var(--color-muted)" }}>{desc}</p>
      </div>
    </motion.button>
  );
}

// ── Vehicles Tab ───────────────────────────────────────────────────────────────
function VehiclesTab({ vehicles, onRefresh }: { vehicles: any[]; onRefresh: () => void }) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ make: "", model: "", year: "", vin: "", licensePlate: "", color: "", mileage: "" });
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setLoading(true);
    await fetch("/api/customer/vehicles", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("bearer_token")}` },
      body: JSON.stringify({ ...form, year: parseInt(form.year), mileage: parseInt(form.mileage) || 0 }),
    });
    setLoading(false);
    setShowForm(false);
    onRefresh();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold" style={{ fontFamily: "Rajdhani" }}>My Vehicles</h3>
        <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white" style={{ backgroundColor: "var(--color-red)" }}>
          <Car size={15} /> {showForm ? "Cancel" : "Add Vehicle"}
        </button>
      </div>

      {showForm && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-xl p-5">
          <h4 className="font-semibold mb-4">Add New Vehicle</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { key: "make", label: "Make", placeholder: "Toyota" },
              { key: "model", label: "Model", placeholder: "Camry" },
              { key: "year", label: "Year", placeholder: "2022", type: "number" },
              { key: "color", label: "Color", placeholder: "Silver" },
              { key: "licensePlate", label: "License Plate", placeholder: "ABC-1234" },
              { key: "vin", label: "VIN (optional)", placeholder: "1HGCM82633A004352" },
              { key: "mileage", label: "Current Mileage", placeholder: "45000", type: "number" },
            ].map(({ key, label, placeholder, type }) => (
              <div key={key}>
                <label className="block text-sm font-medium mb-1" style={{ color: "var(--color-silver)" }}>{label}</label>
                <input type={type ?? "text"} value={(form as any)[key]} onChange={(e) => setForm(f => ({ ...f, [key]: e.target.value }))} placeholder={placeholder}
                  className="w-full px-3 py-2.5 rounded-lg text-sm outline-none" style={{ backgroundColor: "var(--color-surface2)", border: "1px solid var(--color-border)", color: "var(--color-white)" }} />
              </div>
            ))}
          </div>
          <button onClick={submit} disabled={loading || !form.make || !form.model || !form.year} className="mt-4 px-6 py-2.5 rounded-lg text-sm font-semibold text-white disabled:opacity-60" style={{ backgroundColor: "var(--color-red)" }}>
            {loading ? "Adding..." : "Add Vehicle"}
          </button>
        </motion.div>
      )}

      {vehicles.length === 0 ? (
        <EmptyState icon={Car} title="No Vehicles Yet" desc="Add your first vehicle to get started" />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {vehicles.map((v: any, i: number) => (
            <motion.div key={v.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="glass rounded-xl p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: "rgba(59,130,246,0.15)" }}>
                  <Car size={18} style={{ color: "#3b82f6" }} />
                </div>
                <span className="text-xs px-2 py-1 rounded-full" style={{ backgroundColor: "var(--color-surface2)", color: "var(--color-muted)" }}>{v.year}</span>
              </div>
              <h4 className="font-bold text-lg" style={{ fontFamily: "Rajdhani" }}>{v.year} {v.make} {v.model}</h4>
              <div className="mt-2 space-y-1">
                {v.licensePlate && <p className="text-xs" style={{ color: "var(--color-muted)" }}>Plate: <span style={{ color: "var(--color-silver)" }}>{v.licensePlate}</span></p>}
                {v.color && <p className="text-xs" style={{ color: "var(--color-muted)" }}>Color: <span style={{ color: "var(--color-silver)" }}>{v.color}</span></p>}
                {v.mileage > 0 && <p className="text-xs" style={{ color: "var(--color-muted)" }}>Mileage: <span style={{ color: "var(--color-silver)" }}>{v.mileage.toLocaleString()} mi</span></p>}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Appointments Tab ───────────────────────────────────────────────────────────
function AppointmentsTab({ appointments }: { appointments: any[] }) {
  const active = appointments.filter(a => a.status !== "completed" && a.status !== "cancelled");
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold" style={{ fontFamily: "Rajdhani" }}>Appointments</h3>
        <Link to="/book"><button className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white" style={{ backgroundColor: "var(--color-red)" }}><Calendar size={15} /> Book New</button></Link>
      </div>
      {active.length === 0 ? (
        <EmptyState icon={Calendar} title="No Upcoming Appointments" desc="Book a service to get started" action={<Link to="/book"><button className="mt-3 px-5 py-2.5 rounded-lg text-sm font-semibold text-white" style={{ backgroundColor: "var(--color-red)" }}>Book Now</button></Link>} />
      ) : (
        <div className="space-y-3">
          {active.map((a: any, i: number) => (
            <motion.div key={a.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
              className="glass rounded-xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: "rgba(224,32,32,0.12)" }}>
                  <Wrench size={17} style={{ color: "var(--color-red)" }} />
                </div>
                <div>
                  <p className="font-medium text-sm">{a.serviceType === "home-service" ? "Home Service" : "In-Shop Service"}</p>
                  <p className="text-xs" style={{ color: "var(--color-muted)" }}>{new Date(a.scheduledAt).toLocaleString()}</p>
                  {a.notes && <p className="text-xs mt-0.5" style={{ color: "var(--color-muted)" }}>{a.notes}</p>}
                </div>
              </div>
              <span className={`text-xs px-2.5 py-1 rounded-full status-${a.status}`}>{a.status}</span>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── History Tab ────────────────────────────────────────────────────────────────
function HistoryTab() {
  return (
    <div className="space-y-4">
      <h3 className="text-xl font-bold" style={{ fontFamily: "Rajdhani" }}>Service History</h3>
      <EmptyState icon={Clock} title="No Service History" desc="Your completed services will appear here" />
    </div>
  );
}

// ── Invoices Tab ───────────────────────────────────────────────────────────────
function InvoicesTab({ invoices }: { invoices: any[] }) {
  return (
    <div className="space-y-4">
      <h3 className="text-xl font-bold" style={{ fontFamily: "Rajdhani" }}>Invoices</h3>
      {invoices.length === 0 ? (
        <EmptyState icon={FileText} title="No Invoices" desc="Your invoices will appear here" />
      ) : (
        <div className="space-y-3">
          {invoices.map((inv: any) => (
            <div key={inv.id} className="glass rounded-xl p-4 flex items-center justify-between">
              <div>
                <p className="font-semibold text-sm">{inv.invoiceNumber}</p>
                <p className="text-xs" style={{ color: "var(--color-muted)" }}>{new Date(inv.createdAt).toLocaleDateString()}</p>
              </div>
              <div className="text-right">
                <p className="font-bold" style={{ fontFamily: "Rajdhani" }}>${inv.total.toFixed(2)}</p>
                <span className={`text-xs px-2 py-0.5 rounded-full status-${inv.status}`}>{inv.status}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Payments Tab ───────────────────────────────────────────────────────────────
function PaymentsTab({ payments }: { payments: any[] }) {
  return (
    <div className="space-y-4">
      <h3 className="text-xl font-bold" style={{ fontFamily: "Rajdhani" }}>Payment History</h3>
      {payments.length === 0 ? (
        <EmptyState icon={CreditCard} title="No Payments" desc="Your payment history will appear here" />
      ) : (
        <div className="space-y-3">
          {payments.map((p: any) => (
            <div key={p.id} className="glass rounded-xl p-4 flex items-center justify-between">
              <div>
                <p className="font-medium text-sm capitalize">{p.method} · {p.type}</p>
                <p className="text-xs" style={{ color: "var(--color-muted)" }}>{new Date(p.createdAt).toLocaleDateString()}</p>
              </div>
              <div className="text-right">
                <p className="font-bold" style={{ fontFamily: "Rajdhani" }}>${p.amount.toFixed(2)}</p>
                <span className={`text-xs px-2 py-0.5 rounded-full status-${p.status}`}>{p.status}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Reminders Tab ──────────────────────────────────────────────────────────────
function RemindersTab({ vehicles }: { vehicles: any[] }) {
  return (
    <div className="space-y-4">
      <h3 className="text-xl font-bold" style={{ fontFamily: "Rajdhani" }}>Oil Change Reminders</h3>
      {vehicles.length === 0 ? (
        <EmptyState icon={AlertCircle} title="No Vehicles" desc="Add a vehicle first to set up reminders" />
      ) : (
        <div className="space-y-3">
          {vehicles.map((v: any) => (
            <div key={v.id} className="glass rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold">{v.year} {v.make} {v.model}</h4>
                <AlertCircle size={18} style={{ color: "var(--color-warning)" }} />
              </div>
              <p className="text-sm" style={{ color: "var(--color-muted)" }}>
                {v.mileage > 0 ? `Current mileage: ${v.mileage.toLocaleString()} mi` : "Add mileage to enable reminders"}
              </p>
              <div className="mt-3 p-3 rounded-lg" style={{ backgroundColor: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.2)" }}>
                <p className="text-xs" style={{ color: "var(--color-warning)" }}>Typical oil change interval: every 5,000–7,500 miles</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Notifications Tab ──────────────────────────────────────────────────────────
function NotificationsTab({ notifications, onRefresh }: { notifications: any[]; onRefresh: () => void }) {
  const markRead = async (id: number) => {
    await fetch(`/api/customer/notifications/${id}/read`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${localStorage.getItem("bearer_token")}` },
    });
    onRefresh();
  };

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-bold" style={{ fontFamily: "Rajdhani" }}>Notifications</h3>
      {notifications.length === 0 ? (
        <EmptyState icon={Bell} title="No Notifications" desc="You're all caught up!" />
      ) : (
        <div className="space-y-2">
          {notifications.map((n: any) => (
            <div key={n.id} onClick={() => !n.isRead && markRead(n.id)} className="glass rounded-xl p-4 cursor-pointer transition-all" style={{ opacity: n.isRead ? 0.7 : 1 }}>
              <div className="flex items-start gap-3">
                {!n.isRead && <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ backgroundColor: "var(--color-red)" }} />}
                <div className="flex-1">
                  <p className="text-sm font-medium">{n.title}</p>
                  <p className="text-sm mt-0.5" style={{ color: "var(--color-muted)" }}>{n.message}</p>
                  <p className="text-xs mt-1" style={{ color: "var(--color-muted)" }}>{new Date(n.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Profile Tab ────────────────────────────────────────────────────────────────
function ProfileTab({ session, onRefresh }: { session: any; onRefresh: () => void }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(session?.user?.name ?? "");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);

  const save = async () => {
    setLoading(true);
    await fetch("/api/customer/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("bearer_token")}` },
      body: JSON.stringify({ name, phone, address }),
    });
    setLoading(false);
    setEditing(false);
    onRefresh();
  };

  return (
    <div className="space-y-6 max-w-xl">
      <h3 className="text-xl font-bold" style={{ fontFamily: "Rajdhani" }}>My Profile</h3>

      <div className="glass rounded-xl p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-20 h-20 rounded-full flex items-center justify-center text-3xl font-bold" style={{ backgroundColor: "rgba(224,32,32,0.15)", color: "var(--color-red)" }}>
            {session?.user?.name?.[0]?.toUpperCase() ?? "?"}
          </div>
          <div>
            <h4 className="text-xl font-bold" style={{ fontFamily: "Rajdhani" }}>{session?.user?.name}</h4>
            <p className="text-sm" style={{ color: "var(--color-muted)" }}>{session?.user?.email}</p>
            <span className="text-xs px-2 py-0.5 rounded-full mt-1 inline-block" style={{ backgroundColor: "rgba(224,32,32,0.15)", color: "var(--color-red)" }}>Customer</span>
          </div>
        </div>

        {editing ? (
          <div className="space-y-4">
            <Field label="Full Name" value={name} onChange={setName} placeholder="John Smith" />
            <Field label="Phone Number" value={phone} onChange={setPhone} placeholder="+1 (555) 000-0000" type="tel" />
            <Field label="Address" value={address} onChange={setAddress} placeholder="123 Main St, City, State" />
            <div className="flex gap-3">
              <button onClick={save} disabled={loading} className="px-5 py-2.5 rounded-lg text-sm font-semibold text-white disabled:opacity-60" style={{ backgroundColor: "var(--color-red)" }}>
                {loading ? "Saving..." : "Save Changes"}
              </button>
              <button onClick={() => setEditing(false)} className="px-5 py-2.5 rounded-lg text-sm font-semibold border" style={{ borderColor: "var(--color-border)", color: "var(--color-silver)" }}>Cancel</button>
            </div>
          </div>
        ) : (
          <button onClick={() => setEditing(true)} className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold border" style={{ borderColor: "var(--color-border)", color: "var(--color-silver)" }}>
            <User size={15} /> Edit Profile
          </button>
        )}
      </div>

      <div className="glass rounded-xl p-4">
        <div className="flex items-center gap-3">
          <Shield size={20} style={{ color: "var(--color-success)" }} />
          <div>
            <p className="font-medium text-sm">Account Security</p>
            <p className="text-xs" style={{ color: "var(--color-muted)" }}>Bcrypt-encrypted passwords · JWT sessions · Rate limiting enabled</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, placeholder, type = "text" }: { label: string; value: string; onChange: (v: string) => void; placeholder: string; type?: string }) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--color-silver)" }}>{label}</label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="w-full px-4 py-3 rounded-lg text-sm outline-none"
        style={{ backgroundColor: "var(--color-surface2)", border: "1px solid var(--color-border)", color: "var(--color-white)" }} onFocus={(e) => (e.target.style.borderColor = "var(--color-red)")} onBlur={(e) => (e.target.style.borderColor = "var(--color-border)")} />
    </div>
  );
}

// ── Support Tab ────────────────────────────────────────────────────────────────
function SupportTab({ session }: { session: any }) {
  const [messages, setMessages] = useState<{ role: "user" | "support"; text: string }[]>([
    { role: "support", text: "Hello! Welcome to LIBrepair customer support. How can I help you today?" }
  ]);
  const [input, setInput] = useState("");

  const send = () => {
    if (!input.trim()) return;
    const msg = input.trim();
    setMessages(prev => [...prev, { role: "user", text: msg }]);
    setInput("");
    setTimeout(() => {
      setMessages(prev => [...prev, {
        role: "support",
        text: "Thanks for reaching out! A support agent will respond shortly. For urgent matters, please call our shop directly.",
      }]);
    }, 1000);
  };

  return (
    <div className="space-y-4 max-w-2xl">
      <h3 className="text-xl font-bold" style={{ fontFamily: "Rajdhani" }}>Customer Support</h3>
      <div className="glass rounded-xl overflow-hidden flex flex-col" style={{ height: "500px" }}>
        <div className="px-4 py-3 border-b flex items-center gap-3" style={{ borderColor: "var(--color-border)" }}>
          <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: "rgba(224,32,32,0.15)" }}>
            <MessageCircle size={16} style={{ color: "var(--color-red)" }} />
          </div>
          <div>
            <p className="text-sm font-semibold">LIBrepair Support</p>
            <p className="text-xs" style={{ color: "var(--color-success)" }}>● Online</p>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className="max-w-xs px-4 py-2.5 rounded-2xl text-sm" style={{
                backgroundColor: m.role === "user" ? "var(--color-red)" : "var(--color-surface2)",
                color: "var(--color-white)",
                borderRadius: m.role === "user" ? "20px 20px 4px 20px" : "20px 20px 20px 4px",
              }}>
                {m.text}
              </div>
            </div>
          ))}
        </div>
        <div className="p-3 border-t flex gap-2" style={{ borderColor: "var(--color-border)" }}>
          <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()} placeholder="Type a message..."
            className="flex-1 px-4 py-2.5 rounded-xl text-sm outline-none" style={{ backgroundColor: "var(--color-surface2)", border: "1px solid var(--color-border)", color: "var(--color-white)" }} />
          <button onClick={send} className="px-4 py-2.5 rounded-xl text-sm font-semibold text-white" style={{ backgroundColor: "var(--color-red)" }}>Send</button>
        </div>
      </div>
    </div>
  );
}

// ── Empty State ────────────────────────────────────────────────────────────────
function EmptyState({ icon: Icon, title, desc, action }: { icon: any; title: string; desc: string; action?: React.ReactNode }) {
  return (
    <div className="glass rounded-xl py-16 flex flex-col items-center justify-center text-center">
      <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4" style={{ backgroundColor: "var(--color-surface2)" }}>
        <Icon size={24} style={{ color: "var(--color-muted)" }} />
      </div>
      <h4 className="font-semibold mb-1">{title}</h4>
      <p className="text-sm" style={{ color: "var(--color-muted)" }}>{desc}</p>
      {action}
    </div>
  );
}
