import { Link } from "wouter";
import { motion } from "framer-motion";
import { Mail, Phone, Chrome, UserPlus, LogIn } from "lucide-react";

export default function WelcomePage() {
  const hasGoogle = !!(import.meta.env.VITE_GOOGLE_CLIENT_ID || true); // show always, gracefully fail

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-grid relative overflow-hidden" style={{ backgroundColor: "var(--color-bg)" }}>
      {/* Background glows */}
      <div className="absolute top-[-100px] left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full opacity-10 pointer-events-none" style={{ background: "radial-gradient(circle, #e02020, transparent 70%)" }} />
      <div className="absolute bottom-[-80px] right-[-80px] w-[300px] h-[300px] rounded-full opacity-5 pointer-events-none" style={{ background: "radial-gradient(circle, #e02020, transparent 70%)" }} />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-sm"
      >
        {/* Logo + branding */}
        <div className="text-center mb-10">
          <motion.img
            src="/logo.png"
            alt="LIBrepair"
            className="h-16 w-auto mx-auto mb-4"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.5 }}
          />
          <h1 className="text-4xl font-bold mb-2" style={{ fontFamily: "Rajdhani" }}>LIBrepair</h1>
          <p className="text-sm" style={{ color: "var(--color-muted)" }}>Premium Automotive Repair &amp; Maintenance</p>
        </div>

        <div className="glass rounded-2xl p-7 space-y-3">
          <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: "var(--color-muted)" }}>Sign In</p>

          {/* Google */}
          <Link to="/sign-in/google">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full flex items-center justify-center gap-3 py-3.5 rounded-xl font-semibold text-sm transition-all border"
              style={{ backgroundColor: "var(--color-surface2)", borderColor: "var(--color-border)", color: "var(--color-white)" }}
            >
              <GoogleIcon />
              Continue with Google
            </motion.button>
          </Link>

          {/* Email */}
          <Link to="/sign-in">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full flex items-center justify-center gap-3 py-3.5 rounded-xl font-semibold text-sm transition-all border"
              style={{ backgroundColor: "var(--color-surface2)", borderColor: "var(--color-border)", color: "var(--color-white)" }}
            >
              <Mail size={18} />
              Sign In with Email
            </motion.button>
          </Link>

          {/* Phone */}
          <Link to="/sign-in/phone">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full flex items-center justify-center gap-3 py-3.5 rounded-xl font-semibold text-sm transition-all border"
              style={{ backgroundColor: "var(--color-surface2)", borderColor: "var(--color-border)", color: "var(--color-white)" }}
            >
              <Phone size={18} />
              Sign In with Phone Number
            </motion.button>
          </Link>

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t" style={{ borderColor: "var(--color-border)" }} /></div>
            <div className="relative flex justify-center text-xs px-2" style={{ color: "var(--color-muted)" }}><span style={{ backgroundColor: "transparent" }}>or</span></div>
          </div>

          <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: "var(--color-muted)" }}>Create Account</p>

          {/* Google signup */}
          <Link to="/sign-up/google">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full flex items-center justify-center gap-3 py-3.5 rounded-xl font-semibold text-sm transition-all"
              style={{ backgroundColor: "var(--color-red)", color: "white" }}
            >
              <GoogleIcon white />
              Continue with Google
            </motion.button>
          </Link>

          {/* Email signup */}
          <Link to="/sign-up">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full flex items-center justify-center gap-3 py-3.5 rounded-xl font-semibold text-sm transition-all border"
              style={{ borderColor: "var(--color-red)", color: "var(--color-red)" }}
            >
              <Mail size={18} />
              Register with Email Address
            </motion.button>
          </Link>

          {/* Phone signup */}
          <Link to="/sign-up/phone">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full flex items-center justify-center gap-3 py-3.5 rounded-xl font-semibold text-sm transition-all border"
              style={{ borderColor: "var(--color-red)", color: "var(--color-red)" }}
            >
              <Phone size={18} />
              Register with Phone Number
            </motion.button>
          </Link>
        </div>

        <p className="text-xs text-center mt-6" style={{ color: "var(--color-muted)" }}>
          By continuing, you agree to our{" "}
          <Link to="/terms"><span className="underline cursor-pointer" style={{ color: "var(--color-silver)" }}>Terms</span></Link> and{" "}
          <Link to="/privacy"><span className="underline cursor-pointer" style={{ color: "var(--color-silver)" }}>Privacy Policy</span></Link>
        </p>
      </motion.div>
    </div>
  );
}

function GoogleIcon({ white = false }: { white?: boolean }) {
  if (white) return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  );
  return (
    <svg width="18" height="18" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  );
}
