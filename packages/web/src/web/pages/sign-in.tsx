import { useState } from "react";
import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import { authClient, captureToken } from "../lib/auth";
import { Eye, EyeOff, ArrowLeft, Phone } from "lucide-react";

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

export default function SignInPage() {
  const [, navigate] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");

  const handleGoogleSignIn = async () => {
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
            setError(ctx.error?.message ?? "Google sign-in failed. Please try again.");
            setGoogleLoading(false);
          },
        }
      );
    } catch (e: any) {
      setError(e.message ?? "Google sign-in unavailable.");
      setGoogleLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    await authClient.signIn.email(
      { email, password },
      {
        onSuccess: (ctx) => {
          captureToken(ctx as any);
          navigate("/customer/dashboard");
        },
        onError: (ctx) => {
          setError(ctx.error?.message ?? "Invalid credentials. Please try again.");
          setLoading(false);
        },
      }
    );
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-grid relative" style={{ backgroundColor: "var(--color-bg)" }}>
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[300px] rounded-full opacity-10 pointer-events-none" style={{ background: "radial-gradient(circle, #e02020, transparent 70%)" }} />
      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="w-full max-w-md">
        <div className="glass rounded-2xl p-8">

          <Link to="/">
            <button className="flex items-center gap-2 text-sm mb-6 hover:text-white transition-colors" style={{ color: "var(--color-muted)" }}>
              <ArrowLeft size={14} /> Back
            </button>
          </Link>

          <h1 className="text-3xl font-bold text-center mb-1" style={{ fontFamily: "Rajdhani" }}>Welcome Back</h1>
          <p className="text-sm text-center mb-6" style={{ color: "var(--color-muted)" }}>Choose how you'd like to sign in</p>

          {/* Google sign-in */}
          <motion.button
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            onClick={handleGoogleSignIn}
            disabled={googleLoading}
            className="w-full flex items-center justify-center gap-3 py-3.5 rounded-xl font-semibold text-sm transition-all border mb-3 disabled:opacity-60"
            style={{ backgroundColor: "var(--color-surface2)", borderColor: "var(--color-border)", color: "var(--color-white)" }}
          >
            <GoogleIcon />
            {googleLoading ? "Redirecting to Google..." : "Continue with Google"}
          </motion.button>

          {/* Phone sign-in */}
          <Link to="/sign-in/phone">
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
              <span style={{ backgroundColor: "transparent", color: "var(--color-muted)" }}>or sign in with email</span>
            </div>
          </div>

          {error && (
            <div className="mb-4 px-4 py-3 rounded-lg text-sm" style={{ backgroundColor: "rgba(224,32,32,0.1)", color: "#e02020", border: "1px solid rgba(224,32,32,0.2)" }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSignIn} className="space-y-4">
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
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm font-medium" style={{ color: "var(--color-silver)" }}>Password</label>
                <Link to="/forgot-password">
                  <span className="text-xs hover:underline" style={{ color: "var(--color-red)" }}>Forgot password?</span>
                </Link>
              </div>
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full px-4 py-3 rounded-lg text-sm outline-none transition-all pr-11"
                  style={{ backgroundColor: "var(--color-surface2)", border: "1px solid var(--color-border)", color: "var(--color-white)" }}
                  onFocus={(e) => (e.target.style.borderColor = "var(--color-red)")}
                  onBlur={(e) => (e.target.style.borderColor = "var(--color-border)")}
                />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: "var(--color-muted)" }}>
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl font-semibold text-white transition-all disabled:opacity-60 red-glow"
              style={{ backgroundColor: "var(--color-red)" }}
            >
              {loading ? "Signing in..." : "Sign In with Email"}
            </button>
          </form>

          <p className="text-sm text-center mt-6" style={{ color: "var(--color-muted)" }}>
            Don't have an account?{" "}
            <Link to="/sign-up"><span className="font-semibold hover:underline" style={{ color: "var(--color-red)" }}>Create one</span></Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
