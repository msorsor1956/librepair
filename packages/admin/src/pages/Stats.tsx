import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";
import { Users, Car, CreditCard, CalendarCheck, TrendingUp, Bell, Package, Megaphone } from "lucide-react";

export default function StatsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["stats"],
    queryFn: () => api.get("/superadmin/stats"),
    refetchInterval: 30_000,
  });

  const s = data;

  const cards = [
    { label: "Total Users", value: s?.users?.total ?? "—", sub: `${s?.users?.customers ?? 0} customers`, icon: Users, color: "#3b82f6" },
    { label: "Appointments", value: s?.appointments?.total ?? "—", sub: `${s?.appointments?.pending ?? 0} pending`, icon: CalendarCheck, color: "#e02020" },
    { label: "Total Revenue", value: s ? `$${s.revenue?.total?.toFixed(2)}` : "—", sub: `$${s?.revenue?.pending?.toFixed(2) ?? "0.00"} pending`, icon: TrendingUp, color: "#22c55e" },
    { label: "Inventory", value: s?.inventory?.total ?? "—", sub: `${s?.inventory?.available ?? 0} available`, icon: Car, color: "#f59e0b" },
    { label: "Mechanics", value: s?.users?.mechanics ?? "—", sub: "on platform", icon: Package, color: "#8b5cf6" },
    { label: "Payments", value: s?.revenue?.payments ?? "—", sub: "total transactions", icon: CreditCard, color: "#06b6d4" },
    { label: "Notifications", value: "Live", sub: "broadcast ready", icon: Bell, color: "#f97316" },
    { label: "Announcements", value: s?.announcements?.active ?? "—", sub: "active banners", icon: Megaphone, color: "#e02020" },
  ];

  if (isLoading) return (
    <div style={{ padding: 40, color: "#555", textAlign: "center" }}>Loading stats...</div>
  );

  return (
    <div style={{ padding: 32 }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontFamily: "Rajdhani, sans-serif", fontSize: 26, fontWeight: 700, marginBottom: 4 }}>Dashboard</h1>
        <p style={{ color: "#555", fontSize: 13 }}>Platform overview — real-time data</p>
      </div>

      {/* Stat grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 16, marginBottom: 32 }}>
        {cards.map(card => (
          <div key={card.label} className="stat-card" style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
            <div style={{
              width: 44, height: 44, borderRadius: 10, flexShrink: 0,
              background: `${card.color}18`, border: `1px solid ${card.color}30`,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <card.icon size={20} color={card.color} />
            </div>
            <div>
              <div style={{ fontSize: 22, fontWeight: 700, fontFamily: "Rajdhani", lineHeight: 1.1 }}>{card.value}</div>
              <div style={{ fontSize: 12, color: "#aaa", marginTop: 2 }}>{card.label}</div>
              <div style={{ fontSize: 11, color: "#555", marginTop: 1 }}>{card.sub}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Role breakdown */}
      {s?.users && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div className="stat-card">
            <div style={{ fontSize: 13, fontWeight: 600, color: "#aaa", marginBottom: 16, textTransform: "uppercase", letterSpacing: "0.06em" }}>User Roles</div>
            {[
              { label: "Customers", val: s.users.customers, color: "#3b82f6" },
              { label: "Mechanics", val: s.users.mechanics, color: "#8b5cf6" },
              { label: "Admins", val: s.users.admins, color: "#e02020" },
              { label: "Dispatchers", val: s.users.dispatchers, color: "#f59e0b" },
            ].map(r => (
              <div key={r.label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: r.color }} />
                  <span style={{ color: "#888", fontSize: 13 }}>{r.label}</span>
                </div>
                <span style={{ fontWeight: 600, color: "#e5e5e5", fontSize: 13 }}>{r.val}</span>
              </div>
            ))}
          </div>

          <div className="stat-card">
            <div style={{ fontSize: 13, fontWeight: 600, color: "#aaa", marginBottom: 16, textTransform: "uppercase", letterSpacing: "0.06em" }}>Appointments</div>
            {[
              { label: "Pending", val: s.appointments.pending, color: "#f59e0b" },
              { label: "Confirmed", val: s.appointments.confirmed, color: "#3b82f6" },
              { label: "In Progress", val: s.appointments.inProgress, color: "#8b5cf6" },
              { label: "Completed", val: s.appointments.completed, color: "#22c55e" },
              { label: "Cancelled", val: s.appointments.cancelled, color: "#555" },
            ].map(r => (
              <div key={r.label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: r.color }} />
                  <span style={{ color: "#888", fontSize: 13 }}>{r.label}</span>
                </div>
                <span style={{ fontWeight: 600, color: "#e5e5e5", fontSize: 13 }}>{r.val}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
