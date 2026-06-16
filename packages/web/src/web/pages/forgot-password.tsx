import { useState } from "react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Mail, Phone, RotateCcw, CheckCircle } from "lucide-react";
import { authClient } from "../lib/auth";

type Mode = "select" | "email" | "phone" | "phone-otp" | "success";

export default function ForgotPasswordPage() {
  const [mode, setMode] = useState<Mode>("select");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);

  const startCooldown = () => {
    setResendCooldown(30);
    const t = setInterval(() => setResendCooldown((c) => { if (c <= 1) { clearInterval(t); return 0; } return c - 1; }), 1000);
  };

  const sendEmailReset = async () => {
    setLoading(true); setError("");
    try {
      await authClient.forgetPassword({ email, redirectTo: "/reset-password" });
      setMode("success");
    } catch (e: any) {
      setError(e.message ?? "Failed to send reset email");
    } finally { setLoading(false); }
  };

  const sendPhoneOTP = async () => {
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/phone-auth/send-otp", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, mode: "signin" }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Failed to send code"); return; }
      setMode("phone-otp"); startCooldown();
    } catch { setError("Network error"); }
    finally { setLoading(false); }
  };

  const handleOtpChange = (idx: number, val: string) => {
    if (!/^\d?$/.test(val)) return;
    const next = [...otp]; next[idx] = val; setOtp(next);
    if (val && idx < 5) (document.getElementById(`fp-otp-${idx + 1}`) as HTMLInputElement)?.focus();
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-grid" style={{ backgroundColor: "var(--color-bg)" }}>
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[300px] rounded-full opacity-10 pointer-events-none" style={{ background: "radial-gradient(circle, #e02020, transparent 70%)" }} />
      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="w-full max-w-md">
        <div className="glass rounded-2xl p-8">
          <Link to="/sign-in">
            <button className="flex items-center gap-2 text-sm mb-6 hover:text-white transition-colors" style={{ color: "var(--color-muted)" }}>
              <ArrowLeft size={14} /> Back to Sign In
            </button>
          </Link>

          <AnimatePresence mode="wait">
            {mode === "select" && (
              <motion.div key="select" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <h1 className="text-3xl font-bold text-center mb-2" style={{ fontFamily: "Rajdhani" }}>Reset Password</h1>
                <p className="text-sm text-center mb-8" style={{ color: "var(--color-muted)" }}>Choose how you'd like to reset your password</p>
                <div className="space-y-3">
                  <button onClick={() => setMode("email")} className="w-full flex items-center gap-3 px-5 py-4 rounded-xl border transition-all hover:border-red-500" style={{ backgroundColor: "var(--color-surface2)", borderColor: "var(--color-border)", color: "var(--color-white)" }}>
                    <Mail size={20} style={{ color: "var(--color-red)" }} />
                    <div className="text-left">
                      <p className="font-semibold text-sm">Reset via Email</p>
                      <p className="text-xs" style={{ color: "var(--color-muted)" }}>Receive a secure reset link</p>
                    </div>
                  </button>
                  <button onClick={() => setMode("phone")} className="w-full flex items-center gap-3 px-5 py-4 rounded-xl border transition-all hover:border-red-500" style={{ backgroundColor: "var(--color-surface2)", borderColor: "var(--color-border)", color: "var(--color-white)" }}>
                    <Phone size={20} style={{ color: "var(--color-red)" }} />
                    <div className="text-left">
                      <p className="font-semibold text-sm">Reset via Phone Number</p>
                      <p className="text-xs" style={{ color: "var(--color-muted)" }}>Receive an OTP code via SMS</p>
                    </div>
                  </button>
                </div>
              </motion.div>
            )}

            {mode === "email" && (
              <motion.div key="email" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <h1 className="text-3xl font-bold text-center mb-2" style={{ fontFamily: "Rajdhani" }}>Email Reset</h1>
                <p className="text-sm text-center mb-8" style={{ color: "var(--color-muted)" }}>Enter your email to receive a reset link</p>
                {error && <div className="mb-4 px-4 py-3 rounded-lg text-sm" style={{ backgroundColor: "rgba(224,32,32,0.1)", color: "#e02020", border: "1px solid rgba(224,32,32,0.2)" }}>{error}</div>}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--color-silver)" }}>Email Address</label>
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="w-full px-4 py-3 rounded-lg text-sm outline-none" style={{ backgroundColor: "var(--color-surface2)", border: "1px solid var(--color-border)", color: "var(--color-white)" }} onFocus={(e) => (e.target.style.borderColor = "var(--color-red)")} onBlur={(e) => (e.target.style.borderColor = "var(--color-border)")} />
                  </div>
                  <button onClick={sendEmailReset} disabled={loading || !email} className="w-full py-3.5 rounded-xl font-semibold text-white disabled:opacity-60 red-glow" style={{ backgroundColor: "var(--color-red)" }}>
                    {loading ? "Sending..." : "Send Reset Link"}
                  </button>
                  <button onClick={() => setMode("select")} className="w-full text-sm" style={{ color: "var(--color-muted)" }}>← Back to options</button>
                </div>
              </motion.div>
            )}

            {mode === "phone" && (
              <motion.div key="phone" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <h1 className="text-3xl font-bold text-center mb-2" style={{ fontFamily: "Rajdhani" }}>Phone Reset</h1>
                <p className="text-sm text-center mb-8" style={{ color: "var(--color-muted)" }}>Enter your phone number to receive an OTP</p>
                {error && <div className="mb-4 px-4 py-3 rounded-lg text-sm" style={{ backgroundColor: "rgba(224,32,32,0.1)", color: "#e02020", border: "1px solid rgba(224,32,32,0.2)" }}>{error}</div>}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--color-silver)" }}>Phone Number</label>
                    <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+1 (555) 000-0000" className="w-full px-4 py-3 rounded-lg text-sm outline-none" style={{ backgroundColor: "var(--color-surface2)", border: "1px solid var(--color-border)", color: "var(--color-white)" }} onFocus={(e) => (e.target.style.borderColor = "var(--color-red)")} onBlur={(e) => (e.target.style.borderColor = "var(--color-border)")} />
                  </div>
                  <button onClick={sendPhoneOTP} disabled={loading || !phone} className="w-full py-3.5 rounded-xl font-semibold text-white disabled:opacity-60 red-glow" style={{ backgroundColor: "var(--color-red)" }}>
                    {loading ? "Sending..." : "Send OTP"}
                  </button>
                  <button onClick={() => setMode("select")} className="w-full text-sm" style={{ color: "var(--color-muted)" }}>← Back to options</button>
                </div>
              </motion.div>
            )}

            {mode === "phone-otp" && (
              <motion.div key="phone-otp" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <h1 className="text-3xl font-bold text-center mb-2" style={{ fontFamily: "Rajdhani" }}>Enter Code</h1>
                <p className="text-sm text-center mb-8" style={{ color: "var(--color-muted)" }}>Code sent to {phone}</p>
                {error && <div className="mb-4 px-4 py-3 rounded-lg text-sm" style={{ backgroundColor: "rgba(224,32,32,0.1)", color: "#e02020", border: "1px solid rgba(224,32,32,0.2)" }}>{error}</div>}
                <div className="flex gap-2 justify-center mb-6">
                  {otp.map((digit, i) => (
                    <input key={i} id={`fp-otp-${i}`} type="text" inputMode="numeric" maxLength={1} value={digit}
                      onChange={(e) => handleOtpChange(i, e.target.value)}
                      className="w-12 h-14 text-center text-xl font-bold rounded-lg outline-none"
                      style={{ backgroundColor: "var(--color-surface2)", border: digit ? "2px solid var(--color-red)" : "1px solid var(--color-border)", color: "var(--color-white)" }}
                    />
                  ))}
                </div>
                <button disabled={otp.join("").length !== 6} className="w-full py-3.5 rounded-xl font-semibold text-white disabled:opacity-60 red-glow" style={{ backgroundColor: "var(--color-red)" }}>
                  Verify &amp; Reset Password
                </button>
                <div className="text-center mt-4">
                  {resendCooldown > 0
                    ? <p className="text-sm" style={{ color: "var(--color-muted)" }}>Resend in {resendCooldown}s</p>
                    : <button onClick={sendPhoneOTP} className="text-sm flex items-center gap-1 mx-auto" style={{ color: "var(--color-red)" }}><RotateCcw size={14} /> Resend code</button>
                  }
                </div>
              </motion.div>
            )}

            {mode === "success" && (
              <motion.div key="success" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-4">
                <CheckCircle size={56} className="mx-auto mb-4" style={{ color: "var(--color-success)" }} />
                <h1 className="text-3xl font-bold mb-2" style={{ fontFamily: "Rajdhani" }}>Check Your Email</h1>
                <p className="text-sm mb-6" style={{ color: "var(--color-muted)" }}>
                  We sent a password reset link to <span style={{ color: "var(--color-white)" }}>{email}</span>.<br/>
                  The link expires in 15 minutes.
                </p>
                <Link to="/sign-in">
                  <button className="w-full py-3.5 rounded-xl font-semibold text-white red-glow" style={{ backgroundColor: "var(--color-red)" }}>Back to Sign In</button>
                </Link>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
