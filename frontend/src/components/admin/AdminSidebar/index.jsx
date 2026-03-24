import {
  FaChartLine,
  FaUsers,
  FaMapMarkedAlt,
  FaBook,
  FaMoneyCheckAlt,
  FaStar,
  FaCompass,
  FaCalendarAlt,
  FaRoute,
  FaExclamationTriangle,
  FaUndo,
  FaBullhorn,
} from "react-icons/fa";
import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import apiClient from "../../../utils/apiClient";
import { getDaysLeftFromDateKey } from "../../../utils/dateOnly";
import "./AdminSidebar.scss";

const MIN_RATIO = 0.5;

const toRatio = (percentValue) => {
  const value = Number(percentValue || 0);
  if (!Number.isFinite(value)) return 0;
  if (value > 1) return value / 100;
  return value;
};

const resolveDaysLeft = (item) => {
  const computedDaysLeft = getDaysLeftFromDateKey(item?.start_date);
  if (Number.isFinite(computedDaysLeft)) return computedDaysLeft;

  const apiDaysLeft = Number(item?.days_left);
  if (Number.isFinite(apiDaysLeft)) return apiDaysLeft;

  return Number.POSITIVE_INFINITY;
};

const resolveScheduleStatus = (item, daysLeft) => {
  const ratio = toRatio(item?.percent);
  if (daysLeft < 0) return "completed";
  if (ratio >= MIN_RATIO) return "guaranteed";
  if (daysLeft === 0 && ratio < MIN_RATIO) return "cancelled";
  if (daysLeft <= 2 && ratio < MIN_RATIO) return "warning_critical";
  if (daysLeft <= 7 && ratio < MIN_RATIO) return "warning";
  return "open";
};

const menuItems = [
  { to: "/admin/dashboard", label: "Dashboard", icon: FaChartLine },
  { to: "/admin/users", label: "Users", icon: FaUsers },
  { to: "/admin/tours", label: "Tours", icon: FaMapMarkedAlt },
  { to: "/admin/schedules", label: "Schedules", icon: FaCalendarAlt },
  { to: "/admin/itineraries", label: "Itineraries", icon: FaRoute },
  { to: "/admin/bookings", label: "Bookings", icon: FaBook },
  { to: "/admin/payments", label: "Payments", icon: FaMoneyCheckAlt },
  { to: "/admin/refunds", label: "Refunds", icon: FaUndo },
  { to: "/admin/popup-banners", label: "Popups", icon: FaBullhorn },
  { to: "/admin/warnings", label: "Alerts", icon: FaExclamationTriangle },
  { to: "/admin/reviews", label: "Reviews", icon: FaStar },
];

function AdminSidebar() {
  const [alertCount, setAlertCount] = useState(0);

  useEffect(() => {
    let mounted = true;

    async function fetchAlertCount() {
      try {
        const response = await apiClient.get("/api/schedules/warning");
        if (!mounted) return;

        const list = Array.isArray(response?.data?.data)
          ? response.data.data
          : [];
        const matchedAlerts = list.filter((item) => {
          const daysLeft = resolveDaysLeft(item);
          const status = resolveScheduleStatus(item, daysLeft);
          return status === "warning" || status === "warning_critical";
        });

        setAlertCount(matchedAlerts.length);
      } catch {
        if (!mounted) return;
        setAlertCount(0);
      }
    }

    fetchAlertCount();

    const timer = setInterval(() => {
      fetchAlertCount();
    }, 12000);

    const handleFocus = () => {
      fetchAlertCount();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        fetchAlertCount();
      }
    };

    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      mounted = false;
      clearInterval(timer);
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  return (
    <aside className="admin-sidebar">
      <div className="admin-sidebar__brand">
        <div className="admin-sidebar__brand-row">
          <div className="admin-sidebar__brand-icon">
            <FaCompass />
          </div>
          <div>
            <h2>Tour Admin</h2>
            <p>VietXanh Travel</p>
          </div>
        </div>
      </div>

      <p className="admin-sidebar__section-label">Main Menu</p>

      <nav className="admin-sidebar__nav">
        {menuItems.map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to} className="admin-sidebar__link">
            <Icon className="admin-sidebar__icon" />
            <span>{label}</span>
            {to === "/admin/warnings" && (
              <span
                className={`admin-sidebar__warning-badge ${alertCount > 0 ? "is-alert" : ""}`}
                aria-label={`Tổng cảnh báo ${alertCount}`}
              >
                {alertCount}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="admin-sidebar__footer">v1.0.0 · Online Tour Booking</div>
    </aside>
  );
}

export default AdminSidebar;
