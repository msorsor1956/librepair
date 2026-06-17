import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import { FileText, Plus, Search, RefreshCw, Edit2, Trash2, X, AlertCircle } from "lucide-react";

type Invoice = {
  id: number;
  invoiceNumber: string;
  subtotal: number;
  tax: number;
  total: number;
  status: string;
  dueDate?: string;
  paidAt?: string;
  notes?: string;
  createdAt?: string;
  appointmentId?: number;
  customerId?: string;
  customerName?: string;
  customerEmail?: string;
};

type User = { id: string; name: string; email: string };

const statusColors: Record<string, { bg: string; color: string; border: string }> = {
  draft:   { bg: "rgba(255,255,255,0.06)", color: "#888", border: "rgba(255,255,255,0.1)" },
  sent:    { bg: "rgba(59,130,246,0.12)", color: "#60a5fa", border: "rgba(59,130,246,0.25)" },
  paid:    { bg: "rgba(34,197,94,0.12)", color: "#4ade80", border: "rgba(34,197,94,0.25)" },
  overdue: { bg: "rgba(239,68,68,0.12)", color: "#f87171", border: "rgba(239,68,68,0.25)" },
};

export default function InvoicesPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showCreate, setShowCreate] = useState(false);
  const [editTarget, setEditTarget] = useState<Invoice | null>(null);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["invoices"],
    queryFn: () => api.get("/superadmin/invoices"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/superadmin/invoices/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["invoices"] }),
  });

  const invoices: Invoice[] = data?.invoices ?? [];
  const filtered = invoices.filter(inv => {
    const matchStatus = statusFilter === "all" || inv.status === statusFilter;
    const q = search.toLowerCase();
    const matchSearch = !search ||
      (inv.customerName ?? "").toLowerCase().includes(q) ||
      inv.invoiceNumber.toLowerCase().includes(q);
    return matchStatus && matchSearch;
  });

  const totalPaid = invoices.filter(i => i.status === "paid").reduce((s, i) => s + i.total, 0);
  const totalOverdue = invoices.filter(i => i.status === "overdue").reduce((s, i) => s + i.total, 0);
  const totalPending = invoices.filter(i => i.status === "sent").reduce((s, i) => s + i.total, 0);

  return (
    <div style={{ padding: 32 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontFamily: "Rajdhani, sans-serif", fontSize: 24, fontWeight: 700 }}>Invoices</h1>
          <p style={{ color: "#555", fontSize: 13 }}>{invoices.length} total · ${totalPaid.toFixed(2)} collected</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn btn-ghost" onClick={() => refetch()} style={{ padding: "8px 14px" }}><RefreshCw size={14} /></button>
          <button className="btn btn-red" onClick={() => setShowCreate(true)}><Plus size={14} /> New Invoice</button>
        </div>
      </div>

      {/* Summary */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 12, marginBottom: 24 }}>
        {[
          { label: "Paid", value: `$${totalPaid.toFixed(2)}`, color: "#4ade80" },
          { label: "Pending (Sent)", value: `$${totalPending.toFixed(2)}`, color: "#60a5fa" },
          { label: "Overdue", value: `$${totalOverdue.toFixed(2)}`, color: "#f87171" },
          { label: "Draft", value: String(invoices.filter(i => i.status === "draft").length), color: "#888" },
        ].map(stat => (
          <div key={stat.label} style={{ background: "#111", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 10, padding: "14px 16px" }}>
            <div style={{ fontSize: 11, color: "#555", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>{stat.label}</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: stat.color }}>{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 4, marginBottom: 16, flexWrap: "wrap" }}>
        {["all", "draft", "sent", "paid", "overdue"].map(s => (
          <button key={s} onClick={() => setStatusFilter(s)} style={{
            padding: "6px 14px", fontSize: 12, fontWeight: 500, cursor: "pointer",
            background: statusFilter === s ? "rgba(224,32,32,0.1)" : "rgba(255,255,255,0.04)",
            border: `1px solid ${statusFilter === s ? "rgba(224,32,32,0.3)" : "rgba(255,255,255,0.07)"}`,
            borderRadius: 8, color: statusFilter === s ? "#e02020" : "#666",
          }}>
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      <div style={{ position: "relative", marginBottom: 16, maxWidth: 380 }}>
        <Search size={13} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#555" }} />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by customer or invoice #..." style={{ paddingLeft: 34 }} />
      </div>

      <div style={{ background: "#111", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, overflow: "hidden" }}>
        {isLoading ? (
          <div style={{ padding: 48, textAlign: "center", color: "#555" }}>Loading...</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 48, textAlign: "center", color: "#444" }}>No invoices found.</div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table>
              <thead>
                <tr>
                  <th>Invoice #</th>
                  <th>Customer</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Due Date</th>
                  <th>Paid At</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(inv => {
                  const sc = statusColors[inv.status] ?? statusColors.draft;
                  return (
                    <tr key={inv.id}>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <div style={{ width: 30, height: 30, borderRadius: 7, background: "rgba(255,255,255,0.05)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                            <FileText size={13} color="#888" />
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, color: "#e5e5e5", fontSize: 13 }}>{inv.invoiceNumber}</div>
                            {inv.appointmentId && <div style={{ fontSize: 11, color: "#444" }}>Apt #{inv.appointmentId}</div>}
                          </div>
                        </div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 500, color: "#e5e5e5", fontSize: 13 }}>{inv.customerName ?? "—"}</div>
                        <div style={{ fontSize: 11, color: "#555" }}>{inv.customerEmail ?? ""}</div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 700, color: "#4ade80", fontSize: 14 }}>${inv.total.toFixed(2)}</div>
                        {inv.tax > 0 && <div style={{ fontSize: 11, color: "#444" }}>+${inv.tax.toFixed(2)} tax</div>}
                      </td>
                      <td>
                        <span style={{ padding: "3px 9px", borderRadius: 6, fontSize: 11, fontWeight: 600, background: sc.bg, color: sc.color, border: `1px solid ${sc.border}` }}>
                          {inv.status.charAt(0).toUpperCase() + inv.status.slice(1)}
                        </span>
                      </td>
                      <td style={{ color: "#aaa", fontSize: 13 }}>
                        {inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : "—"}
                      </td>
                      <td style={{ color: "#aaa", fontSize: 13 }}>
                        {inv.paidAt ? new Date(inv.paidAt).toLocaleDateString() : "—"}
                      </td>
                      <td>
                        <div style={{ display: "flex", gap: 6 }}>
                          <button className="btn btn-ghost" onClick={() => setEditTarget(inv)} style={{ padding: "5px 10px", fontSize: 11 }}>
                            <Edit2 size={11} /> Edit
                          </button>
                          <button
                            className="btn btn-ghost"
                            onClick={() => { if (confirm("Delete this invoice?")) deleteMutation.mutate(inv.id); }}
                            style={{ padding: "5px 10px", fontSize: 11, color: "#e02020", borderColor: "rgba(224,32,32,0.2)" }}
                          >
                            <Trash2 size={11} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showCreate && (
        <InvoiceModal onClose={() => setShowCreate(false)} onSaved={() => { qc.invalidateQueries({ queryKey: ["invoices"] }); setShowCreate(false); }} />
      )}
      {editTarget && (
        <InvoiceModal invoice={editTarget} onClose={() => setEditTarget(null)} onSaved={() => { qc.invalidateQueries({ queryKey: ["invoices"] }); setEditTarget(null); }} />
      )}
    </div>
  );
}

function InvoiceModal({ invoice, onClose, onSaved }: { invoice?: Invoice; onClose: () => void; onSaved: () => void }) {
  const isEdit = !!invoice;
  const [form, setForm] = useState({
    customerId: invoice?.customerId ?? "",
    appointmentId: String(invoice?.appointmentId ?? ""),
    subtotal: String(invoice?.subtotal ?? ""),
    tax: String(invoice?.tax ?? "0"),
    total: String(invoice?.total ?? ""),
    status: invoice?.status ?? "draft",
    dueDate: invoice?.dueDate ? new Date(invoice.dueDate).toISOString().split("T")[0] : "",
    paidAt: invoice?.paidAt ? new Date(invoice.paidAt).toISOString().split("T")[0] : "",
    notes: invoice?.notes ?? "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [userSearch, setUserSearch] = useState("");
  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

  const { data: usersData } = useQuery({ queryKey: ["users"], queryFn: () => api.get("/superadmin/users") });
  const users: User[] = usersData?.users ?? [];
  const selectedUser = users.find(u => u.id === form.customerId);
  const filteredUsers = users.filter(u =>
    !userSearch || u.name.toLowerCase().includes(userSearch.toLowerCase()) || u.email.toLowerCase().includes(userSearch.toLowerCase())
  );

  // Auto-calc total from subtotal + tax
  function recalc(sub: string, tx: string) {
    const s = parseFloat(sub) || 0;
    const t = parseFloat(tx) || 0;
    set("total", (s + t).toFixed(2));
  }

  async function handleSubmit() {
    if (!isEdit && !form.customerId) { setError("Select a customer"); return; }
    if (!form.subtotal || !form.total) { setError("Subtotal and total are required"); return; }
    setError(""); setLoading(true);
    try {
      if (isEdit) {
        await api.patch(`/superadmin/invoices/${invoice!.id}`, {
          subtotal: Number(form.subtotal), tax: Number(form.tax), total: Number(form.total),
          status: form.status,
          dueDate: form.dueDate || null,
          paidAt: form.paidAt || null,
          notes: form.notes || null,
        });
      } else {
        await api.post("/superadmin/invoices", {
          customerId: form.customerId,
          appointmentId: form.appointmentId ? Number(form.appointmentId) : undefined,
          subtotal: Number(form.subtotal), tax: Number(form.tax), total: Number(form.total),
          status: form.status,
          dueDate: form.dueDate || null,
          notes: form.notes || null,
        });
      }
      onSaved();
    } catch (e: any) { setError(e.message ?? "Failed"); }
    finally { setLoading(false); }
  }

  return (
    <div className="modal-overlay">
      <div className="modal" style={{ maxWidth: 500 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <h2 style={{ fontFamily: "Rajdhani", fontSize: 20, fontWeight: 700 }}>{isEdit ? "Edit Invoice" : "New Invoice"}</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#555", cursor: "pointer" }}><X size={18} /></button>
        </div>
        {error && <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", background: "rgba(224,32,32,0.08)", border: "1px solid rgba(224,32,32,0.2)", borderRadius: 8, color: "#f87171", fontSize: 13, marginBottom: 16 }}><AlertCircle size={14} />{error}</div>}

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {!isEdit && (
            <div className="form-group">
              <label className="form-label">Customer *</label>
              {selectedUser ? (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", background: "rgba(224,32,32,0.06)", border: "1px solid rgba(224,32,32,0.2)", borderRadius: 8 }}>
                  <div>
                    <div style={{ fontWeight: 500, fontSize: 14 }}>{selectedUser.name}</div>
                    <div style={{ fontSize: 12, color: "#555" }}>{selectedUser.email}</div>
                  </div>
                  <button onClick={() => set("customerId", "")} style={{ background: "none", border: "none", color: "#555", cursor: "pointer" }}><X size={14} /></button>
                </div>
              ) : (
                <>
                  <input value={userSearch} onChange={e => setUserSearch(e.target.value)} placeholder="Search customer..." style={{ marginBottom: 6 }} />
                  <div style={{ maxHeight: 150, overflowY: "auto", background: "#0d0d0d", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 8 }}>
                    {filteredUsers.slice(0, 6).map(u => (
                      <div key={u.id} onClick={() => { set("customerId", u.id); setUserSearch(""); }}
                        style={{ padding: "8px 14px", cursor: "pointer", borderBottom: "1px solid rgba(255,255,255,0.04)" }}
                        onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.04)")}
                        onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                        <div style={{ fontSize: 13, fontWeight: 500 }}>{u.name}</div>
                        <div style={{ fontSize: 11, color: "#555" }}>{u.email}</div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {!isEdit && (
            <div className="form-group">
              <label className="form-label">Linked Appointment ID (optional)</label>
              <input type="number" value={form.appointmentId} onChange={e => set("appointmentId", e.target.value)} placeholder="123" />
            </div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
            <div className="form-group">
              <label className="form-label">Subtotal ($) *</label>
              <input type="number" value={form.subtotal} onChange={e => { set("subtotal", e.target.value); recalc(e.target.value, form.tax); }} placeholder="0.00" min="0" step="0.01" />
            </div>
            <div className="form-group">
              <label className="form-label">Tax ($)</label>
              <input type="number" value={form.tax} onChange={e => { set("tax", e.target.value); recalc(form.subtotal, e.target.value); }} placeholder="0.00" min="0" step="0.01" />
            </div>
            <div className="form-group">
              <label className="form-label">Total ($) *</label>
              <input type="number" value={form.total} onChange={e => set("total", e.target.value)} placeholder="0.00" min="0" step="0.01" />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div className="form-group">
              <label className="form-label">Status</label>
              <select value={form.status} onChange={e => set("status", e.target.value)}>
                <option value="draft">Draft</option>
                <option value="sent">Sent</option>
                <option value="paid">Paid</option>
                <option value="overdue">Overdue</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Due Date</label>
              <input type="date" value={form.dueDate} onChange={e => set("dueDate", e.target.value)} />
            </div>
          </div>

          {isEdit && form.status === "paid" && (
            <div className="form-group">
              <label className="form-label">Paid At</label>
              <input type="date" value={form.paidAt} onChange={e => set("paidAt", e.target.value)} />
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Notes</label>
            <textarea value={form.notes} onChange={e => set("notes", e.target.value)} rows={2} placeholder="Invoice notes..." />
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, marginTop: 24, justifyContent: "flex-end" }}>
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-red" disabled={loading} onClick={handleSubmit} style={{ minWidth: 120, justifyContent: "center" }}>
            {loading ? "Saving..." : isEdit ? "Save Changes" : "Create Invoice"}
          </button>
        </div>
      </div>
    </div>
  );
}
