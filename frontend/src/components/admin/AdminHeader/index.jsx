import { useMemo } from "react";
import { FaSignOutAlt } from "react-icons/fa";
import { useLocation, useNavigate } from "react-router-dom";
import { clearAuthSession, getAuthUser } from "../../../utils/authStorage";

const titleMap = {
  "/admin/dashboard": { label: "Dashboard", sub: "Tổng quan hệ thống" },
  "/admin/users":     { label: "Users",     sub: "Quản lý tài khoản người dùng" },
  "/admin/tours":     { label: "Tours",     sub: "Danh sách tour du lịch" },
  "/admin/bookings":  { label: "Bookings",  sub: "Quản lý đặt tour" },
  "/admin/payments":  { label: "Payments",  sub: "Thống kê thanh toán" },
  "/admin/reviews":   { label: "Reviews",   sub: "Quản lý đánh giá" },
};

function AdminHeader() {
  const location  = useLocation();
  const navigate  = useNavigate();
  const user      = getAuthUser();

  const page = useMemo(
    () => titleMap[location.pathname] || { label: "Admin", sub: "" },
    [location.pathname]
  );

  const initials = (user?.ho_ten || "A")
    .split(" ")
    .filter(Boolean)
    .slice(-2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  function handleLogout() {
    clearAuthSession();
    navigate("/login", { replace: true });
  }

  return (
    <header className="admin-header">
      <div className="admin-header__title">
        <h1>{page.label}</h1>
        {page.sub && <p>{page.sub}</p>}
      </div>

      <div className="admin-header__actions">
        <div className="admin-header__user">
          <div className="admin-header__avatar">{initials}</div>
          <div className="admin-header__user-info">
            <strong>{user?.ho_ten || "Admin"}</strong>
            <span>{user?.email || ""}</span>
          </div>
        </div>
        <button type="button" className="admin-btn admin-btn--ghost" onClick={handleLogout}>
          <FaSignOutAlt />
          Logout
        </button>
      </div>
    </header>
  );
}

export default AdminHeader;
