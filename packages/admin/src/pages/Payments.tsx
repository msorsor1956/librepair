import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import { Plus, Search, X, Pencil, Trash2 } from "lucide-react";

type Payment = {
  id: number; customerId: string; customerName?: string; customerEmail?: string;
  amount: number; method: string; status: string; type: string;
  transactionId?: string; notes?: string; createdAt?: string;
  serviceName?: string; appointmentStatus?: string;
};

const statusBadge: Record<string, string> = {
  paid: "badge-green", pending: "badge-yellow", failed: "badge-red", refunded: "badge-blue",
};

export default function PaymentsPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showAdd, setShowAdd] = useState(false);
  const [editPayment, setEditPayment] = useState<Payment | null>(null);

  const { data: usersData } = useQuery({ queryKey: ["users"], queryFn: () => api.get("/superadmin/users") });
  const { data, isLoading } = useQuery({ queryKey: ["payments"], queryFn: () => api.get("/superadmin/payments") });

  const addMutation = useMutation({
    mutationFn: (body: any) => api.post("/superadmin/payments", body),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["payments"] }); setShowAdd(false); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, ...body }: any) => api.patch(`/superadmin/payments/${id}`, body),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["payments"] }); setEditPayment(null); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/superadmin/payments/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["payments"] }),
  });

  const payments: Payment[] = data?.payments ?? [];
  const filtered = payments.filter(p => {
    const matchSearch = !search || (p.customerName ?? "").toLowerCase().includes(search.toLowerCase()) || (p.customerEmail ?? "").toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || p.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const total = filtered.filter(p => p.status === "paid").reduce((sum, p) => sum + p.amount, 0);

  return (
    <div style={{ padding: 32 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontFamily: "Rajdhani, sans-serif", fontSize: 24, fontWeight: 700 }}>Payments</h1>
          <p style={{ color: "#555", fontSize: 13 }}>{payments.length} transactions · ${total.toFixed(2)} collected (filtered)</p>
        </div>
        <button className="btn btn-red" onClick={() => setShowAdd(true)}>
          <Plus size={14} /> Add Payment
        </button>
      </div>

      <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
        <div style={{ position: "relative", flex: 1, minWidth: 220 }}>
          <Search size={13} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#555" }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search customer..." style={{ paddingLeft: 34 }} />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ width: "auto" }}>
          <option value="all">All Status</option>
          <option value="paid">Paid</option>
          <option value="pending">Pending</option>
          <option value="failed">Failed</option>
          <option value="refunded">Refunded</option>
        </select>
      </div>

      <div style={{ background: "#111", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, overflow: "hidden" }}>
        {isLoading ? <div style={{ padding: 40, textAlign: "center", color: "#555" }}>Loading...</div> : (
          <div style={{ overflowX: "auto" }}>
            <table>
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Amount</th>
                  <th>Method</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Service</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(p => (
                  <tr key={p.id}>
                    <td>
                      <div style={{ color: "#e5e5e5", fontWeight: 500 }}>{p.customerName ?? "—"}</div>
                      <div style={{ color: "#555", fontSize: 12 }}>{p.customerEmail}</div>
                    </td>
                    <td style={{ color: "#e5e5e5", fontWeight: 600 }}>${p.amount.toFixed(2)}</td>
                    <td style={{ textTransform: "capitalize" }}>{p.method}</td>
                    <td style={{ textTransform: "capitalize" }}>{p.type}</td>
                    <td><span className={`badge ${statusBadge[p.status] ?? "badge-gray"}`}>{p.status}</span></td>
                    <td>{p.serviceName ?? "—"}</td>
                    <td style={{ whiteSpace: "nowrap" }}>
                      {p.createdAt ? new Date(p.createdAt).toLocaleDateString() : "—"}
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button className="btn btn-ghost" style={{ padding: "4px 10px" }} onClick={() => setEditPayment(p)}>
                          <Pencil size={12} />
                        </button>
                        <button className="btn btn-danger" style={{ padding: "4px 10px" }}
                          onClick={() => { if (confirm("Delete this payment?")) deleteMutation.mutate(p.id); }}>
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={8} style={{ textAlign: "center", color: "#444", padding: 32 }}>No payments found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showAdd && (
        <PaymentModal users={usersData?.users ?? []} onClose={() => setShowAdd(false)} onSave={addMutation.mutate} loading={addMutation.isPending} />
      )}
      {editPayment && (
        <PaymentModal
          payment={editPayment}
          users={usersData?.users ?? []}
          onClose={() => setEditPayment(null)}
          onSave={(d: any) => updateMutation.mutate({ id: editPayment.id, ...d })}
          loading={updateMutation.isPending}
        />
      )}
    </div>
  );
}

function PaymentModal({ payment, users, onClose, onSave, loading }: {
  payment?: Payment; users: any[]; onClose: () => void; onSave: (d: any) => void; loading: boolean;
}) {
  const [form, setForm] = useState({
    customerId: payment?.customerId ?? "",
    amount: payment?.amount?.toString() ?? "",
    method: payment?.method ?? "cash",
    status: payment?.status ?? "pending",
    type: payment?.type ?? "full",
    transactionId: payment?.transactionId ?? "",
    notes: payment?.notes ?? "",
  });
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <h2 style={{ fontFamily: "Rajdhani", fontSize: 20, fontWeight: 700 }}>{payment ? "Edit Payment" : "Add Payment"}</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#555" }}><X size={18} /></button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          {!payment && (
            <div className="form-group" style={{ gridColumn: "1 / -1" }}>
              <label className="form-label">Customer *</label>
              <select value={form.customerId} onChange={e => set("customerId", e.target.value)} required>
                <option value="">Select customer...</option>
                {users.filter(u => u.role === "customer").map((u: any) => (
                  <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                ))}
              </select>
            </div>
          )}
          <div className="form-group">
            <label className="form-label">Amount *</label>
            <input value={form.amount} onChange={e => set("amount", e.target.value)} placeholder="0.00" type="number" step="0.01" required />
          </div>
          <div className="form-group">
            <label className="form-label">Method</label>
            <select value={form.method} onChange={e => set("method", e.target.value)}>
              <option value="cash">Cash</option>
              <option value="stripe">Stripe</option>
              <option value="zelle">Zelle</option>
              <option value="cashapp">Cash App</option>
              <option value="paypal">PayPal</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Status</label>
            <select value={form.status} onChange={e => set("status", e.target.value)}>
              <option value="pending">Pending</option>
              <option value="paid">Paid</option>
              <option value="failed">Failed</option>
              <option value="refunded">Refunded</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Type</label>
            <select value={form.type} onChange={e => set("type", e.target.value)}>
              <option value="full">Full</option>
              <option value="booking_fee">Booking Fee</option>
              <option value="deposit">Deposit</option>
              <option value="invoice">Invoice</option>
            </select>
          </div>
          <div className="form-group" style={{ gridColumn: "1 / -1" }}>
            <label className="form-label">Transaction ID</label>
            <input value={form.transactionId} onChange={e => set("transactionId", e.target.value)} placeholder="Optional" />
          </div>
          <div className="form-group" style={{ gridColumn: "1 / -1" }}>
            <label className="form-label">Notes</label>
            <textarea value={form.notes} onChange={e => set("notes", e.target.value)} rows={3} placeholder="Internal notes..." />
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, marginTop: 20, justifyContent: "flex-end" }}>
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-red" disabled={loading} onClick={() => onSave(form)}>
            {loading ? "Saving..." : (payment ? "Save Changes" : "Add Payment")}
          </button>
        </div>
      </div>
    </div>
  );
}
