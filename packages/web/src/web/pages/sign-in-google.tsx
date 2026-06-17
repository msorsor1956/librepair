import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { authClient, captureToken } from "../lib/auth";
import { ArrowLeft } from "lucide-react";
import { Link } from "wouter";

export default function SignInGooglePage() {
  const [, navigate] = useLocation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleGoogle = async () => {
    setLoading(true);
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
            setLoading(false);
          },
        }
      );
    } catch (e: any) {
      setError(e.message ?? "Google sign-in unavailable. Check back later.");
      setLoading(false);
    }
  };

  useEffect(() => {
    handleGoogle();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-grid" style={{ backgroundColor: "var(--color-bg)" }}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm text-center">
        <div className="glass rounded-2xl p-8">
          <Link to="/">
            <button className="flex items-center gap-2 text-sm mb-6 hover:text-white transition-colors" style={{ color: "var(--color-muted)" }}>
              <ArrowLeft size={14} /> Back
            </button>
          </Link>

          {error ? (
            <>
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: "rgba(224,32,32,0.15)" }}>
                <span className="text-2xl">!</span>
              </div>
              <h2 className="text-xl font-bold mb-2" style={{ fontFamily: "Rajdhani" }}>Google Sign-In Failed</h2>
              <p className="text-sm mb-6" style={{ color: "var(--color-muted)" }}>{error}</p>
              <button
                onClick={handleGoogle}
                className="w-full py-3.5 rounded-xl font-semibold text-white red-glow"
                style={{ backgroundColor: "var(--color-red)" }}
              >
                Try Again
              </button>
              <p className="text-xs mt-4" style={{ color: "var(--color-muted)" }}>
                Google OAuth requires valid credentials configured in the environment.
              </p>
            </>
          ) : (
            <>
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: "rgba(255,255,255,0.06)" }}>
                <GoogleIcon />
              </div>
              <h2 className="text-xl font-bold mb-2" style={{ fontFamily: "Rajdhani" }}>Connecting to Google</h2>
              <p className="text-sm" style={{ color: "var(--color-muted)" }}>You'll be redirected to Google to sign in...</p>
              <div className="mt-6 flex justify-center gap-1">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: "var(--color-red)" }}
                    animate={{ scale: [1, 1.4, 1], opacity: [0.4, 1, 0.4] }}
                    transition={{ duration: 1.2, delay: i * 0.2, repeat: Infinity }}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  );
}
