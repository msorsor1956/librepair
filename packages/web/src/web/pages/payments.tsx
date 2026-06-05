import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Link } from "wouter";
import { api } from "../lib/api";
import { DashboardLayout } from "../components/dashboard-layout";
import { CreditCard, Clock, CheckCircle, XCircle, AlertCircle, DollarSign, Wrench } from "lucide-react";

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; color: string; bg: string; Icon: any }> = {
    paid:      { label: "Paid",      color: "#22c55e", bg: "rgba(34,197,94,0.12)",   Icon: CheckCircle },
    pending:   { label: "Pending",   color: "#f59e0b", bg: "rgba(245,158,11,0.12)",  Icon: Clock },
    overdue:   { label: "Overdue",   color: "#ef4444", bg: "rgba(239,68,68,0.12)",   Icon: AlertCircle },
    refunded:  { label: "Refunded",  color: "#8b5cf6", bg: "rgba(139,92,246,0.12)",  Icon: XCircle },
  };
  const s = map[status] ?? { label: status, color: "var(--color-muted)", bg: "rgba(255,255,255,0.05)", Icon: CreditCard };
  return (
    <span className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-semibold"
      style={{ color: s.color, backgroundColor: s.bg }}>
      <s.Icon size={11} />
      {s.label}
    </span>
  );
}

const METHOD_LABELS: Record<string, string> = {
  cash: "Cash",
  zelle: "Zelle",
  cashapp: "Cash App",
  paypal: "PayPal",
  stripe: "Card",
};

export default function PaymentsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["my-payments"],
    queryFn: async () => {
      const r = await fetch("/api/payments/mine");
      return r.json() as Promise<{ payments: any[] }>;
    },
  });

  const payments = data?.payments ?? [];

  const total   = payments.reduce((s: number, p: any) => s + Number(p.amount ?? 0), 0);
  const paid    = payments.filter((p: any) => p.status === "paid").reduce((s: number, p: any) => s + Number(p.amount ?? 0), 0);
  const pending = payments.filter((p: any) => p.status === "pending").reduce((s: number, p: any) => s + Number(p.amount ?? 0), 0);

  return (
    <DashboardLayout title="Payments">
      <div className="max-w-4xl space-y-6">
        {/* Summary cards */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Total Billed", value: `$${total.toFixed(2)}`, color: "rgba(224,32,32,0.15)", textColor: "var(--color-red)" },
            { label: "Amount Paid",  value: `$${paid.toFixed(2)}`,  color: "rgba(34,197,94,0.12)", textColor: "#22c55e" },
            { label: "Outstanding",  value: `$${pending.toFixed(2)}`, color: "rgba(245,158,11,0.12)", textColor: "#f59e0b" },
          ].map((c, i) => (
            <motion.div key={c.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
              className="glass rounded-xl p-5">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-3" style={{ backgroundColor: c.color }}>
                <DollarSign size={18} style={{ color: c.textColor }} />
              </div>
              <div className="text-2xl font-bold" style={{ fontFamily: "Rajdhani", color: c.textColor }}>{c.value}</div>
              <div className="text-xs mt-0.5" style={{ color: "var(--color-muted)" }}>{c.label}</div>
            </motion.div>
          ))}
        </div>

        {/* Payment list */}
        <div>
          <h2 className="text-sm font-semibold mb-3" style={{ color: "var(--color-muted)" }}>Payment History</h2>

          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => <div key={i} className="glass rounded-xl h-20 animate-pulse" />)}
            </div>
          ) : payments.length === 0 ? (
            <div className="glass rounded-xl p-14 text-center">
              <CreditCard size={48} className="mx-auto mb-4 opacity-20" />
              <h3 className="text-xl font-bold mb-2" style={{ fontFamily: "Rajdhani" }}>No payments yet</h3>
              <p className="text-sm mb-5" style={{ color: "var(--color-muted)" }}>Your payment history will appear here after booking</p>
              <Link to="/book">
                <button className="px-6 py-2.5 rounded-lg text-sm font-semibold text-white" style={{ backgroundColor: "var(--color-red)" }}>
                  Book a Service
                </button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {payments.map((p: any, i: number) => (
                <motion.div key={p.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                  className="glass rounded-xl p-5 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                      style={{ backgroundColor: "rgba(224,32,32,0.1)", color: "var(--color-red)" }}>
                      <CreditCard size={18} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-sm font-semibold">
                          {p.description ?? "Service Payment"}
                        </span>
                        <StatusBadge status={p.status} />
                      </div>
                      <div className="flex items-center gap-3 text-xs" style={{ color: "var(--color-muted)" }}>
                        {p.appointmentId && (
                          <span className="flex items-center gap-1">
                            <Wrench size={11} />
                            Appt #{p.appointmentId}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Clock size={11} />
                          {new Date(p.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        </span>
                        <span className="capitalize">{METHOD_LABELS[p.method] ?? p.method}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-lg font-bold" style={{ fontFamily: "Rajdhani", color: "var(--color-primary)" }}>
                      ${Number(p.amount).toFixed(2)}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
