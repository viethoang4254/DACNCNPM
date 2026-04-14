import { Suspense, lazy } from "react";
import Header from "./components/user/Header";
import Footer from "./components/user/Footer";
import "./assets/styles/main.scss";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import ScrollToTop from "./components/common/ScrollToTop";
import ChatWidget from "./components/common/ChatWidget";

import { getAuthUser } from "./utils/authStorage";

// Route-level code splitting: only load each page bundle when route is visited.
const Home = lazy(() => import("./pages/user/Home"));
const Login = lazy(() => import("./pages/user/Login"));
const Register = lazy(() => import("./pages/user/Register"));
const Tours = lazy(() => import("./pages/user/Tours"));
const TourDetail = lazy(() => import("./pages/user/TourDetail"));
const TourHistory = lazy(() => import("./pages/user/TourHistory"));
const About = lazy(() => import("./pages/user/About"));
const Contact = lazy(() => import("./pages/user/Contact"));
const CheckoutPage = lazy(() => import("./components/user/CheckoutPage"));
const PaymentSuccess = lazy(
  () => import("./components/user/CheckoutPage/PaymentSuccess"),
);
const AdminLayout = lazy(() => import("./layouts/AdminLayout"));
const Dashboard = lazy(() => import("./pages/admin/Dashboard"));
const Users = lazy(() => import("./pages/admin/Users"));
const AdminTours = lazy(() => import("./pages/admin/Tours"));
const TourSchedules = lazy(() => import("./pages/admin/TourSchedules"));
const Bookings = lazy(() => import("./pages/admin/Bookings"));
const Payments = lazy(() => import("./pages/admin/Payments"));
const Reviews = lazy(() => import("./pages/admin/Reviews"));
const Itineraries = lazy(() => import("./pages/admin/Itineraries"));
const AdminWarnings = lazy(() => import("./pages/admin/AdminWarnings"));
const Refunds = lazy(() => import("./pages/admin/Refunds"));
const PopupBanners = lazy(() => import("./pages/admin/PopupBanners"));
const AdminChat = lazy(() => import("./pages/admin/AdminChat"));
const UserLayout = lazy(() => import("./components/user/UserLayout"));
const InfoUser = lazy(() => import("./pages/user/InfoUser"));
const UserBookingHistory = lazy(() => import("./pages/user/BookingHistory"));
const ChangePassword = lazy(() => import("./pages/user/ChangePassword"));

const ROUTE_FALLBACK = (
  <main style={{ minHeight: "50vh", display: "grid", placeItems: "center" }}>
    Đang tải trang...
  </main>
);

function AdminRoute({ children }) {
  const user = getAuthUser();
  if (!user || user.role !== "admin") {
    return <Navigate to="/login" replace />;
  }

  return children;
}

function UserRoute({ children }) {
  const user = getAuthUser();
  if (user?.role === "admin") {
    return <Navigate to="/admin/dashboard" replace />;
  }

  return children;
}

function CustomerAuthRoute({ children }) {
  const user = getAuthUser();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role === "admin") {
    return <Navigate to="/admin/dashboard" replace />;
  }

  return children;
}

function App() {
  const location = useLocation();
  const isAdminPath = location.pathname.startsWith("/admin");
  const isAuthPath = location.pathname === "/login" || location.pathname === "/register";

  return (
    <>
      {!isAdminPath && <Header />}
      <ScrollToTop />
      <Suspense fallback={ROUTE_FALLBACK}>
        <Routes>
          <Route
            path="/"
            element={
              <UserRoute>
                <Home />
              </UserRoute>
            }
          />
          <Route
            path="/customer"
            element={
              <UserRoute>
                <Navigate to="/info-user" replace />
              </UserRoute>
            }
          />
          <Route
            path="/info-user"
            element={
              <CustomerAuthRoute>
                <UserLayout />
              </CustomerAuthRoute>
            }
          >
            <Route index element={<InfoUser />} />
            <Route path="bookings" element={<UserBookingHistory />} />
            <Route path="change-password" element={<ChangePassword />} />
          </Route>
          <Route
            path="/login"
            element={
              <UserRoute>
                <Login />
              </UserRoute>
            }
          />
          <Route
            path="/register"
            element={
              <UserRoute>
                <Register />
              </UserRoute>
            }
          />
          <Route
            path="/tours"
            element={
              <UserRoute>
                <Tours />
              </UserRoute>
            }
          />
          <Route
            path="/tours/:id"
            element={
              <UserRoute>
                <TourDetail />
              </UserRoute>
            }
          />
          <Route
            path="/tour-history"
            element={
              <UserRoute>
                <TourHistory />
              </UserRoute>
            }
          />
          <Route
            path="/about"
            element={
              <UserRoute>
                <About />
              </UserRoute>
            }
          />
          <Route
            path="/contact"
            element={
              <UserRoute>
                <Contact />
              </UserRoute>
            }
          />
          <Route
            path="/checkout/:bookingId"
            element={
              <UserRoute>
                <CheckoutPage />
              </UserRoute>
            }
          />
          <Route
            path="/payment-success"
            element={
              <UserRoute>
                <PaymentSuccess />
              </UserRoute>
            }
          />
          <Route
            path="/payment-success/:bookingId"
            element={
              <UserRoute>
                <PaymentSuccess />
              </UserRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AdminLayout />
              </AdminRoute>
            }
          >
            <Route index element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="users" element={<Users />} />
            <Route path="tours" element={<AdminTours />} />
            <Route path="schedules" element={<TourSchedules />} />
            <Route path="itineraries" element={<Itineraries />} />
            <Route path="bookings" element={<Bookings />} />
            <Route path="payments" element={<Payments />} />
            <Route path="refunds" element={<Refunds />} />
            <Route path="reviews" element={<Reviews />} />
            <Route path="warnings" element={<AdminWarnings />} />
            <Route path="popup-banners" element={<PopupBanners />} />
            <Route path="chat" element={<AdminChat />} />
          </Route>
        </Routes>
      </Suspense>

      {!isAdminPath && !isAuthPath && <ChatWidget />}
      {!isAdminPath && <Footer />}
    </>
  );
}

export default App;
