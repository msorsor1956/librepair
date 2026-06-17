import { Link, useLocation } from "wouter";
import { useState } from "react";
import type { AdminUser } from "../App";
import {
  LayoutDashboard, Users, CreditCard, Car, Bell, Megaphone,
  CalendarCheck, LogOut, Menu, X, ChevronRight, Shield,
  Wrench, Star, Clock, FileText, ChevronDown,
} from "lucide-react";

type NavItem = { href: string; label: string; icon: any };
type NavGroup = { label: string; icon: any; items: NavItem[] };

const navGroups: (NavItem | NavGroup)[] = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  {
    label: "People",
    icon: Users,
    items: [
      { href: "/users", label: "All Users", icon: Users },
      { href: "/mechanics", label: "Mechanics", icon: Wrench },
    ],
  },
  {
    label: "Operations",
    icon: CalendarCheck,
    items: [
      { href: "/appointments", label: "Appointments", icon: CalendarCheck },
      { href: "/reminders", label: "Reminders", icon: Clock },
      { href: "/reviews", label: "Reviews", icon: Star },
    ],
  },
  {
    label: "Catalog",
    icon: Wrench,
    items: [
      { href: "/services", label: "Services", icon: Wrench },
      { href: "/vehicles", label: "Vehicles", icon: Car },
      { href: "/inventory", label: "Car Inventory", icon: Car },
    ],
  },
  {
    label: "Finance",
    icon: CreditCard,
    items: [
      { href: "/payments", label: "Payments", icon: CreditCard },
      { href: "/invoices", label: "Invoices", icon: FileText },
    ],
  },
  {
    label: "Communicate",
    icon: Bell,
    items: [
      { href: "/notifications", label: "Notify Customers", icon: Bell },
      { href: "/announcements", label: "Announcements", icon: Megaphone },
    ],
  },
];

function isNavGroup(item: NavItem | NavGroup): item is NavGroup {
  return "items" in item;
}

