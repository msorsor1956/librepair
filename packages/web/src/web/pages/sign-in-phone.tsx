import { apiFetch } from "@/lib/api";
import { useState, useRef, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Phone, RotateCcw } from "lucide-react";
import { sendFirebaseOTP, firebaseAuth, clearRecaptcha } from "@/lib/firebase";
import type { ConfirmationResult } from "firebase/auth";
import { signOut } from "firebase/auth";

export default function SignInPhonePage() {
  useEffect(() => {
    clearRecaptcha();
    return () => clearRecaptcha();
  }, []);
  const [, navigate] = useLocation();
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);
  const confirmationRef = useRef<ConfirmationResult | null>(null);

  const startCooldown = () => {
    setResendCooldown(30);
    const t = setInterval(() => {
      setResendCooldown((c) => { if (c <= 1) { clearInterval(t); return 0; } return c - 1; });
    }, 1000);
  };

  const sendOTP = async () => {
    setLoading(true);
    setError("");
    try {
      const result = await sendFirebaseOTP(phone);
      confirmationRef.current = result;
      setStep("otp");
      startCooldown();
    } catch (e: any) {
      const msg = e?.code === "auth/invalid-phone-number"
        ? "Invalid phone number. Include country code e.g. +1 555 000 0000"
        : e?.code === "auth/too-many-requests"
        ? "Too many attempts. Please wait and try again."
        : e?.message ?? "Failed to send code. Try again.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const verifyOTP = async () => {
    const code = otp.join("");
    if (code.length !== 6) { setError("Enter all 6 digits"); return; }
    if (!confirmationRef.current) { setError("Session expired. Resend code."); return; }
    setLoading(true);
    setError("");
    try {
      // Confirm OTP via Firebase
      const credential = await confirmationRef.current.confirm(code);
      const idToken = await credential.user.getIdToken();

      // Sign Firebase user out — we manage session via Better Auth cookie
      await signOut(firebaseAuth);

      // Exchange Firebase token for our session
      const res = await apiFetch("/api/phone-auth/firebase-verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken, phone }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Verification failed"); return; }

      navigate("/customer/dashboard");
    } catch (e: any) {
      const msg = e?.code === "auth/invalid-verification-code"
        ? "Incorrect code. Double-check and try again."
        : e?.code === "auth/code-expired"
        ? "Code expired. Please resend."
        : e?.message ?? "Verification failed";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (idx: number, val: string) => {
    if (!/^\d?$/.test(val)) return;
    const next = [...otp];
    next[idx] = val;
    setOtp(next);
    if (val && idx < 5) (document.getElementById(`otp-${idx + 1}`) as HTMLInputElement)?.focus();
  };

  const handleOtpKey = (idx: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[idx] && idx > 0) {
      (document.getElementById(`otp-${idx - 1}`) as HTMLInputElement)?.focus();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-grid" style={{ backgroundColor: "var(--color-bg)" }}>
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[300px] rounded-full opacity-10 pointer-events-none"
        style={{ background: "radial-gradient(circle, #e02020, transparent 70%)" }} />

      {/* Invisible reCAPTCHA anchor */}
      <div id="recaptcha-container" />

      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="w-full max-w-md">
        <div className="glass rounded-2xl p-8">
          <div className="mb-6">
            {step === "otp" ? (
              <button onClick={() => setStep("phone")} className="flex items-center gap-2 text-sm hover:text-white transition-colors" style={{ color: "var(--color-muted)" }}>
                <ArrowLeft size={14} /> Back
              </button>
            ) : (
              <Link to="/">
                <span className="flex items-center gap-2 text-sm hover:text-white transition-colors cursor-pointer" style={{ color: "var(--color-muted)" }}>
                  <ArrowLeft size={14} /> Back
                </span>
              </Link>
            )}
          </div>

          <div className="flex justify-center mb-5">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: "rgba(224,32,32,0.15)" }}>
              <Phone size={22} style={{ color: "var(--color-red)" }} />
            </div>
          </div>

          <AnimatePresence mode="wait">
            {step === "phone" ? (
              <motion.div key="phone" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
                <h1 className="text-3xl font-bold text-center mb-1" style={{ fontFamily: "Rajdhani" }}>Sign In with Phone</h1>
                <p className="text-sm text-center mb-8" style={{ color: "var(--color-muted)" }}>We'll send a verification code via SMS</p>

                {error && <div className="mb-4 px-4 py-3 rounded-lg text-sm" style={{ backgroundColor: "rgba(224,32,32,0.1)", color: "#e02020", border: "1px solid rgba(224,32,32,0.2)" }}>{error}</div>}

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--color-silver)" }}>Mobile Phone Number</label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+1 (555) 000-0000"
                      className="w-full px-4 py-3 rounded-lg text-sm outline-none transition-all"
                      style={{ backgroundColor: "var(--color-surface2)", border: "1px solid var(--color-border)", color: "var(--color-white)" }}
                      onFocus={(e) => (e.target.style.borderColor = "var(--color-red)")}
                      onBlur={(e) => (e.target.style.borderColor = "var(--color-border)")}
                      onKeyDown={(e) => e.key === "Enter" && phone && sendOTP()}
                    />
                    <p className="text-xs mt-1.5" style={{ color: "var(--color-muted)" }}>Include country code · e.g. +1 for US</p>
                  </div>

                  {/* reCAPTCHA invisible button anchor */}
                  <button
                    id="send-otp-btn"
                    onClick={sendOTP}
                    disabled={loading || !phone}
                    className="w-full py-3.5 rounded-xl font-semibold text-white transition-all disabled:opacity-60 red-glow"
                    style={{ backgroundColor: "var(--color-red)" }}
                  >
                    {loading ? "Sending..." : "Send Verification Code"}
                  </button>
                </div>

                <p className="text-sm text-center mt-6" style={{ color: "var(--color-muted)" }}>
                  Don't have an account?{" "}
                  <Link to="/sign-up/phone"><span className="hover:underline cursor-pointer" style={{ color: "var(--color-red)" }}>Sign up</span></Link>
                </p>
              </motion.div>
            ) : (
              <motion.div key="otp" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <h1 className="text-3xl font-bold text-center mb-1" style={{ fontFamily: "Rajdhani" }}>Enter Code</h1>
                <p className="text-sm text-center mb-1" style={{ color: "var(--color-muted)" }}>6-digit code sent to</p>
                <p className="text-sm text-center font-medium mb-8" style={{ color: "var(--color-white)" }}>{phone}</p>

                {error && <div className="mb-4 px-4 py-3 rounded-lg text-sm" style={{ backgroundColor: "rgba(224,32,32,0.1)", color: "#e02020", border: "1px solid rgba(224,32,32,0.2)" }}>{error}</div>}

                <div className="flex gap-2 justify-center mb-6">
                  {otp.map((digit, i) => (
                    <input
                      key={i}
                      id={`otp-${i}`}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(i, e.target.value)}
                      onKeyDown={(e) => handleOtpKey(i, e)}
                      className="w-12 h-14 text-center text-xl font-bold rounded-lg outline-none transition-all"
                      style={{
                        backgroundColor: "var(--color-surface2)",
                        border: digit ? "2px solid var(--color-red)" : "1px solid var(--color-border)",
                        color: "var(--color-white)",
                      }}
                    />
                  ))}
                </div>

                <button
                  onClick={verifyOTP}
                  disabled={loading || otp.join("").length !== 6}
                  className="w-full py-3.5 rounded-xl font-semibold text-white transition-all disabled:opacity-60 red-glow"
                  style={{ backgroundColor: "var(--color-red)" }}
                >
                  {loading ? "Verifying..." : "Verify & Sign In"}
                </button>

                <div className="text-center mt-4">
                  {resendCooldown > 0 ? (
                    <p className="text-sm" style={{ color: "var(--color-muted)" }}>Resend in {resendCooldown}s</p>
                  ) : (
                    <button onClick={sendOTP} disabled={loading} className="text-sm flex items-center gap-1 mx-auto hover:underline" style={{ color: "var(--color-red)" }}>
                      <RotateCcw size={14} /> Resend code
                    </button>
                  )}
                </div>
                <p className="text-xs text-center mt-4" style={{ color: "var(--color-muted)" }}>Powered by Firebase · Code expires in 5 minutes</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
