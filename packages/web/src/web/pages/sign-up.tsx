import { useState } from "react";
import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import { authClient, captureToken } from "../lib/auth";
import { Eye, EyeOff, ArrowLeft, Mail, Phone, Check, X } from "lucide-react";

function PasswordRule({ met, text }: { met: boolean; text: string }) {
  return (
    <li className="flex items-center gap-2 text-xs" style={{ color: met ? "var(--color-success)" : "var(--color-muted)" }}>
      {met ? <Check size={11} /> : <X size={11} />}
      {text}
    </li>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
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
  const [googleLoading, setGoogleLoading] = useState(false);
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

  const handleGoogleSignUp = async () => {
    setGoogleLoading(true);
    setError("");
    try {
      const frontendBase = import.meta.env.VITE_FRONTEND_URL ?? window.location.origin;
      await authClient.signIn.social(
        { provider: "google", callbackURL: `${frontendBase}/customer/dashboard` },
        {
          onSuccess: (ctx) => {
            captureToken(ctx as any);
            navigate("/customer/dashboard");
          },
          onError: (ctx) => {
            setError(ctx.error?.message ?? "Google sign-up failed. Please try again.");
            setGoogleLoading(false);
          },
        }
      );
    } catch (e: any) {
      setError(e.message ?? "Google sign-up unavailable.");
      setGoogleLoading(false);
    }
  };

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

          <Link to="/welcome">
            <button className="flex items-center gap-2 text-sm mb-6 hover:text-white transition-colors" style={{ color: "var(--color-muted)" }}>
              <ArrowLeft size={14} /> Back
            </button>
          </Link>

          <h1 className="text-3xl font-bold text-center mb-1" style={{ fontFamily: "Rajdhani" }}>Create Account</h1>
          <p className="text-sm text-center mb-6" style={{ color: "var(--color-muted)" }}>Choose how you'd like to sign up</p>

          {/* Google sign-up */}
          <motion.button
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            onClick={handleGoogleSignUp}
            disabled={googleLoading}
            className="w-full flex items-center justify-center gap-3 py-3.5 rounded-xl font-semibold text-sm transition-all border mb-3 disabled:opacity-60"
            style={{ backgroundColor: "var(--color-surface2)", borderColor: "var(--color-border)", color: "var(--color-white)" }}
          >
            <GoogleIcon />
            {googleLoading ? "Redirecting to Google..." : "Continue with Google"}
          </motion.button>

          {/* Phone sign-up */}
          <Link to="/sign-up/phone">
            <motion.button
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              className="w-full flex items-center justify-center gap-3 py-3.5 rounded-xl font-semibold text-sm transition-all border mb-5"
              style={{ backgroundColor: "var(--color-surface2)", borderColor: "var(--color-border)", color: "var(--color-white)" }}
            >
              <Phone size={18} />
              Continue with Phone Number
            </motion.button>
          </Link>

          {/* Divider */}
          <div className="relative mb-5">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t" style={{ borderColor: "var(--color-border)" }} /></div>
            <div className="relative flex justify-center text-xs px-3">
              <span style={{ backgroundColor: "transparent", color: "var(--color-muted)" }}>or sign up with email</span>
            </div>
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
              {loading ? "Creating account..." : "Create Account with Email"}
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