function NavGroupItem({ group, location, setSidebarOpen }: {
  group: NavGroup; location: string; setSidebarOpen: (v: boolean) => void;
}) {
  const isActive = group.items.some(i => location === i.href || (i.href !== "/" && location.startsWith(i.href)));
  const [open, setOpen] = useState(isActive);
  const Icon = group.icon;

  return (
    <div>
      <div
        onClick={() => setOpen(o => !o)}
        style={{
          display: "flex", alignItems: "center", gap: 10, padding: "9px 12px",
          borderRadius: 8, marginBottom: 2, cursor: "pointer",
          background: isActive ? "rgba(224,32,32,0.06)" : "transparent",
          color: isActive ? "#e02020" : "#666",
        }}
        onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.03)"; }}
        onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = "transparent"; }}
      >
        <Icon size={15} />
        <span style={{ fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", flex: 1 }}>{group.label}</span>
        <ChevronDown size={12} style={{ transform: open ? "rotate(180deg)" : "rotate(0)", transition: "transform 0.2s" }} />
      </div>
      {open && (
        <div style={{ paddingLeft: 8 }}>
          {group.items.map(({ href, label, icon: IIcon }) => {
            const active = location === href || (href !== "/" && location.startsWith(href));
            return (
              <Link key={href} to={href} onClick={() => setSidebarOpen(false)}>
                <div style={{
                  display: "flex", alignItems: "center", gap: 10, padding: "8px 12px",
                  borderRadius: 7, marginBottom: 1, cursor: "pointer",
                  background: active ? "rgba(224,32,32,0.1)" : "transparent",
                  color: active ? "#e02020" : "#777",
                  transition: "all 0.15s",
                }}
                  onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.04)"; }}
                  onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                >
                  <IIcon size={14} />
                  <span style={{ fontSize: 13, fontWeight: 500 }}>{label}</span>
                  {active && <ChevronRight size={11} style={{ marginLeft: "auto" }} />}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function DashboardLayout({
  user, onLogout, children,
}: {
  user: AdminUser;
  onLogout: () => void;
  children: React.ReactNode;
}) {
  const [location] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const Sidebar = () => (
    <aside style={{
      width: 240, minHeight: "100vh", background: "#0d0d0d",
      borderRight: "1px solid rgba(255,255,255,0.06)",
      display: "flex", flexDirection: "column", flexShrink: 0,
    }}>
      {/* Brand */}
      <div style={{ padding: "24px 20px 20px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 34, height: 34, background: "rgba(224,32,32,0.15)", border: "1px solid rgba(224,32,32,0.3)",
            borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
          }}>
            <Shield size={16} color="#e02020" />
          </div>
          <div>
            <div style={{ fontFamily: "Rajdhani, sans-serif", fontSize: 16, fontWeight: 700, letterSpacing: 0.5 }}>LIBrepair</div>
            <div style={{ fontSize: 10, color: "#e02020", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" }}>Super Admin</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: "12px 10px", overflowY: "auto" }}>
        {navGroups.map((item, i) => {
          if (isNavGroup(item)) {
            return <NavGroupItem key={i} group={item} location={location} setSidebarOpen={setSidebarOpen} />;
          }
          const { href, label, icon: Icon } = item as NavItem;
          const active = location === href;
          return (
            <Link key={href} to={href} onClick={() => setSidebarOpen(false)}>
              <div style={{
                display: "flex", alignItems: "center", gap: 10, padding: "9px 12px",
                borderRadius: 8, marginBottom: 2, cursor: "pointer",
                background: active ? "rgba(224,32,32,0.1)" : "transparent",
                color: active ? "#e02020" : "#888",
                transition: "all 0.15s",
              }}
                onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.04)"; }}
                onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.background = "transparent"; }}
              >
                <Icon size={16} />
                <span style={{ fontSize: 13, fontWeight: 500 }}>{label}</span>
                {active && <ChevronRight size={12} style={{ marginLeft: "auto" }} />}
              </div>
            </Link>
          );
        })}
      </nav>

      {/* User */}
      <div style={{ padding: "14px 16px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
          <div style={{
            width: 32, height: 32, borderRadius: "50%", background: "#e02020",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 12, fontWeight: 700, color: "#fff", flexShrink: 0,
          }}>
            {user.name?.[0]?.toUpperCase() ?? "A"}
          </div>
          <div style={{ overflow: "hidden" }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: "#e5e5e5", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{user.name}</div>
            <div style={{ fontSize: 11, color: "#555", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{user.email}</div>
          </div>
        </div>
        <button onClick={onLogout} className="btn btn-ghost" style={{ width: "100%", justifyContent: "center", fontSize: 12 }}>
          <LogOut size={13} /> Sign Out
        </button>
      </div>
    </aside>
  );

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      {/* Desktop sidebar */}
      <div className="desktop-sidebar" style={{ display: "none" }}>
        <Sidebar />
      </div>
      <style>{`
        @media (min-width: 768px) { .desktop-sidebar { display: block !important; } .mobile-header { display: none !important; } }
      `}</style>

      {/* Mobile header */}
      <div className="mobile-header" style={{
        position: "fixed", top: 0, left: 0, right: 0, height: 56, zIndex: 100,
        background: "#0d0d0d", borderBottom: "1px solid rgba(255,255,255,0.07)",
        display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 16px",
      }}>
        <div style={{ fontFamily: "Rajdhani", fontSize: 18, fontWeight: 700 }}>LIBrepair Admin</div>
        <button onClick={() => setSidebarOpen(!sidebarOpen)} style={{ background: "none", border: "none", color: "#fff" }}>
          {sidebarOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div style={{ position: "fixed", inset: 0, zIndex: 200, display: "flex" }}>
          <div onClick={() => setSidebarOpen(false)} style={{ flex: 1, background: "rgba(0,0,0,0.6)" }} />
          <div style={{ width: 260, position: "absolute", left: 0, top: 0, bottom: 0, overflowY: "auto" }}>
            <Sidebar />
          </div>
        </div>
      )}

      {/* Main content */}
      <main style={{ flex: 1, overflow: "auto", paddingTop: 0 }}>
        <div style={{ paddingTop: 0 }} className="main-content">
          <style>{`@media (max-width: 767px) { .main-content { padding-top: 56px !important; } }`}</style>
          {children}
        </div>
      </main>
    </div>
  );
}
