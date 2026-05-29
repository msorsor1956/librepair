import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Link } from "wouter";
import { api } from "../lib/api";
import { DashboardLayout } from "../components/dashboard-layout";
import { Calendar, Plus, Wrench, Clock, MapPin } from "lucide-react";

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`text-xs px-2.5 py-1 rounded-full font-medium status-${status}`}>
      {status.replace("-", " ").replace(/\b\w/g, (c) => c.toUpperCase())}
    </span>
  );
}

export default function AppointmentsPage() {
  const appointments = useQuery({
    queryKey: ["appointments"],
    queryFn: async () => (await api.appointments.$get()).json(),
  });

  const list = appointments.data?.appointments ?? [];

  return (
    <DashboardLayout title="Appointments">
      <div className="max-w-4xl">
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm" style={{ color: "var(--color-muted)" }}>All your service appointments in one place</p>
          <Link to="/book">
            <button className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold text-white" style={{ backgroundColor: "var(--color-red)" }}>
              <Plus size={16} /> Book Service
            </button>
          </Link>
        </div>

        {appointments.isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <div key={i} className="glass rounded-xl h-20 animate-pulse" />)}
          </div>
        ) : list.length === 0 ? (
          <div className="glass rounded-xl p-14 text-center">
            <Calendar size={48} className="mx-auto mb-4 opacity-20" />
            <h3 className="text-xl font-bold mb-2" style={{ fontFamily: "Rajdhani" }}>No appointments yet</h3>
            <p className="text-sm mb-5" style={{ color: "var(--color-muted)" }}>Book your first service to get started</p>
            <Link to="/book">
              <button className="px-6 py-2.5 rounded-lg text-sm font-semibold text-white" style={{ backgroundColor: "var(--color-red)" }}>Book Service</button>
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {list.map((apt: any, i: number) => (
              <motion.div key={apt.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                className="glass rounded-xl p-5 flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: "rgba(224,32,32,0.1)", color: "var(--color-red)" }}>
                    <Wrench size={18} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold">Appointment #{apt.id}</span>
                      <StatusBadge status={apt.status} />
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="flex items-center gap-1 text-xs" style={{ color: "var(--color-muted)" }}>
                        <Clock size={11} />
                        {new Date(apt.scheduledAt).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" })}
                      </span>
                      <span className="flex items-center gap-1 text-xs" style={{ color: "var(--color-muted)" }}>
                        <MapPin size={11} />
                        {apt.serviceType === "home-service" ? "Home Service" : "In-Shop"}
                      </span>
                    </div>
                  </div>
                </div>
                {apt.bookingFee && (
                  <div className="text-right shrink-0">
                    <div className="text-sm font-bold" style={{ color: "var(--color-red)", fontFamily: "Rajdhani" }}>${apt.bookingFee}</div>
                    <div className="text-xs" style={{ color: "var(--color-muted)" }}>booking fee</div>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
