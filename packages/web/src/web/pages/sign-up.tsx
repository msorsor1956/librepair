import { useState } from "react";
import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import { authClient, captureToken } from "../lib/auth";
import { Eye, EyeOff, ArrowLeft, Mail, Check, X } from "lucide-react";

function PasswordRule({ met, text }: { met: boolean; text: string }) {
  return (
    <li className="flex items-center gap-2 text-xs" style={{ color: met ? "var(--color-success)" : "var(--color-muted)" }}>
      {met ? <Check size={11} /> : <X size={11} />}
      {text}
    </li>
  );
}

export default function SignUpPage() {
  const [, navigate] = useLocation();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showRules, setShowRules] = useState(false);

  const rules = {
    length: password.length >= 8,
    upper: /[A-Z]/.test(password),
    lower: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
  };
  const allRulesMet = Object.values(rules).every(Boolean);

  const validateEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateEmail(email)) { setError("Please enter a valid email address."); return; }
    if (!allRulesMet) { setError("Password does not meet requirements."); return; }
    if (password !== confirm) { setError("Passwords do not match."); return; }

    setLoading(true);
    setError("");
    await authClient.signUp.email(
      { name: `${firstName} ${lastName}`.trim(), email, password },
      {
        onSuccess: async (ctx) => {
          captureToken(ctx as any);
          navigate("/customer/dashboard");
        },
        onError: (ctx) => {
          setError(ctx.error?.message ?? "Registration failed. Please try again.");
          setLoading(false);
        },
      }
    );
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8 bg-grid relative" style={{ backgroundColor: "var(--color-bg)" }}>
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[300px] rounded-full opacity-10 pointer-events-none" style={{ background: "radial-gradient(circle, #e02020, transparent 70%)" }} />
      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="w-full max-w-md">
        <div className="glass rounded-2xl p-8">
          <div className="mb-6">
            <Link to="/welcome">
              <button className="flex items-center gap-2 text-sm mb-6 hover:text-white transition-colors" style={{ color: "var(--color-muted)" }}>
                <ArrowLeft size={14} /> Back
              </button>
            </Link>
            <div className="flex justify-center mb-5">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: "rgba(224,32,32,0.15)" }}>
                <Mail size={22} style={{ color: "var(--color-red)" }} />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-center mb-1" style={{ fontFamily: "Rajdhani" }}>Create Account</h1>
            <p className="text-sm text-center" style={{ color: "var(--color-muted)" }}>Register with your email address</p>
          </div>

          {error && (
            <div className="mb-4 px-4 py-3 rounded-lg text-sm" style={{ backgroundColor: "rgba(224,32,32,0.1)", color: "#e02020", border: "1px solid rgba(224,32,32,0.2)" }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSignUp} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--color-silver)" }}>First Name</label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                  placeholder="John"
                  className="w-full px-4 py-3 rounded-lg text-sm outline-none transition-all"
                  style={{ backgroundColor: "var(--color-surface2)", border: "1px solid var(--color-border)", color: "var(--color-white)" }}
                  onFocus={(e) => (e.target.style.borderColor = "var(--color-red)")}
                  onBlur={(e) => (e.target.style.borderColor = "var(--color-border)")}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--color-silver)" }}>Last Name</label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                  placeholder="Smith"
                  className="w-full px-4 py-3 rounded-lg text-sm outline-none transition-all"
                  style={{ backgroundColor: "var(--color-surface2)", border: "1px solid var(--color-border)", color: "var(--color-white)" }}
                  onFocus={(e) => (e.target.style.borderColor = "var(--color-red)")}
                  onBlur={(e) => (e.target.style.borderColor = "var(--color-border)")}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--color-silver)" }}>Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
                className="w-full px-4 py-3 rounded-lg text-sm outline-none transition-all"
                style={{ backgroundColor: "var(--color-surface2)", border: "1px solid var(--color-border)", color: "var(--color-white)" }}
                onFocus={(e) => (e.target.style.borderColor = "var(--color-red)")}
                onBlur={(e) => (e.target.style.borderColor = "var(--color-border)")}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--color-silver)" }}>Password</label>
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setShowRules(true); }}
                  required
                  placeholder="Min. 8 characters"
                  className="w-full px-4 py-3 rounded-lg text-sm outline-none transition-all pr-11"
                  style={{ backgroundColor: "var(--color-surface2)", border: "1px solid var(--color-border)", color: "var(--color-white)" }}
                  onFocus={(e) => (e.target.style.borderColor = "var(--color-red)")}
                  onBlur={(e) => (e.target.style.borderColor = "var(--color-border)")}
                />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: "var(--color-muted)" }}>
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {showRules && (
                <ul className="mt-2 space-y-1 pl-1">
                  <PasswordRule met={rules.length} text="Minimum 8 characters" />
                  <PasswordRule met={rules.upper} text="At least 1 uppercase letter" />
                  <PasswordRule met={rules.lower} text="At least 1 lowercase letter" />
                  <PasswordRule met={rules.number} text="At least 1 number" />
                  <PasswordRule met={rules.special} text="At least 1 special character" />
                </ul>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--color-silver)" }}>Confirm Password</label>
              <input
                type={showPw ? "text" : "password"}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                placeholder="Re-enter password"
                className="w-full px-4 py-3 rounded-lg text-sm outline-none transition-all"
                style={{
                  backgroundColor: "var(--color-surface2)",
                  border: confirm && confirm !== password ? "1px solid var(--color-red)" : "1px solid var(--color-border)",
                  color: "var(--color-white)",
                }}
                onFocus={(e) => (e.target.style.borderColor = "var(--color-red)")}
                onBlur={(e) => (e.target.style.borderColor = confirm && confirm !== password ? "var(--color-red)" : "var(--color-border)")}
              />
              {confirm && confirm !== password && (
                <p className="text-xs mt-1" style={{ color: "var(--color-red)" }}>Passwords do not match</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl font-semibold text-white transition-all disabled:opacity-60 red-glow"
              style={{ backgroundColor: "var(--color-red)" }}
            >
              {loading ? "Creating account..." : "Create Account"}
            </button>
          </form>

          <p className="text-xs text-center mt-4" style={{ color: "var(--color-muted)" }}>
            By signing up, you agree to our{" "}
            <span className="underline cursor-pointer hover:text-white">Terms of Service</span> and{" "}
            <span className="underline cursor-pointer hover:text-white">Privacy Policy</span>
          </p>

          <p className="text-sm text-center mt-4" style={{ color: "var(--color-muted)" }}>
            Already have an account?{" "}
            <Link to="/sign-in"><span className="font-semibold hover:underline" style={{ color: "var(--color-red)" }}>Sign in</span></Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
