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

const resolveScheduleStatus = (item) => {
  const ratio = toRatio(item?.percent);
  const daysLeft = getDaysLeftFromDateKey(item?.start_date);

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
  { to: "/admin/warnings", label: "Cảnh báo", icon: FaExclamationTriangle },
  { to: "/admin/reviews", label: "Reviews", icon: FaStar },
];

function AdminSidebar() {
  const [warningCount, setWarningCount] = useState(0);

  useEffect(() => {
    let mounted = true;

    async function fetchWarningCount() {
      try {
        const response = await apiClient.get("/api/schedules/warning");
        if (!mounted) return;

        const list = Array.isArray(response?.data?.data)
          ? response.data.data
          : [];

        const nextCount = list.filter((item) => {
          const status = resolveScheduleStatus(item);
          return ["warning", "warning_critical"].includes(status);
        }).length;

        setWarningCount(nextCount);
      } catch {
        if (!mounted) return;
        setWarningCount(0);
      }
    }

    fetchWarningCount();
    const timer = setInterval(fetchWarningCount, 60000);

    return () => {
      mounted = false;
      clearInterval(timer);
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
                className={`admin-sidebar__warning-badge ${warningCount > 0 ? "is-alert" : ""}`}
                aria-label={`Tổng cảnh báo ${warningCount}`}
              >
                {warningCount}
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
