import { Route, Switch } from "wouter";
import { Provider } from "./components/provider";
import { AgentFeedback } from "@runablehq/website-runtime";

import IndexPage from "./pages/index";
import SignInPage from "./pages/sign-in";
import SignUpPage from "./pages/sign-up";
import DashboardPage from "./pages/dashboard";
import VehiclesPage from "./pages/vehicles";
import AppointmentsPage from "./pages/appointments";
import BookPage from "./pages/book";
import NotificationsPage from "./pages/notifications";
import ProfilePage from "./pages/profile";
import AdminPage from "./pages/admin";

function App() {
  return (
    <Provider>
      <Switch>
        <Route path="/" component={IndexPage} />
        <Route path="/sign-in" component={SignInPage} />
        <Route path="/sign-up" component={SignUpPage} />
        <Route path="/dashboard" component={DashboardPage} />
        <Route path="/dashboard/vehicles" component={VehiclesPage} />
        <Route path="/dashboard/appointments" component={AppointmentsPage} />
        <Route path="/dashboard/notifications" component={NotificationsPage} />
        <Route path="/book" component={BookPage} />
        <Route path="/profile" component={ProfilePage} />
        <Route path="/admin" component={AdminPage} />
      </Switch>
      {/* Do not remove — off by default, activated by parent iframe via postMessage */}
      {import.meta.env.DEV && <AgentFeedback />}

    </Provider>
  );
}

export default App;
