import { useMemo } from "react";
import { FaSignOutAlt } from "react-icons/fa";
import { useLocation, useNavigate } from "react-router-dom";
import { clearAuthSession, getAuthUser } from "../../../utils/authStorage";
import "./AdminHeader.scss";

const titleMap = {
  "/admin/dashboard": { label: "Bảng điều khiển", sub: "Tổng quan hệ thống" },
  "/admin/users": { label: "Người dùng", sub: "Quản lý tài khoản người dùng" },
  "/admin/tours": { label: "Tour", sub: "Danh sách tour du lịch" },
  "/admin/schedules": {
    label: "Lịch khởi hành",
    sub: "Quản lý lịch khởi hành",
  },
  "/admin/itineraries": { label: "Lịch trình", sub: "Quản lý lịch trình" },
  "/admin/bookings": { label: "Đặt tour", sub: "Quản lý đơn đặt tour" },
  "/admin/payments": { label: "Thanh toán", sub: "Thống kê thanh toán" },
  "/admin/reviews": { label: "Đánh giá", sub: "Quản lý đánh giá" },
};

function AdminHeader() {
  const location = useLocation();
  const navigate = useNavigate();
  const user = getAuthUser();

  const page = useMemo(
    () => titleMap[location.pathname] || { label: "Quản trị", sub: "" },
    [location.pathname],
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
            <strong>{user?.ho_ten || "Quản trị viên"}</strong>
            <span>{user?.email || ""}</span>
          </div>
        </div>
        <button
          type="button"
          className="admin-btn admin-btn--ghost"
          onClick={handleLogout}
        >
          <FaSignOutAlt />
          Đăng xuất
        </button>
      </div>
    </header>
  );
}

export default AdminHeader;
