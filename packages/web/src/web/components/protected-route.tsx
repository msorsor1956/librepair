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
  if (!session) return <Redirect to="/sign-in" />;
  return <>{children}</>;
}
