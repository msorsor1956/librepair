import { Route, Switch } from "wouter";
import { Provider } from "./components/provider";
import { AgentFeedback } from "@runablehq/website-runtime";

import IndexPage from "./pages/index";
import WelcomePage from "./pages/welcome";
import SignInPage from "./pages/sign-in";
import SignUpPage from "./pages/sign-up";
import SignInGooglePage from "./pages/sign-in-google";
import SignInPhonePage from "./pages/sign-in-phone";
import SignUpPhonePage from "./pages/sign-up-phone";
import ForgotPasswordPage from "./pages/forgot-password";
import DashboardPage from "./pages/dashboard";
import CustomerDashboardPage from "./pages/customer-dashboard";
import VehiclesPage from "./pages/vehicles";
import AppointmentsPage from "./pages/appointments";
import BookPage from "./pages/book";
import NotificationsPage from "./pages/notifications";
import ProfilePage from "./pages/profile";
import AdminPage from "./pages/admin";
import PaymentsPage from "./pages/payments";
import MechanicPage from "./pages/mechanic";
import CarsForSalePage from "./pages/cars-for-sale";

function App() {
  return (
    <Provider>
      <Switch>
        {/* Public */}
        <Route path="/" component={WelcomePage} />
        <Route path="/home" component={IndexPage} />
        <Route path="/sign-in" component={SignInPage} />
        <Route path="/sign-up" component={SignUpPage} />
        <Route path="/sign-in/google" component={SignInGooglePage} />
        <Route path="/sign-up/google" component={SignInGooglePage} />
        <Route path="/sign-in/phone" component={SignInPhonePage} />
        <Route path="/sign-up/phone" component={SignUpPhonePage} />
        <Route path="/forgot-password" component={ForgotPasswordPage} />

        {/* Customer */}
        <Route path="/customer/dashboard" component={CustomerDashboardPage} />

        {/* Admin / Staff */}
        <Route path="/dashboard" component={DashboardPage} />
        <Route path="/dashboard/vehicles" component={VehiclesPage} />
        <Route path="/dashboard/appointments" component={AppointmentsPage} />
        <Route path="/dashboard/appointments/:id" component={AppointmentsPage} />
        <Route path="/dashboard/payments" component={PaymentsPage} />
        <Route path="/dashboard/notifications" component={NotificationsPage} />
        <Route path="/book" component={BookPage} />
        <Route path="/profile" component={ProfilePage} />
        <Route path="/admin" component={AdminPage} />
        <Route path="/mechanic" component={MechanicPage} />
        <Route path="/cars-for-sale" component={CarsForSalePage} />
      </Switch>
      {import.meta.env.DEV && <AgentFeedback />}
    </Provider>
  );
}

export default App;
