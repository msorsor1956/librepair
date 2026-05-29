import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import { authClient, clearToken } from "../lib/auth";
import { useState } from "react";
import { Menu, X, Bell, ChevronDown } from "lucide-react";

export function Navbar() {
  const { data: session } = authClient.useSession();
  const [, navigate] = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropOpen, setDropOpen] = useState(false);

  const handleSignOut = async () => {
    await authClient.signOut();
    clearToken();
    navigate("/");
  };

  const navLinks = [
    { href: "/#services", label: "Services" },
    { href: "/#pricing", label: "Pricing" },
    { href: "/#about", label: "About" },
    { href: "/#contact", label: "Contact" },
  ];

  return (
    <motion.nav
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="fixed top-0 left-0 right-0 z-50 h-[72px] flex items-center px-6 md:px-10"
      style={{ backgroundColor: "rgba(10,10,10,0.85)", backdropFilter: "blur(16px)", borderBottom: "1px solid var(--color-border)" }}
    >
      <div className="max-w-[1280px] mx-auto w-full flex items-center justify-between">
        {/* Logo */}
        <Link to="/">
          <div className="flex items-center gap-3 cursor-pointer">
            <img src="/logo1.png" alt="LIBrepair" className="h-10 w-auto" />
          </div>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <a key={link.href} href={link.href} className="text-sm font-medium transition-colors hover:text-white" style={{ color: "var(--color-silver)", fontFamily: "Poppins" }}>
              {link.label}
            </a>
          ))}
        </div>

        {/* Actions */}
        <div className="hidden md:flex items-center gap-4">
          {session ? (
            <div className="flex items-center gap-3">
              <Link to="/dashboard">
                <button className="text-sm px-4 py-2 rounded-md font-medium transition-colors" style={{ backgroundColor: "var(--color-surface2)", color: "var(--color-white)", border: "1px solid var(--color-border)" }}>
                  Dashboard
                </button>
              </Link>
              <div className="relative">
                <button
                  onClick={() => setDropOpen(!dropOpen)}
                  className="flex items-center gap-2 text-sm font-medium"
                  style={{ color: "var(--color-silver)" }}
                >
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: "var(--color-red)" }}>
                    {session.user?.name?.[0]?.toUpperCase() ?? "U"}
                  </div>
                  <ChevronDown size={14} />
                </button>
                {dropOpen && (
                  <div className="absolute right-0 top-full mt-2 w-44 rounded-lg py-1 z-50" style={{ backgroundColor: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
                    <Link to="/dashboard">
                      <div className="px-4 py-2 text-sm cursor-pointer hover:bg-white/5" style={{ color: "var(--color-white)" }}>Dashboard</div>
                    </Link>
                    <Link to="/profile">
                      <div className="px-4 py-2 text-sm cursor-pointer hover:bg-white/5" style={{ color: "var(--color-white)" }}>Profile</div>
                    </Link>
                    <div className="h-px my-1" style={{ backgroundColor: "var(--color-border)" }} />
                    <button onClick={handleSignOut} className="w-full text-left px-4 py-2 text-sm hover:bg-white/5" style={{ color: "#e02020" }}>
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <>
              <Link to="/sign-in">
                <button className="text-sm font-medium transition-colors hover:text-white" style={{ color: "var(--color-silver)" }}>
                  Sign In
                </button>
              </Link>
              <Link to="/sign-up">
                <button className="text-sm px-5 py-2.5 rounded-md font-semibold transition-all hover:opacity-90 red-glow" style={{ backgroundColor: "var(--color-red)", color: "white" }}>
                  Get Started
                </button>
              </Link>
            </>
          )}
        </div>

        {/* Mobile menu toggle */}
        <button className="md:hidden" style={{ color: "var(--color-white)" }} onClick={() => setMenuOpen(!menuOpen)}>
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-full left-0 right-0 py-4 px-6 md:hidden"
          style={{ backgroundColor: "var(--color-surface)", borderBottom: "1px solid var(--color-border)" }}
        >
          <div className="flex flex-col gap-4">
            {navLinks.map((link) => (
              <a key={link.href} href={link.href} onClick={() => setMenuOpen(false)} className="text-sm font-medium" style={{ color: "var(--color-silver)" }}>
                {link.label}
              </a>
            ))}
            <div className="h-px" style={{ backgroundColor: "var(--color-border)" }} />
            {session ? (
              <>
                <Link to="/dashboard" onClick={() => setMenuOpen(false)}>
                  <span className="text-sm font-medium" style={{ color: "var(--color-white)" }}>Dashboard</span>
                </Link>
                <button onClick={handleSignOut} className="text-sm text-left font-medium" style={{ color: "var(--color-red)" }}>Sign Out</button>
              </>
            ) : (
              <>
                <Link to="/sign-in" onClick={() => setMenuOpen(false)}>
                  <span className="text-sm font-medium" style={{ color: "var(--color-white)" }}>Sign In</span>
                </Link>
                <Link to="/sign-up" onClick={() => setMenuOpen(false)}>
                  <span className="text-sm font-medium" style={{ color: "var(--color-red)" }}>Get Started</span>
                </Link>
              </>
            )}
          </div>
        </motion.div>
      )}
    </motion.nav>
  );
}
