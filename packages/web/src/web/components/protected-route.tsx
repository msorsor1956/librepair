import { Redirect } from "wouter";
import { authClient } from "../lib/auth";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { data: session, isPending } = authClient.useSession();

  if (isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "var(--color-bg)" }}>
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-2 rounded-full animate-spin" style={{ borderColor: "var(--color-border)", borderTopColor: "var(--color-red)" }} />
          <p className="text-sm" style={{ color: "var(--color-muted)" }}>Loading...</p>
        </div>
      </div>
    );
  }
  if (!session) return <Redirect to="/welcome" />;
  if (session.user.approvalStatus !== "approved" && session.user.role !== "admin") {
    const rejected = session.user.approvalStatus === "rejected";
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: "var(--color-bg)" }}>
        <div className="glass rounded-2xl p-8 text-center max-w-lg">
          <h1 className="text-2xl font-bold mb-3">{rejected ? "Account request rejected" : "Approval pending"}</h1>
          <p style={{ color: "var(--color-muted)" }}>{rejected ? (session.user.approvalNotes || "Contact LIBrepair support if you believe this is an error.") : "An administrator must approve your account before you can access customer or staff features."}</p>
          <button className="btn btn-red mt-6" onClick={() => void authClient.signOut()}>Sign out</button>
        </div>
      </div>
    );
  }
  return <>{children}</>;
}
