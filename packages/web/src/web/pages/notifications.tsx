import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { api } from "../lib/api";
import { DashboardLayout } from "../components/dashboard-layout";
import { Bell, Calendar, CreditCard, Wrench, Info, Tag, Check } from "lucide-react";

const typeIcons: Record<string, React.ReactNode> = {
  appointment: <Calendar size={16} />,
  payment: <CreditCard size={16} />,
  reminder: <Wrench size={16} />,
  system: <Info size={16} />,
  promotion: <Tag size={16} />,
};

export default function NotificationsPage() {
  const qc = useQueryClient();
  const notifs = useQuery({ queryKey: ["notifications"], queryFn: async () => (await api.notifications.$get()).json() });

  const markRead = useMutation({
    mutationFn: async (id: number) => (await api.notifications[":id"].read.$put({ param: { id: String(id) } })).json(),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const list = notifs.data?.notifications ?? [];

  return (
    <DashboardLayout title="Notifications">
      <div className="max-w-2xl">
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm" style={{ color: "var(--color-muted)" }}>{list.filter((n: any) => !n.isRead).length} unread notifications</p>
        </div>

        {notifs.isLoading ? (
          <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="glass rounded-xl h-16 animate-pulse" />)}</div>
        ) : list.length === 0 ? (
          <div className="glass rounded-xl p-14 text-center">
            <Bell size={48} className="mx-auto mb-4 opacity-20" />
            <h3 className="text-xl font-bold mb-2" style={{ fontFamily: "Rajdhani" }}>All clear!</h3>
            <p className="text-sm" style={{ color: "var(--color-muted)" }}>No notifications yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {list.map((n: any, i: number) => (
              <motion.div
                key={n.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="glass rounded-xl p-4 flex items-start gap-3"
                style={{ opacity: n.isRead ? 0.6 : 1 }}
              >
                <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5" style={{ backgroundColor: "rgba(224,32,32,0.1)", color: "var(--color-red)" }}>
                  {typeIcons[n.type] ?? <Bell size={16} />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="text-sm font-semibold">{n.title}</div>
                    <div className="text-xs shrink-0" style={{ color: "var(--color-muted)" }}>
                      {new Date(n.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="text-xs mt-0.5" style={{ color: "var(--color-silver)" }}>{n.message}</div>
                </div>
                {!n.isRead && (
                  <button onClick={() => markRead.mutate(n.id)} className="shrink-0 p-1.5 rounded-lg hover:bg-white/5" style={{ color: "var(--color-muted)" }}>
                    <Check size={14} />
                  </button>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
