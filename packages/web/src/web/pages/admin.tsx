import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Link, useLocation } from "wouter";
import { DashboardLayout } from "../components/dashboard-layout";
import { authClient } from "../lib/auth";
import { api } from "../lib/api";
import { Users, Calendar, Wrench, TrendingUp, Clock, CheckCircle, XCircle, AlertCircle } from "lucide-react";

function StatCard({
  icon,
  label,
  value,
  sub,
  color,
  delay,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  sub?: string;
  color: string;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      style={{
        background: "var(--color-surface)",
        border: "1px solid var(--color-border)",
        borderRadius: 12,
        padding: "1.5rem",
        display: "flex",
        flexDirection: "column",
        gap: "0.75rem",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 10,
            background: color,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {icon}
        </div>
      </div>
      <div>
        <div
          style={{
            fontFamily: "Rajdhani, sans-serif",
            fontSize: "2rem",
            fontWeight: 700,
            color: "var(--color-primary)",
            lineHeight: 1,
          }}
        >
          {value}
        </div>
        <div style={{ fontSize: "0.875rem", color: "var(--color-muted)", marginTop: "0.25rem" }}>{label}</div>
        {sub && (
          <div style={{ fontSize: "0.75rem", color: "var(--color-accent)", marginTop: "0.25rem" }}>{sub}</div>
        )}
      </div>
    </motion.div>
  );
}

export default function AdminPage() {
  const [, navigate] = useLocation();

  const { data: session } = useQuery({
    queryKey: ["session"],
    queryFn: () => authClient.getSession(),
  });

  const user = (session as any)?.data?.user;

  // Redirect if not admin
  if (session !== undefined && (user as any)?.role !== "admin") {
    navigate("/dashboard");
    return null;
  }

  const { data: usersData } = useQuery({
    queryKey: ["admin-users"],
    queryFn: () => api.users.$get().then((r) => r.json()) as Promise<{ users: any[] }>,
    enabled: !!(user as any)?.role === true,
  });

  const { data: appointmentsData } = useQuery({
    queryKey: ["admin-appointments"],
    queryFn: () => api.appointments.$get().then((r) => r.json()) as Promise<{ appointments: any[] }>,
  });

  const appointments = (appointmentsData as any)?.appointments || [];
  const users = (usersData as any)?.users || [];

  const pending = appointments.filter((a: any) => a.status === "pending").length;
  const confirmed = appointments.filter((a: any) => a.status === "confirmed").length;
  const completed = appointments.filter((a: any) => a.status === "completed").length;
  const cancelled = appointments.filter((a: any) => a.status === "cancelled").length;

  const recentAppointments = [...appointments]
    .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 8);

  const statusColor: Record<string, string> = {
    pending: "#f59e0b",
    confirmed: "#3b82f6",
    completed: "#22c55e",
    cancelled: "#ef4444",
    "in-progress": "#8b5cf6",
  };

  const statusIcon: Record<string, React.ReactNode> = {
    pending: <Clock size={14} />,
    confirmed: <CheckCircle size={14} />,
    completed: <CheckCircle size={14} />,
    cancelled: <XCircle size={14} />,
    "in-progress": <AlertCircle size={14} />,
  };

  return (
    <DashboardLayout>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <div style={{ marginBottom: "2rem" }}>
          <h1
            style={{
              fontFamily: "Rajdhani, sans-serif",
              fontSize: "2rem",
              fontWeight: 700,
              color: "var(--color-primary)",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              marginBottom: "0.25rem",
            }}
          >
            Admin Dashboard
          </h1>
          <p style={{ color: "var(--color-muted)" }}>Business overview & management</p>
        </div>

        {/* Stats Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "1rem",
            marginBottom: "2rem",
          }}
        >
          <StatCard
            icon={<Users size={20} color="#fff" />}
            label="Total Users"
            value={users.length}
            color="rgba(224,32,32,0.2)"
            delay={0}
          />
          <StatCard
            icon={<Calendar size={20} color="#fff" />}
            label="Total Appointments"
            value={appointments.length}
            color="rgba(59,130,246,0.2)"
            delay={0.05}
          />
          <StatCard
            icon={<Clock size={20} color="#f59e0b" />}
            label="Pending"
            value={pending}
            color="rgba(245,158,11,0.15)"
            delay={0.1}
          />
          <StatCard
            icon={<CheckCircle size={20} color="#22c55e" />}
            label="Completed"
            value={completed}
            color="rgba(34,197,94,0.15)"
            delay={0.15}
          />
        </div>

        {/* Appointment Status Breakdown */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "1.5rem",
            marginBottom: "2rem",
          }}
        >
          {/* Status Bars */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            style={{
              background: "var(--color-surface)",
              border: "1px solid var(--color-border)",
              borderRadius: 12,
              padding: "1.5rem",
            }}
          >
            <h3
              style={{
                fontFamily: "Rajdhani, sans-serif",
                fontWeight: 700,
                fontSize: "1.1rem",
                color: "var(--color-primary)",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                marginBottom: "1.25rem",
              }}
            >
              Appointment Status
            </h3>
            {[
              { label: "Pending", count: pending, color: "#f59e0b" },
              { label: "Confirmed", count: confirmed, color: "#3b82f6" },
              { label: "Completed", count: completed, color: "#22c55e" },
              { label: "Cancelled", count: cancelled, color: "#ef4444" },
            ].map((item) => (
              <div key={item.label} style={{ marginBottom: "0.875rem" }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: "0.25rem",
                    fontSize: "0.875rem",
                    color: "var(--color-secondary)",
                  }}
                >
                  <span>{item.label}</span>
                  <span style={{ color: item.color, fontWeight: 600 }}>{item.count}</span>
                </div>
                <div
                  style={{
                    height: 6,
                    background: "var(--color-border)",
                    borderRadius: 3,
                    overflow: "hidden",
                  }}
                >
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{
                      width: appointments.length
                        ? `${(item.count / appointments.length) * 100}%`
                        : "0%",
                    }}
                    transition={{ duration: 0.8, delay: 0.3 }}
                    style={{
                      height: "100%",
                      background: item.color,
                      borderRadius: 3,
                    }}
                  />
                </div>
              </div>
            ))}
          </motion.div>

          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            style={{
              background: "var(--color-surface)",
              border: "1px solid var(--color-border)",
              borderRadius: 12,
              padding: "1.5rem",
            }}
          >
            <h3
              style={{
                fontFamily: "Rajdhani, sans-serif",
                fontWeight: 700,
                fontSize: "1.1rem",
                color: "var(--color-primary)",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                marginBottom: "1.25rem",
              }}
            >
              Quick Actions
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {[
                { label: "View All Appointments", href: "/dashboard/appointments", icon: <Calendar size={16} /> },
                { label: "Manage Vehicles", href: "/dashboard/vehicles", icon: <Wrench size={16} /> },
                { label: "Seed Services", action: "seed", icon: <TrendingUp size={16} /> },
              ].map((item) =>
                item.href ? (
                  <Link key={item.label} href={item.href}>
                    <motion.div
                      whileHover={{ x: 4 }}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.75rem",
                        padding: "0.75rem 1rem",
                        background: "var(--color-bg)",
                        border: "1px solid var(--color-border)",
                        borderRadius: 8,
                        cursor: "pointer",
                        color: "var(--color-secondary)",
                        fontSize: "0.875rem",
                        fontWeight: 500,
                        textDecoration: "none",
                      }}
                    >
                      <span style={{ color: "var(--color-accent)" }}>{item.icon}</span>
                      {item.label}
                    </motion.div>
                  </Link>
                ) : (
                  <motion.button
                    key={item.label}
                    whileHover={{ x: 4 }}
                    onClick={() =>
                      fetch("/api/services/seed", { method: "POST" }).then(() => alert("Services seeded!"))
                    }
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.75rem",
                      padding: "0.75rem 1rem",
                      background: "var(--color-bg)",
                      border: "1px solid var(--color-border)",
                      borderRadius: 8,
                      cursor: "pointer",
                      color: "var(--color-secondary)",
                      fontSize: "0.875rem",
                      fontWeight: 500,
                      textAlign: "left",
                    }}
                  >
                    <span style={{ color: "var(--color-accent)" }}>{item.icon}</span>
                    {item.label}
                  </motion.button>
                )
              )}
            </div>
          </motion.div>
        </div>

        {/* Recent Appointments Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          style={{
            background: "var(--color-surface)",
            border: "1px solid var(--color-border)",
            borderRadius: 12,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              padding: "1.25rem 1.5rem",
              borderBottom: "1px solid var(--color-border)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <h3
              style={{
                fontFamily: "Rajdhani, sans-serif",
                fontWeight: 700,
                fontSize: "1.1rem",
                color: "var(--color-primary)",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              Recent Appointments
            </h3>
            <Link href="/dashboard/appointments" style={{ color: "var(--color-accent)", fontSize: "0.875rem" }}>
              View all →
            </Link>
          </div>
          {recentAppointments.length === 0 ? (
            <div style={{ padding: "3rem", textAlign: "center", color: "var(--color-muted)" }}>
              No appointments yet
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--color-border)" }}>
                    {["Date", "Type", "Status", "Total"].map((h) => (
                      <th
                        key={h}
                        style={{
                          padding: "0.75rem 1.5rem",
                          textAlign: "left",
                          fontSize: "0.75rem",
                          fontWeight: 600,
                          color: "var(--color-muted)",
                          textTransform: "uppercase",
                          letterSpacing: "0.05em",
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {recentAppointments.map((appt: any, i: number) => (
                    <motion.tr
                      key={appt.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.35 + i * 0.03 }}
                      style={{ borderBottom: "1px solid var(--color-border)" }}
                    >
                      <td style={{ padding: "0.875rem 1.5rem", color: "var(--color-secondary)", fontSize: "0.875rem" }}>
                        {new Date(appt.scheduledAt || appt.createdAt).toLocaleDateString()}
                      </td>
                      <td style={{ padding: "0.875rem 1.5rem", color: "var(--color-secondary)", fontSize: "0.875rem", textTransform: "capitalize" }}>
                        {appt.serviceType || "—"}
                      </td>
                      <td style={{ padding: "0.875rem 1.5rem" }}>
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "0.375rem",
                            padding: "0.25rem 0.75rem",
                            borderRadius: 99,
                            fontSize: "0.75rem",
                            fontWeight: 600,
                            background: `${statusColor[appt.status] || "#888"}22`,
                            color: statusColor[appt.status] || "#888",
                          }}
                        >
                          {statusIcon[appt.status]}
                          {appt.status}
                        </span>
                      </td>
                      <td style={{ padding: "0.875rem 1.5rem", color: "var(--color-accent)", fontSize: "0.875rem", fontWeight: 600 }}>
                        ${appt.totalCost || "—"}
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>
      </motion.div>
    </DashboardLayout>
  );
}
