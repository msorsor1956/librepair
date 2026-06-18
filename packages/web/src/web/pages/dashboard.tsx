import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Link } from "wouter";
import { api } from "../lib/api";
import { DashboardLayout } from "../components/dashboard-layout";
import { authClient } from "../lib/auth";
import { Car, Calendar, Bell, Wrench, ArrowRight, Clock, CheckCircle, CreditCard, TrendingUp } from "lucide-react";

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    pending: "#f59e0b", confirmed: "#3b82f6", "in-progress": "#8b5cf6",
    completed: "#22c55e", cancelled: "#ef4444",
    paid: "#22c55e", failed: "#ef4444", refunded: "#f59e0b",
  };
  const bg = colors[status] ? `${colors[status]}22` : "#88888822";
  const color = colors[status] ?? "#888";
  return (
    <span className="text-xs px-2.5 py-1 rounded-full font-medium" style={{ backgroundColor: bg, color }}>
      {status.replace("-", " ").replace(/\b\w/g, c => c.toUpperCase())}
    </span>
  );
}

export default function DashboardPage() {
  const { data: session } = authClient.useSession();
  const vehicles = useQuery({ queryKey: ["vehicles"], queryFn: async () => (await api.vehicles.$get()).json() });
  const appointments = useQuery({ queryKey: ["appointments"], queryFn: async () => (await api.appointments.$get()).json() });
  const payments = useQuery({ queryKey: ["payments"], queryFn: async () => (await api.payments.$get()).json() });
  const notifications = useQuery({ queryKey: ["notifications"], queryFn: async () => { const res = await api.notifications.$get(); const d = await res.json() as any; return Array.isArray(d) ? d : (d.notifications ?? []); } });

  const aptList: any[] = Array.isArray(appointments.data) ? appointments.data : [];
  const payList: any[] = Array.isArray(payments.data) ? payments.data : [];
  const notifList: any[] = Array.isArray(notifications.data) ? notifications.data : (notifications.data ?? []);
  const vehicleList: any[] = Array.isArray(vehicles.data) ? vehicles.data : [];

  const activeApts = aptList.filter(a => ["pending", "confirmed", "in-progress"].includes(a.status));
  const totalPaid = payList.filter(p => p.status === "paid").reduce((sum, p) => sum + p.amount, 0);
  const pendingPayments = payList.filter(p => p.status === "pending").length;

  const stats = [
    { label: "My Vehicles", value: vehicleList.length, icon: <Car size={20} />, color: "var(--color-red)", href: "/dashboard/vehicles" },
    { label: "Active Services", value: activeApts.length, icon: <Wrench size={20} />, color: "#8b5cf6", href: "/dashboard/appointments" },
    { label: "Total Paid", value: `$${totalPaid.toFixed(0)}`, icon: <CreditCard size={20} />, color: "#22c55e", href: "/dashboard/payments" },
    { label: "Unread Alerts", value: notifList.filter(n => !n.isRead).length, icon: <Bell size={20} />, color: "#f59e0b", href: "/dashboard/notifications" },
  ];

  return (
    <DashboardLayout title="Dashboard">
      <div className="max-w-5xl">
        {/* Welcome */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h2 className="text-3xl font-bold mb-1" style={{ fontFamily: "Rajdhani" }}>
            Welcome back, {session?.user?.name?.split(" ")[0]} 👋
          </h2>
          <p className="text-sm" style={{ color: "var(--color-muted)" }}>Track your vehicles, services, and payments all in one place.</p>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {stats.map((stat, i) => (
            <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }} className="glass rounded-xl p-5">
              <Link to={stat.href}>
                <div className="cursor-pointer">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs" style={{ color: "var(--color-muted)" }}>{stat.label}</span>
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${stat.color}20`, color: stat.color }}>{stat.icon}</div>
                  </div>
                  <div className="text-2xl font-bold" style={{ fontFamily: "Rajdhani", color: stat.color }}>{stat.value}</div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Quick Actions */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="mb-8">
          <h3 className="text-lg font-bold mb-4" style={{ fontFamily: "Rajdhani" }}>Quick Actions</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Book Service", icon: <Calendar size={20} />, href: "/book", color: "var(--color-red)" },
              { label: "Home Service", icon: <MapPin size={20} />, href: "/book?type=home", color: "#3b82f6" },
              { label: "Add Vehicle", icon: <Car size={20} />, href: "/dashboard/vehicles", color: "#22c55e" },
              { label: "My Payments", icon: <CreditCard size={20} />, href: "/dashboard/payments", color: "#f59e0b" },
            ].map(action => (
              <Link key={action.label} to={action.href}>
                <div className="glass rounded-xl p-4 text-center cursor-pointer hover:bg-white/5 transition-all">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center mx-auto mb-2" style={{ backgroundColor: `${action.color}20`, color: action.color }}>{action.icon}</div>
                  <div className="text-xs font-medium" style={{ color: "var(--color-silver)" }}>{action.label}</div>
                </div>
              </Link>
            ))}
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Active Services Progress */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold" style={{ fontFamily: "Rajdhani" }}>Active Services</h3>
              <Link to="/dashboard/appointments"><button className="flex items-center gap-1 text-sm" style={{ color: "var(--color-red)" }}>View all <ArrowRight size={14} /></button></Link>
            </div>
            <div className="glass rounded-xl overflow-hidden">
              {appointments.isLoading ? (
                <div className="p-8 text-center"><div className="w-6 h-6 border-2 rounded-full animate-spin mx-auto" style={{ borderColor: "var(--color-border)", borderTopColor: "var(--color-red)" }} /></div>
              ) : activeApts.length === 0 ? (
                <div className="p-8 text-center">
                  <Wrench size={32} className="mx-auto mb-2 opacity-20" />
                  <p className="text-sm mb-3" style={{ color: "var(--color-muted)" }}>No active services</p>
                  <Link to="/book"><button className="px-4 py-2 rounded-lg text-sm font-semibold text-white" style={{ backgroundColor: "var(--color-red)" }}>Book Now</button></Link>
                </div>
              ) : (
                <div className="divide-y" style={{ borderColor: "var(--color-border)" }}>
                  {activeApts.slice(0, 4).map((apt: any) => (
                    <Link key={apt.id} to={`/dashboard/appointments/${apt.id}`}>
                      <div className="flex items-center justify-between p-4 hover:bg-white/3 transition-colors cursor-pointer">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: "rgba(224,32,32,0.1)", color: "var(--color-red)" }}><Wrench size={15} /></div>
                          <div>
                            <div className="text-sm font-medium">{apt.serviceName ?? `Service #${apt.id}`}</div>
                            <div className="text-xs" style={{ color: "var(--color-muted)" }}>
                              {apt.vehicleMake} {apt.vehicleModel} · {new Date(apt.scheduledAt).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                        <StatusBadge status={apt.status} />
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </motion.div>

          {/* Payment Summary */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold" style={{ fontFamily: "Rajdhani" }}>Recent Payments</h3>
              <Link to="/dashboard/payments"><button className="flex items-center gap-1 text-sm" style={{ color: "var(--color-red)" }}>View all <ArrowRight size={14} /></button></Link>
            </div>
            <div className="glass rounded-xl overflow-hidden">
              {payments.isLoading ? (
                <div className="p-8 text-center"><div className="w-6 h-6 border-2 rounded-full animate-spin mx-auto" style={{ borderColor: "var(--color-border)", borderTopColor: "var(--color-red)" }} /></div>
              ) : payList.length === 0 ? (
                <div className="p-8 text-center">
                  <CreditCard size={32} className="mx-auto mb-2 opacity-20" />
                  <p className="text-sm" style={{ color: "var(--color-muted)" }}>No payments yet</p>
                </div>
              ) : (
                <div className="divide-y" style={{ borderColor: "var(--color-border)" }}>
                  {payList.slice(0, 4).map((p: any) => (
                    <div key={p.id} className="flex items-center justify-between p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: "rgba(34,197,94,0.1)", color: "#22c55e" }}><CreditCard size={15} /></div>
                        <div>
                          <div className="text-sm font-medium">{p.serviceName ?? `Appointment #${p.appointmentId}`}</div>
                          <div className="text-xs" style={{ color: "var(--color-muted)" }}>{p.method} · {new Date(p.createdAt).toLocaleDateString()}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold" style={{ fontFamily: "Rajdhani", color: "#22c55e" }}>${p.amount}</div>
                        <StatusBadge status={p.status} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </DashboardLayout>
  );
}

function MapPin({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
    </svg>
  );
}
