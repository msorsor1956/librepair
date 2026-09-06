import { useEffect, useState } from "react";
import { api } from "../lib/api";

type Account = { id: string; name: string; email: string; phone?: string | null; approvalStatus: "pending" | "rejected"; approvalNotes?: string | null };

export default function ApprovalsPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const load = () => api.get("/admin/approvals").then((result) => setAccounts(result.accounts ?? [])).catch((reason) => setError(reason.message));

  useEffect(() => { void load(); }, []);

  async function decide(account: Account, status: "approved" | "rejected") {
    const notes = status === "rejected" ? window.prompt("Optional rejection reason:") ?? "" : "";
    setBusy(account.id);
    setError("");
    try {
      await api.patch(`/admin/approvals/${account.id}`, { status, notes });
      await load();
    } catch (reason: any) {
      setError(reason.message ?? "Unable to update account");
    } finally {
      setBusy(null);
    }
  }

  return <div style={{ padding: 28 }}>
    <h1 style={{ fontFamily: "Rajdhani", fontSize: 28 }}>Account Approvals</h1>
    <p style={{ color: "#777", marginTop: 4, marginBottom: 24 }}>Review registrations before they can access protected LIBrepair features.</p>
    {error && <div style={{ color: "#f87171", marginBottom: 16 }}>{error}</div>}
    {!accounts.length ? <div style={{ color: "#777" }}>No pending or rejected accounts.</div> : <div style={{ display: "grid", gap: 12 }}>
      {accounts.map((account) => <div key={account.id} style={{ display: "flex", gap: 16, alignItems: "center", padding: 18, border: "1px solid #292929", borderRadius: 10, background: "#111" }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700 }}>{account.name}</div>
          <div style={{ color: "#888", fontSize: 13 }}>{account.email}{account.phone ? ` · ${account.phone}` : ""}</div>
          <div style={{ color: account.approvalStatus === "pending" ? "#f59e0b" : "#f87171", fontSize: 12, textTransform: "uppercase", marginTop: 5 }}>{account.approvalStatus}</div>
          {account.approvalNotes && <div style={{ color: "#777", fontSize: 12, marginTop: 4 }}>{account.approvalNotes}</div>}
        </div>
        <button className="btn btn-ghost" disabled={busy === account.id} onClick={() => void decide(account, "rejected")}>Reject</button>
        <button className="btn btn-red" disabled={busy === account.id} onClick={() => void decide(account, "approved")}>Approve</button>
      </div>)}
    </div>}
  </div>;
}
