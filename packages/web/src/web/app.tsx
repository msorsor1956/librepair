import { Route, Switch } from "wouter";
import { Provider } from "./components/provider";
import { AgentFeedback } from "@runablehq/website-runtime";
import { AnnouncementBanner } from "./components/AnnouncementBanner";
import { ProtectedRoute } from "./components/protected-route";
import { AppSplash } from "./components/app-splash";

import IndexPage from "./pages/index";
import WelcomePage from "./pages/welcome";
import SignInPage from "./pages/sign-in";
import SignUpPage from "./pages/sign-up";
import SignInGooglePage from "./pages/sign-in-google";
import SignInPhonePage from "./pages/sign-in-phone";
import SignUpPhonePage from "./pages/sign-up-phone";
import ForgotPasswordPage from "./pages/forgot-password";
import ResetPasswordPage from "./pages/reset-password";
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
import VanForRentPage from "./pages/van-for-rent";
import ZohoBookingsPage from "./pages/zoho-bookings";
import { PrivacyPage, TermsPage, SupportPage, NotFoundPage } from "./pages/public-info";

function App() {
  return (
    <Provider>
      <AppSplash />
      <AnnouncementBanner />
      <Switch>
        {/* Public */}
        <Route path="/" component={IndexPage} />
        <Route path="/welcome" component={WelcomePage} />
        <Route path="/home" component={IndexPage} />
        <Route path="/sign-in" component={SignInPage} />
        <Route path="/sign-up" component={SignUpPage} />
        <Route path="/sign-in/google" component={SignInGooglePage} />
        <Route path="/sign-up/google" component={SignInGooglePage} />
        <Route path="/sign-in/phone" component={SignInPhonePage} />
        <Route path="/sign-up/phone" component={SignUpPhonePage} />
        <Route path="/forgot-password" component={ForgotPasswordPage} />
        <Route path="/reset-password" component={ResetPasswordPage} />

        {/* Customer */}
        <Route path="/customer/dashboard">{() => <ProtectedRoute><CustomerDashboardPage /></ProtectedRoute>}</Route>

        {/* Admin / Staff */}
        <Route path="/dashboard">{() => <ProtectedRoute><DashboardPage /></ProtectedRoute>}</Route>
        <Route path="/dashboard/vehicles">{() => <ProtectedRoute><VehiclesPage /></ProtectedRoute>}</Route>
        <Route path="/dashboard/appointments">{() => <ProtectedRoute><AppointmentsPage /></ProtectedRoute>}</Route>
        <Route path="/dashboard/appointments/:id">{() => <ProtectedRoute><AppointmentsPage /></ProtectedRoute>}</Route>
        <Route path="/dashboard/payments">{() => <ProtectedRoute><PaymentsPage /></ProtectedRoute>}</Route>
        <Route path="/dashboard/notifications">{() => <ProtectedRoute><NotificationsPage /></ProtectedRoute>}</Route>
        <Route path="/book">{() => <ProtectedRoute><BookPage /></ProtectedRoute>}</Route>
        <Route path="/profile">{() => <ProtectedRoute><ProfilePage /></ProtectedRoute>}</Route>
        <Route path="/admin">{() => <ProtectedRoute><AdminPage /></ProtectedRoute>}</Route>
        <Route path="/mechanic">{() => <ProtectedRoute><MechanicPage /></ProtectedRoute>}</Route>
        <Route path="/cars-for-sale" component={CarsForSalePage} />
        <Route path="/van-for-rent" component={VanForRentPage} />
        <Route path="/schedule" component={ZohoBookingsPage} />
        <Route path="/appointments/new" component={ZohoBookingsPage} />
        <Route path="/privacy" component={PrivacyPage} />
        <Route path="/terms" component={TermsPage} />
        <Route path="/support" component={SupportPage} />
        <Route component={NotFoundPage} />
      </Switch>
      {import.meta.env.DEV && <AgentFeedback />}
    </Provider>
  );
}

export default App;
