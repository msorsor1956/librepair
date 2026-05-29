import { useState } from "react";
import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import { authClient, clearToken } from "../lib/auth";
import {
  LayoutDashboard, Car, Calendar, Bell, Settings, LogOut,
  Menu, X, Wrench, Users, BarChart3, ChevronRight, Shield
} from "lucide-react";

interface DashboardLayoutProps {
  children: React.ReactNode;
  title?: string;
}

export function DashboardLayout({ children, title }: DashboardLayoutProps) {
  const { data: session } = authClient.useSession();
  const [location, navigate] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleSignOut = async () => {
    await authClient.signOut();
    clearToken();
    navigate("/");
  };

  const customerLinks = [
    { href: "/dashboard", icon: <LayoutDashboard size={18} />, label: "Overview" },
    { href: "/dashboard/vehicles", icon: <Car size={18} />, label: "My Vehicles" },
    { href: "/dashboard/appointments", icon: <Calendar size={18} />, label: "Appointments" },
    { href: "/book", icon: <Wrench size={18} />, label: "Book Service" },
    { href: "/dashboard/notifications", icon: <Bell size={18} />, label: "Notifications" },
    { href: "/profile", icon: <Settings size={18} />, label: "Settings" },
  ];

  const adminLinks = [
    { href: "/admin", icon: <LayoutDashboard size={18} />, label: "Overview" },
    { href: "/admin/users", icon: <Users size={18} />, label: "Users" },
    { href: "/admin/appointments", icon: <Calendar size={18} />, label: "Appointments" },
    { href: "/admin/analytics", icon: <BarChart3 size={18} />, label: "Analytics" },
  ];

  const role = (session?.user as any)?.role ?? "customer";
  const links = role === "admin" ? adminLinks : customerLinks;

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="p-6 flex items-center gap-3" style={{ borderBottom: "1px solid var(--color-border)" }}>
        <img src="/logo.png" alt="LIBrepair" className="h-8 w-auto" />
      </div>
      <nav className="flex-1 p-4 space-y-1">
        {links.map((link) => {
          const isActive = location === link.href;
          return (
            <Link key={link.href} to={link.href}>
              <div
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all cursor-pointer"
                style={{
                  backgroundColor: isActive ? "rgba(224,32,32,0.1)" : "transparent",
                  color: isActive ? "var(--color-red)" : "var(--color-silver)",
                  border: isActive ? "1px solid rgba(224,32,32,0.2)" : "1px solid transparent",
                }}
                onClick={() => setSidebarOpen(false)}
              >
                {link.icon}
                {link.label}
                {isActive && <ChevronRight size={14} className="ml-auto" />}
              </div>
            </Link>
          );
        })}
      </nav>
      <div className="p-4" style={{ borderTop: "1px solid var(--color-border)" }}>
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg mb-2" style={{ backgroundColor: "var(--color-surface2)" }}>
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ backgroundColor: "var(--color-red)" }}>
            {session?.user?.name?.[0]?.toUpperCase() ?? "U"}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium truncate">{session?.user?.name}</div>
            <div className="text-xs truncate capitalize" style={{ color: "var(--color-muted)" }}>{role}</div>
          </div>
        </div>
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all hover:bg-white/5"
          style={{ color: "var(--color-muted)" }}
        >
          <LogOut size={16} />
          Sign Out
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: "var(--color-bg)" }}>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-60 shrink-0" style={{ backgroundColor: "var(--color-surface)", borderRight: "1px solid var(--color-border)" }}>
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <motion.div
            initial={{ x: -240 }}
            animate={{ x: 0 }}
            className="w-60 flex flex-col"
            style={{ backgroundColor: "var(--color-surface)", borderRight: "1px solid var(--color-border)" }}
          >
            <SidebarContent />
          </motion.div>
          <div className="flex-1" onClick={() => setSidebarOpen(false)} />
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Topbar */}
        <div className="h-16 flex items-center justify-between px-6" style={{ backgroundColor: "var(--color-surface)", borderBottom: "1px solid var(--color-border)" }}>
          <div className="flex items-center gap-3">
            <button className="md:hidden" onClick={() => setSidebarOpen(true)} style={{ color: "var(--color-white)" }}>
              <Menu size={20} />
            </button>
            {title && <h1 className="text-xl font-bold" style={{ fontFamily: "Rajdhani" }}>{title}</h1>}
          </div>
          <div className="flex items-center gap-3">
            <Link to="/dashboard/notifications">
              <button className="w-9 h-9 flex items-center justify-center rounded-lg transition-colors hover:bg-white/5" style={{ color: "var(--color-silver)" }}>
                <Bell size={18} />
              </button>
            </Link>
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ backgroundColor: "var(--color-red)" }}>
              {session?.user?.name?.[0]?.toUpperCase() ?? "U"}
            </div>
          </div>
        </div>

        {/* Page Content */}
        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
