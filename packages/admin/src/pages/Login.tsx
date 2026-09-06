import { useState } from "react";
import { signIn, signInWithGoogle } from "../lib/auth";
import type { AdminUser } from "../App";
import { Mail, Lock, AlertCircle } from "lucide-react";

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

  async function handleGoogle() {
    setError(""); setLoading(true);
    try { const res = await signInWithGoogle(); if (res?.user) onLogin(res.user); }
    catch (err: any) { setError(err.message ?? "Google sign in failed"); }
    finally { setLoading(false); }
  }

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      backgroundImage: "url('/bg.png')",
      backgroundSize: "cover",
      backgroundPosition: "center",
      backgroundRepeat: "no-repeat",
      padding: 20,
      position: "relative",
    }}>
      {/* dark overlay */}
      <div style={{
        position: "absolute", inset: 0,
        background: "rgba(0,0,0,0.65)",
        backdropFilter: "blur(1px)",
      }} />

      <div style={{ width: "100%", maxWidth: 420, position: "relative", zIndex: 1 }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <h1 style={{ fontFamily: "Rajdhani, sans-serif", fontSize: 32, fontWeight: 700, letterSpacing: 2, margin: 0, color: "#fff", textShadow: "0 0 20px rgba(224,32,32,0.6)" }}>
            LIBrepair
          </h1>
          <p style={{ color: "#aaa", fontSize: 13, marginTop: 8, letterSpacing: "0.08em", textTransform: "uppercase" }}>
            Super Admin Panel
          </p>
        </div>

        {/* Card */}
        <form onSubmit={handleSubmit} style={{
          background: "rgba(10,10,10,0.85)",
          border: "1px solid rgba(224,32,32,0.2)",
          borderRadius: 18,
          padding: "32px 28px",
          display: "flex",
          flexDirection: "column",
          gap: 16,
          boxShadow: "0 8px 48px rgba(0,0,0,0.7), 0 0 0 1px rgba(224,32,32,0.08)",
          backdropFilter: "blur(12px)",
        }}>
          <p style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.07em", color: "#555", margin: 0 }}>
            Restricted Access · Admin Sign In
          </p>

          {error && (
            <div style={{
              display: "flex", alignItems: "center", gap: 8,
              padding: "10px 14px",
              background: "rgba(224,32,32,0.08)",
              border: "1px solid rgba(224,32,32,0.2)",
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

          <button
            type="submit"
            className="btn btn-red"
            disabled={loading}
            style={{ width: "100%", justifyContent: "center", padding: "13px 16px", marginTop: 4, fontSize: 14, fontWeight: 700, letterSpacing: "0.04em" }}
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
          <button type="button" className="btn btn-ghost" disabled={loading} onClick={handleGoogle} style={{ width: "100%", justifyContent: "center" }}>
            Continue with Google
          </button>
        </form>

        <p style={{ textAlign: "center", marginTop: 20, color: "#333", fontSize: 11, letterSpacing: "0.05em" }}>
          LIBrepair · We Keep You Moving
        </p>
      </div>
    </div>
  );
}
