import Header from "./components/user/Header";
import Footer from "./components/user/Footer";
import "./assets/styles/main.scss";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import Home from "./pages/user/Home";
import Login from "./pages/user/Login";
import Register from "./pages/user/Register";
import Tours from "./pages/user/Tours";
import TourDetail from "./pages/user/TourDetail";
import About from "./pages/user/About";
import Contact from "./pages/user/Contact";
import CheckoutPage from "./components/user/CheckoutPage";
import PaymentSuccess from "./components/user/CheckoutPage/PaymentSuccess";
import ScrollToTop from "./components/common/ScrollToTop";
import AdminLayout from "./layouts/AdminLayout";
import Dashboard from "./pages/admin/Dashboard";
import Users from "./pages/admin/Users";
import AdminTours from "./pages/admin/Tours";
import TourSchedules from "./pages/admin/TourSchedules";
import Bookings from "./pages/admin/Bookings";
import Payments from "./pages/admin/Payments";
import Reviews from "./pages/admin/Reviews";
import Itineraries from "./pages/admin/Itineraries";
import AdminChat from "./pages/admin/Chat";

import ChatboxLogin from "./pages/chatbox/Login";

import ChatWidget from "./components/user/ChatWidget";

import { getAuthUser } from "./utils/authStorage";

function AdminRoute({ children }) {
  const user = getAuthUser();
  if (!user || user.role !== "admin") {
    return <Navigate to="/login" replace />;
  }

  return children;
}

function ChatboxRoute({ children }) {
  const user = getAuthUser();
  if (!user || (user.role !== "admin" && user.role !== "chatbox")) {
    return <Navigate to="/chatbox/login" replace />;
  }

  return children;
}

function UserRoute({ children }) {
  const user = getAuthUser();
  if (user?.role === "admin") {
    return <Navigate to="/admin/dashboard" replace />;
  }

  if (user?.role === "chatbox") {
    return <Navigate to="/chatbox" replace />;
  }

  return children;
}

function App() {
  const location = useLocation();
  const isAdminPath = location.pathname.startsWith("/admin");
  const isChatboxPath = location.pathname.startsWith("/chatbox");
  const isShellPath = isAdminPath || isChatboxPath;
  const isAuthPath = location.pathname === "/login" || location.pathname === "/register" || location.pathname === "/chatbox/login";

  return (
    <>
      {!isShellPath && <Header />}
      <ScrollToTop />
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
              <Home />
            </UserRoute>
          }
        />
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

        <Route path="/chatbox/login" element={<ChatboxLogin />} />
        <Route
          path="/chatbox"
          element={
            <ChatboxRoute>
              <AdminChat />
            </ChatboxRoute>
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
          <Route path="reviews" element={<Reviews />} />
          <Route path="chat" element={<Navigate to="/chatbox" replace />} />
        </Route>
      </Routes>
      {!isShellPath && !isAuthPath && <ChatWidget />}
      {!isShellPath && <Footer />}
    </>
  );
}

export default App;
