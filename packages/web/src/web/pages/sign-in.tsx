import { useState } from "react";
import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import { authClient, captureToken } from "../lib/auth";
import { Eye, EyeOff, ArrowLeft } from "lucide-react";

export default function SignInPage() {
  const [, navigate] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    await authClient.signIn.email(
      { email, password },
      {
        onSuccess: (ctx) => {
          captureToken(ctx as any);
          navigate("/dashboard");
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

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="glass rounded-2xl p-8">
          <div className="mb-8">
            <Link to="/">
              <button className="flex items-center gap-2 text-sm mb-6 hover:text-white transition-colors" style={{ color: "var(--color-muted)" }}>
                <ArrowLeft size={14} /> Back to home
              </button>
            </Link>
            <div className="flex justify-center mb-6">
              <img src="/logo.png" alt="LIBrepair" className="h-10 w-auto" />
            </div>
            <h1 className="text-3xl font-bold text-center mb-1" style={{ fontFamily: "Rajdhani" }}>Welcome Back</h1>
            <p className="text-sm text-center" style={{ color: "var(--color-muted)" }}>Sign in to your LIBrepair account</p>
          </div>

          {error && (
            <div className="mb-4 px-4 py-3 rounded-lg text-sm" style={{ backgroundColor: "rgba(224,32,32,0.1)", color: "#e02020", border: "1px solid rgba(224,32,32,0.2)" }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSignIn} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--color-silver)" }}>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
                className="w-full px-4 py-3 rounded-lg text-sm outline-none transition-all"
                style={{
                  backgroundColor: "var(--color-surface2)",
                  border: "1px solid var(--color-border)",
                  color: "var(--color-white)",
                }}
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
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full px-4 py-3 rounded-lg text-sm outline-none transition-all pr-11"
                  style={{
                    backgroundColor: "var(--color-surface2)",
                    border: "1px solid var(--color-border)",
                    color: "var(--color-white)",
                  }}
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
              className="w-full py-3.5 rounded-lg font-semibold text-white transition-all disabled:opacity-60 red-glow"
              style={{ backgroundColor: "var(--color-red)" }}
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <p className="text-sm text-center mt-6" style={{ color: "var(--color-muted)" }}>
            Don't have an account?{" "}
            <Link to="/sign-up">
              <span className="font-semibold hover:underline" style={{ color: "var(--color-red)" }}>Sign up</span>
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
