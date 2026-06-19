import { Route, Switch, useLocation } from "wouter";
import { useEffect, useState } from "react";
import { getSession } from "./lib/auth";
import { getToken } from "./lib/api";
import LoginPage from "./pages/Login";
import DashboardLayout from "./components/DashboardLayout";
import StatsPage from "./pages/Stats";
import UsersPage from "./pages/Users";
import PaymentsPage from "./pages/Payments";
import InventoryPage from "./pages/Inventory";
import NotificationsPage from "./pages/Notifications";
import AnnouncementsPage from "./pages/Announcements";
import AppointmentsPage from "./pages/Appointments";
import VehiclesPage from "./pages/Vehicles";
import ServicesPage from "./pages/Services";
import MechanicsPage from "./pages/Mechanics";
import ReviewsPage from "./pages/Reviews";
import RemindersPage from "./pages/Reminders";
import InvoicesPage from "./pages/Invoices";
import ReportsPage from "./pages/Reports";
import RentalsPage from "./pages/Rentals";

export type AdminUser = { id: string; email: string; name: string; role: string };

function App() {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [, navigate] = useLocation();

  useEffect(() => {
    if (!getToken()) { setLoading(false); return; }
    getSession()
      .then(s => {
        if (s?.user) setUser(s.user);
        else setLoading(false);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", background: "#0a0a0a" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: 40, height: 40, border: "3px solid #333", borderTop: "3px solid #e02020", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 12px" }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          <p style={{ color: "#555", fontSize: 13 }}>Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) return <LoginPage onLogin={setUser} />;

  return (
    <DashboardLayout user={user} onLogout={() => { setUser(null); navigate("/"); }}>
      <Switch>
        <Route path="/" component={StatsPage} />
        <Route path="/users" component={UsersPage} />
        <Route path="/appointments" component={AppointmentsPage} />
        <Route path="/payments" component={PaymentsPage} />
        <Route path="/inventory" component={InventoryPage} />
        <Route path="/vehicles" component={VehiclesPage} />
        <Route path="/services" component={ServicesPage} />
        <Route path="/mechanics" component={MechanicsPage} />
        <Route path="/reviews" component={ReviewsPage} />
        <Route path="/reminders" component={RemindersPage} />
        <Route path="/invoices" component={InvoicesPage} />
        <Route path="/reports" component={ReportsPage} />
        <Route path="/rentals" component={RentalsPage} />
        <Route path="/notifications" component={NotificationsPage} />
        <Route path="/announcements" component={AnnouncementsPage} />
        <Route>
          <div style={{ padding: 40, textAlign: "center", color: "#555" }}>Page not found</div>
        </Route>
      </Switch>
    </DashboardLayout>
  );
}

export default App;
