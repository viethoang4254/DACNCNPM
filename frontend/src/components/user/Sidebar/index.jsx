import { NavLink, useNavigate } from "react-router-dom";
import { clearAuthSession, getAuthUser } from "../../../utils/authStorage";
import "./Sidebar.scss";

const navItems = [
  {
    id: "profile",
    to: "/info-user",
    icon: "👤",
    label: "Thông tin cá nhân",
    end: true,
  },
  {
    id: "bookings",
    to: "/info-user/bookings",
    icon: "📜",
    label: "Lịch sử đặt tour",
  },
  {
    id: "password",
    to: "/info-user/change-password",
    icon: "🔒",
    label: "Đổi mật khẩu",
  },
];

function Sidebar() {
  const navigate = useNavigate();
  const authUser = getAuthUser();

  const handleLogout = () => {
    clearAuthSession();
    navigate("/login", { replace: true });
  };

  return (
    <div className="user-sidebar">
      <div className="user-sidebar__header">
        <p className="user-sidebar__title">Tài khoản của bạn</p>
        <p className="user-sidebar__subtitle">{authUser?.ho_ten || "Khách hàng"}</p>
      </div>

      <nav className="user-sidebar__nav" aria-label="User profile navigation">
        {navItems.map((item) => (
          <NavLink
            key={item.id}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `user-sidebar__link ${isActive ? "is-active" : ""}`
            }
          >
            <span className="user-sidebar__icon" aria-hidden="true">
              {item.icon}
            </span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <button
        type="button"
        className="user-sidebar__logout"
        onClick={handleLogout}
      >
        Đăng xuất
      </button>
    </div>
  );
}

export default Sidebar;
