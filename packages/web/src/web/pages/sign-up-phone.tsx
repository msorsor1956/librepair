import { useState } from "react";
import { Link, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Phone, RotateCcw } from "lucide-react";

export default function SignUpPhonePage() {
  const [, navigate] = useLocation();
  const [step, setStep] = useState<"form" | "otp">("form");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);

  const startCooldown = () => {
    setResendCooldown(30);
    const t = setInterval(() => {
      setResendCooldown((c) => { if (c <= 1) { clearInterval(t); return 0; } return c - 1; });
    }, 1000);
  };

  const sendOTP = async () => {
    if (!firstName || !lastName || !phone) { setError("All fields are required"); return; }
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/phone-auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, firstName, lastName, mode: "signup" }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Failed to send code"); return; }
      setStep("otp");
      startCooldown();
    } catch { setError("Network error. Please try again."); }
    finally { setLoading(false); }
  };

  const verifyOTP = async () => {
    const code = otp.join("");
    if (code.length !== 6) { setError("Enter all 6 digits"); return; }
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/phone-auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, otp: code, firstName, lastName }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Verification failed"); return; }
      navigate("/customer/dashboard");
    } catch { setError("Network error. Please try again."); }
    finally { setLoading(false); }
  };

  const handleOtpChange = (idx: number, val: string) => {
    if (!/^\d?$/.test(val)) return;
    const next = [...otp]; next[idx] = val; setOtp(next);
    if (val && idx < 5) (document.getElementById(`otp2-${idx + 1}`) as HTMLInputElement)?.focus();
  };

  const handleOtpKey = (idx: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[idx] && idx > 0) (document.getElementById(`otp2-${idx - 1}`) as HTMLInputElement)?.focus();
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-grid" style={{ backgroundColor: "var(--color-bg)" }}>
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[300px] rounded-full opacity-10 pointer-events-none" style={{ background: "radial-gradient(circle, #e02020, transparent 70%)" }} />
      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="w-full max-w-md">
        <div className="glass rounded-2xl p-8">
          <button onClick={() => step === "otp" ? setStep("form") : undefined} className="flex items-center gap-2 text-sm mb-6 hover:text-white transition-colors" style={{ color: "var(--color-muted)" }}>
            {step === "otp"
              ? <span onClick={() => setStep("form")} className="cursor-pointer flex items-center gap-2"><ArrowLeft size={14} /> Back</span>
              : <Link to="/welcome"><span className="flex items-center gap-2"><ArrowLeft size={14} /> Back</span></Link>
            }
          </button>

          <div className="flex justify-center mb-5">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: "rgba(224,32,32,0.15)" }}>
              <Phone size={22} style={{ color: "var(--color-red)" }} />
            </div>
          </div>

          <AnimatePresence mode="wait">
            {step === "form" ? (
              <motion.div key="form" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
                <h1 className="text-3xl font-bold text-center mb-1" style={{ fontFamily: "Rajdhani" }}>Register with Phone</h1>
                <p className="text-sm text-center mb-8" style={{ color: "var(--color-muted)" }}>We'll verify your number via SMS</p>

                {error && <div className="mb-4 px-4 py-3 rounded-lg text-sm" style={{ backgroundColor: "rgba(224,32,32,0.1)", color: "#e02020", border: "1px solid rgba(224,32,32,0.2)" }}>{error}</div>}

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--color-silver)" }}>First Name</label>
                      <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="John" className="w-full px-4 py-3 rounded-lg text-sm outline-none" style={{ backgroundColor: "var(--color-surface2)", border: "1px solid var(--color-border)", color: "var(--color-white)" }} onFocus={(e) => (e.target.style.borderColor = "var(--color-red)")} onBlur={(e) => (e.target.style.borderColor = "var(--color-border)")} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--color-silver)" }}>Last Name</label>
                      <input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Smith" className="w-full px-4 py-3 rounded-lg text-sm outline-none" style={{ backgroundColor: "var(--color-surface2)", border: "1px solid var(--color-border)", color: "var(--color-white)" }} onFocus={(e) => (e.target.style.borderColor = "var(--color-red)")} onBlur={(e) => (e.target.style.borderColor = "var(--color-border)")} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--color-silver)" }}>Mobile Phone Number</label>
                    <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+1 (555) 000-0000" className="w-full px-4 py-3 rounded-lg text-sm outline-none" style={{ backgroundColor: "var(--color-surface2)", border: "1px solid var(--color-border)", color: "var(--color-white)" }} onFocus={(e) => (e.target.style.borderColor = "var(--color-red)")} onBlur={(e) => (e.target.style.borderColor = "var(--color-border)")} />
                  </div>
                  <button onClick={sendOTP} disabled={loading} className="w-full py-3.5 rounded-xl font-semibold text-white transition-all disabled:opacity-60 red-glow" style={{ backgroundColor: "var(--color-red)" }}>
                    {loading ? "Sending..." : "Send Verification Code"}
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.div key="otp" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <h1 className="text-3xl font-bold text-center mb-1" style={{ fontFamily: "Rajdhani" }}>Verify Your Number</h1>
                <p className="text-sm text-center mb-2" style={{ color: "var(--color-muted)" }}>6-digit code sent to</p>
                <p className="text-sm text-center font-medium mb-8" style={{ color: "var(--color-white)" }}>{phone}</p>

                {error && <div className="mb-4 px-4 py-3 rounded-lg text-sm" style={{ backgroundColor: "rgba(224,32,32,0.1)", color: "#e02020", border: "1px solid rgba(224,32,32,0.2)" }}>{error}</div>}

                <div className="flex gap-2 justify-center mb-6">
                  {otp.map((digit, i) => (
                    <input key={i} id={`otp2-${i}`} type="text" inputMode="numeric" maxLength={1} value={digit}
                      onChange={(e) => handleOtpChange(i, e.target.value)} onKeyDown={(e) => handleOtpKey(i, e)}
                      className="w-12 h-14 text-center text-xl font-bold rounded-lg outline-none transition-all"
                      style={{ backgroundColor: "var(--color-surface2)", border: digit ? "2px solid var(--color-red)" : "1px solid var(--color-border)", color: "var(--color-white)" }}
                    />
                  ))}
                </div>

                <button onClick={verifyOTP} disabled={loading || otp.join("").length !== 6} className="w-full py-3.5 rounded-xl font-semibold text-white transition-all disabled:opacity-60 red-glow" style={{ backgroundColor: "var(--color-red)" }}>
                  {loading ? "Creating account..." : "Verify & Create Account"}
                </button>

                <div className="text-center mt-4">
                  {resendCooldown > 0
                    ? <p className="text-sm" style={{ color: "var(--color-muted)" }}>Resend in {resendCooldown}s</p>
                    : <button onClick={sendOTP} className="text-sm flex items-center gap-1 mx-auto hover:underline" style={{ color: "var(--color-red)" }}><RotateCcw size={14} /> Resend code</button>
                  }
                </div>
                <p className="text-xs text-center mt-4" style={{ color: "var(--color-muted)" }}>Code expires in 5 minutes · Max 5 attempts</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
