import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import { Eye, EyeOff, CheckCircle, AlertCircle, Lock } from "lucide-react";
import { authClient } from "../lib/auth";

export default function ResetPasswordPage() {
  const [, navigate] = useLocation();
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    // Extract token from URL: /reset-password?token=xxx
    const params = new URLSearchParams(window.location.search);
    const t = params.get("oobCode") ?? params.get("token");
    if (t) setToken(t);
  }, []);

  const rules = [
    { label: "At least 8 characters", ok: password.length >= 8 },
    { label: "Contains a number", ok: /\d/.test(password) },
    { label: "Contains uppercase letter", ok: /[A-Z]/.test(password) },
    { label: "Passwords match", ok: password === confirm && confirm.length > 0 },
  ];
  const allValid = rules.every(r => r.ok);

  const handleSubmit = async () => {
    if (!allValid) return;
    if (!token) { setError("Invalid or expired reset link. Please request a new one."); return; }
    setLoading(true);
    setError("");
    try {
      await authClient.resetPassword({ newPassword: password, token });
      setSuccess(true);
    } catch (e: any) {
      setError(e?.message ?? "Failed to reset password. The link may have expired.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-grid" style={{ backgroundColor: "var(--color-bg)" }}>
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[300px] rounded-full opacity-10 pointer-events-none" style={{ background: "radial-gradient(circle, #e02020, transparent 70%)" }} />
      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="w-full max-w-md">
        <div className="glass rounded-2xl p-8">
          {/* Logo */}
          <div className="text-center mb-6">
            <span style={{ fontFamily: "Rajdhani", fontSize: 28, fontWeight: 800, color: "#e02020", letterSpacing: 2 }}>LIB</span>
            <span style={{ fontFamily: "Rajdhani", fontSize: 28, fontWeight: 800, color: "#fff" }}>repair</span>
          </div>

          {success ? (
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-4">
              <div style={{ width: 64, height: 64, borderRadius: "50%", background: "rgba(34,197,94,0.1)", border: "2px solid #22c55e", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
                <CheckCircle size={32} color="#22c55e" />
              </div>
              <h1 className="text-2xl font-bold mb-2" style={{ fontFamily: "Rajdhani" }}>Password Set!</h1>
              <p className="text-sm mb-6" style={{ color: "var(--color-muted)" }}>
                Your password has been set successfully. You can now sign in with your new password.
              </p>
              <Link to="/sign-in">
                <button className="w-full py-3.5 rounded-xl font-semibold text-white red-glow" style={{ backgroundColor: "var(--color-red)" }}>
                  Sign In Now →
                </button>
              </Link>
            </motion.div>
          ) : (
            <>
              <h1 className="text-2xl font-bold text-center mb-1" style={{ fontFamily: "Rajdhani" }}>
                {token ? "Set Your Password" : "Invalid Link"}
              </h1>
              <p className="text-sm text-center mb-6" style={{ color: "var(--color-muted)" }}>
                {token ? "Create a strong, secure password for your account" : "This reset link is invalid or has expired"}
              </p>

              {!token ? (
                <div className="text-center">
                  <div style={{ padding: "20px", background: "rgba(224,32,32,0.06)", border: "1px solid rgba(224,32,32,0.2)", borderRadius: 10, marginBottom: 20 }}>
                    <AlertCircle size={28} color="#e02020" style={{ margin: "0 auto 8px" }} />
                    <p style={{ color: "#f87171", fontSize: 13 }}>This link is missing a token. Please request a new password reset link.</p>
                  </div>
                  <Link to="/forgot-password">
                    <button className="w-full py-3.5 rounded-xl font-semibold text-white red-glow" style={{ backgroundColor: "var(--color-red)" }}>
                      Request New Link
                    </button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {error && (
                    <div className="px-4 py-3 rounded-lg text-sm flex items-center gap-2" style={{ backgroundColor: "rgba(224,32,32,0.1)", color: "#e02020", border: "1px solid rgba(224,32,32,0.2)" }}>
                      <AlertCircle size={14} /> {error}
                    </div>
                  )}

                  {/* Password */}
                  <div>
                    <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--color-silver)" }}>
                      <Lock size={12} style={{ display: "inline", marginRight: 6 }} />
                      New Password
                    </label>
                    <div style={{ position: "relative" }}>
                      <input
                        type={show ? "text" : "password"}
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        placeholder="Enter new password"
                        className="w-full px-4 py-3 rounded-lg text-sm outline-none"
                        style={{ backgroundColor: "var(--color-surface2)", border: "1px solid var(--color-border)", color: "var(--color-white)", paddingRight: 44 }}
                        onFocus={e => e.target.style.borderColor = "var(--color-red)"}
                        onBlur={e => e.target.style.borderColor = "var(--color-border)"}
                      />
                      <button
                        type="button"
                        onClick={() => setShow(!show)}
                        style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--color-muted)" }}
                      >
                        {show ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  {/* Confirm */}
                  <div>
                    <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--color-silver)" }}>
                      Confirm Password
                    </label>
                    <input
                      type={show ? "text" : "password"}
                      value={confirm}
                      onChange={e => setConfirm(e.target.value)}
                      placeholder="Confirm new password"
                      className="w-full px-4 py-3 rounded-lg text-sm outline-none"
                      style={{ backgroundColor: "var(--color-surface2)", border: "1px solid var(--color-border)", color: "var(--color-white)" }}
                      onFocus={e => e.target.style.borderColor = "var(--color-red)"}
                      onBlur={e => e.target.style.borderColor = "var(--color-border)"}
                      onKeyDown={e => e.key === "Enter" && allValid && handleSubmit()}
                    />
                  </div>

                  {/* Rules */}
                  {password.length > 0 && (
                    <div style={{ padding: "12px 14px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 8 }}>
                      {rules.map(r => (
                        <div key={r.label} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, fontSize: 12 }}>
                          <span style={{ color: r.ok ? "#22c55e" : "#555", fontSize: 14, lineHeight: 1 }}>{r.ok ? "✓" : "○"}</span>
                          <span style={{ color: r.ok ? "#86efac" : "#666" }}>{r.label}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  <button
                    onClick={handleSubmit}
                    disabled={loading || !allValid}
                    className="w-full py-3.5 rounded-xl font-semibold text-white red-glow disabled:opacity-50"
                    style={{ backgroundColor: "var(--color-red)" }}
                  >
                    {loading ? "Setting password..." : "Set Password →"}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}
