import { FaChartLine, FaUsers, FaMapMarkedAlt, FaBook, FaMoneyCheckAlt, FaStar, FaCompass, FaCalendarAlt, FaRoute } from "react-icons/fa";
import { NavLink } from "react-router-dom";
import "./AdminSidebar.scss";

const menuItems = [
  { to: "/admin/dashboard",  label: "Dashboard",  icon: FaChartLine },
  { to: "/admin/users",      label: "Users",      icon: FaUsers },
  { to: "/admin/tours",      label: "Tours",      icon: FaMapMarkedAlt },
  { to: "/admin/schedules",  label: "Schedules",  icon: FaCalendarAlt },
  { to: "/admin/itineraries", label: "Itineraries", icon: FaRoute },
  { to: "/admin/bookings",   label: "Bookings",   icon: FaBook },
  { to: "/admin/payments",   label: "Payments",   icon: FaMoneyCheckAlt },
  { to: "/admin/reviews",    label: "Reviews",    icon: FaStar },
];

function AdminSidebar() {
  return (
    <aside className="admin-sidebar">
      <div className="admin-sidebar__brand">
        <div className="admin-sidebar__brand-row">
          <div className="admin-sidebar__brand-icon">
            <FaCompass />
          </div>
          <div>
            <h2>Tour Admin</h2>
            <p>BestPrice Travel</p>
          </div>
        </div>
      </div>

      <p className="admin-sidebar__section-label">Main Menu</p>

      <nav className="admin-sidebar__nav">
        {menuItems.map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to} className="admin-sidebar__link">
            <Icon className="admin-sidebar__icon" />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="admin-sidebar__footer">v1.0.0 · Online Tour Booking</div>
    </aside>
  );
}

export default AdminSidebar;
