import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Link } from "wouter";
import { api } from "../lib/api";
import { DashboardLayout } from "../components/dashboard-layout";
import { authClient } from "../lib/auth";
import { Car, Calendar, Bell, Wrench, ArrowRight, Clock, CheckCircle, AlertCircle } from "lucide-react";

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`text-xs px-2.5 py-1 rounded-full font-medium status-${status}`}>
      {status.replace("-", " ").replace(/\b\w/g, (c) => c.toUpperCase())}
    </span>
  );
}

export default function DashboardPage() {
  const { data: session } = authClient.useSession();
  const vehicles = useQuery({ queryKey: ["vehicles"], queryFn: async () => (await api.vehicles.$get()).json() });
  const appointments = useQuery({ queryKey: ["appointments"], queryFn: async () => (await api.appointments.$get()).json() });
  const notifications = useQuery({ queryKey: ["notifications"], queryFn: async () => (await api.notifications.$get()).json() });

  const stats = [
    {
      label: "My Vehicles",
      value: vehicles.isLoading ? "—" : String(vehicles.data?.length ?? 0),
      icon: <Car size={20} />,
      color: "var(--color-red)",
      href: "/dashboard/vehicles",
    },
    {
      label: "Appointments",
      value: appointments.isLoading ? "—" : String(appointments.data?.length ?? 0),
      icon: <Calendar size={20} />,
      color: "#3b82f6",
      href: "/dashboard/appointments",
    },
    {
      label: "Unread Alerts",
      value: notifications.isLoading ? "—" : String(notifications.data?.filter((n: any) => !n.isRead)?.length ?? 0),
      icon: <Bell size={20} />,
      color: "#f59e0b",
      href: "/dashboard/notifications",
    },
  ];

  const recentAppointments = appointments.data?.slice(0, 5) ?? [];

  return (
    <DashboardLayout title="Dashboard">
      <div className="max-w-5xl">
        {/* Welcome */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h2 className="text-3xl font-bold mb-1" style={{ fontFamily: "Rajdhani" }}>
            Welcome back, {session?.user?.name?.split(" ")[0]} 👋
          </h2>
          <p className="text-sm" style={{ color: "var(--color-muted)" }}>Here's what's happening with your vehicles.</p>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="glass rounded-xl p-5"
            >
              <Link to={stat.href}>
                <div className="cursor-pointer">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm" style={{ color: "var(--color-muted)" }}>{stat.label}</span>
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${stat.color}20`, color: stat.color }}>
                      {stat.icon}
                    </div>
                  </div>
                  <div className="text-3xl font-bold" style={{ fontFamily: "Rajdhani", color: stat.color }}>{stat.value}</div>
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
              { label: "Home Service", icon: <Wrench size={20} />, href: "/book?type=home", color: "#3b82f6" },
              { label: "Add Vehicle", icon: <Car size={20} />, href: "/dashboard/vehicles", color: "#22c55e" },
              { label: "View History", icon: <Clock size={20} />, href: "/dashboard/appointments", color: "#f59e0b" },
            ].map((action) => (
              <Link key={action.label} to={action.href}>
                <div className="glass rounded-xl p-4 text-center cursor-pointer hover:bg-white/5 transition-all group">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center mx-auto mb-2 transition-all" style={{ backgroundColor: `${action.color}20`, color: action.color }}>
                    {action.icon}
                  </div>
                  <div className="text-xs font-medium" style={{ color: "var(--color-silver)" }}>{action.label}</div>
                </div>
              </Link>
            ))}
          </div>
        </motion.div>

        {/* Recent Appointments */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold" style={{ fontFamily: "Rajdhani" }}>Recent Appointments</h3>
            <Link to="/dashboard/appointments">
              <button className="flex items-center gap-1 text-sm hover:underline" style={{ color: "var(--color-red)" }}>
                View all <ArrowRight size={14} />
              </button>
            </Link>
          </div>
          <div className="glass rounded-xl overflow-hidden">
            {appointments.isLoading ? (
              <div className="p-8 text-center">
                <div className="w-8 h-8 border-2 rounded-full animate-spin mx-auto" style={{ borderColor: "var(--color-border)", borderTopColor: "var(--color-red)" }} />
              </div>
            ) : recentAppointments.length === 0 ? (
              <div className="p-10 text-center">
                <Calendar size={36} className="mx-auto mb-3 opacity-30" />
                <p className="text-sm font-medium mb-1">No appointments yet</p>
                <p className="text-xs mb-4" style={{ color: "var(--color-muted)" }}>Book your first service to get started</p>
                <Link to="/book">
                  <button className="px-5 py-2 rounded-lg text-sm font-semibold text-white" style={{ backgroundColor: "var(--color-red)" }}>
                    Book Service
                  </button>
                </Link>
              </div>
            ) : (
              <div className="divide-y" style={{ borderColor: "var(--color-border)" }}>
                {recentAppointments.map((apt: any) => (
                  <div key={apt.id} className="flex items-center justify-between p-4 hover:bg-white/3 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: "rgba(224,32,32,0.1)", color: "var(--color-red)" }}>
                        <Wrench size={16} />
                      </div>
                      <div>
                        <div className="text-sm font-medium">Service #{apt.id}</div>
                        <div className="text-xs" style={{ color: "var(--color-muted)" }}>
                          {new Date(apt.scheduledAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        </div>
                      </div>
                    </div>
                    <StatusBadge status={apt.status} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}
