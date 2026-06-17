import { useState } from "react";
import { signIn } from "../lib/auth";
import type { AdminUser } from "../App";
import { Lock, Mail, AlertCircle } from "lucide-react";

export default function LoginPage({ onLogin }: { onLogin: (u: AdminUser) => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await signIn(email, password);
      if (res?.user) onLogin(res.user);
      else setError("Invalid credentials");
    } catch (err: any) {
      setError(err.message ?? "Sign in failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      background: "#0a0a0a", padding: 20,
    }}>
      <div style={{ width: "100%", maxWidth: 400 }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <div style={{
            width: 56, height: 56, background: "rgba(224,32,32,0.1)", border: "1px solid rgba(224,32,32,0.25)",
            borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px",
          }}>
            <Lock size={22} color="#e02020" />
          </div>
          <h1 style={{ fontFamily: "Rajdhani, sans-serif", fontSize: 28, fontWeight: 700, letterSpacing: 1 }}>
            LIBrepair
          </h1>
          <p style={{ color: "#555", fontSize: 13, marginTop: 4 }}>Super Admin Panel</p>
        </div>

        <form onSubmit={handleSubmit} style={{
          background: "#111", border: "1px solid rgba(255,255,255,0.07)",
          borderRadius: 16, padding: 28, display: "flex", flexDirection: "column", gap: 16,
        }}>
          <p style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: "#555" }}>
            Admin Sign In
          </p>

          {error && (
            <div style={{
              display: "flex", alignItems: "center", gap: 8, padding: "10px 14px",
              background: "rgba(224,32,32,0.08)", border: "1px solid rgba(224,32,32,0.2)",
              borderRadius: 8, color: "#f87171", fontSize: 13,
            }}>
              <AlertCircle size={14} />
              {error}
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Email</label>
            <div style={{ position: "relative" }}>
              <Mail size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#555" }} />
              <input
                type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="admin@librepair.com" required
                style={{ paddingLeft: 36 }}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <div style={{ position: "relative" }}>
              <Lock size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#555" }} />
              <input
                type="password" value={password} onChange={e => setPassword(e.target.value)}
                placeholder="••••••••" required
                style={{ paddingLeft: 36 }}
              />
            </div>
          </div>

          <button type="submit" className="btn btn-red" disabled={loading} style={{ width: "100%", justifyContent: "center", padding: "12px 16px", marginTop: 4 }}>
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <p style={{ textAlign: "center", marginTop: 20, color: "#333", fontSize: 12 }}>
          LIBrepair Super Admin · Restricted Access
        </p>
      </div>
    </div>
  );
}
