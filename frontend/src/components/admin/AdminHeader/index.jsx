import { useEffect, useMemo, useRef, useState } from "react";
import { FaBell, FaSignOutAlt } from "react-icons/fa";
import { useLocation, useNavigate } from "react-router-dom";
import { clearAuthSession, getAuthUser } from "../../../utils/authStorage";
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
} from "../../../services/notificationService";
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
  "/admin/refunds": { label: "Hoàn tiền", sub: "Xử lý yêu cầu hoàn tiền" },
  "/admin/reviews": { label: "Đánh giá", sub: "Quản lý đánh giá" },
};

function AdminHeader() {
  const location = useLocation();
  const navigate = useNavigate();
  const user = getAuthUser();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const notificationWrapRef = useRef(null);

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

  useEffect(() => {
    let mounted = true;

    const fetchUnreadCount = async () => {
      try {
        const count = await getUnreadCount();
        if (!mounted) return;
        setUnreadCount(Number(count || 0));
      } catch {
        if (!mounted) return;
        setUnreadCount(0);
      }
    };

    fetchUnreadCount();
    const timer = setInterval(fetchUnreadCount, 12000);

    return () => {
      mounted = false;
      clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    if (!open) return;

    let mounted = true;

    const fetchNotificationList = async () => {
      try {
        const list = await getNotifications();
        if (!mounted) return;
        setNotifications(Array.isArray(list) ? list : []);
      } catch {
        if (!mounted) return;
        setNotifications([]);
      }
    };

    fetchNotificationList();

    return () => {
      mounted = false;
    };
  }, [open]);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (!open) return;

      if (
        notificationWrapRef.current &&
        !notificationWrapRef.current.contains(event.target)
      ) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [open]);

  const handleClickNotification = async (notification) => {
    try {
      if (!notification?.is_read) {
        await markAsRead(notification.id);
      }
    } catch {
      // Ignore read errors and still navigate to refunds page.
    } finally {
      setOpen(false);
      navigate("/admin/refunds");
      setNotifications((prev) =>
        prev.map((item) =>
          item.id === notification.id ? { ...item, is_read: true } : item,
        ),
      );
      setUnreadCount((prev) =>
        Math.max(0, prev - (notification?.is_read ? 0 : 1)),
      );
    }
  };

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
        <div
          className="admin-header__notification-wrap"
          ref={notificationWrapRef}
        >
          <button
            type="button"
            className="admin-header__bell"
            onClick={() => setOpen((prev) => !prev)}
          >
            <FaBell />
            {unreadCount > 0 && (
              <span className="admin-header__notify-badge">{unreadCount}</span>
            )}
          </button>

          {open && (
            <div className="admin-header__notify-dropdown">
              <h4>Thông báo</h4>
              {notifications.length === 0 ? (
                <p className="admin-header__notify-empty">Không có thông báo</p>
              ) : (
                <ul>
                  {notifications.slice(0, 8).map((item) => (
                    <li key={item.id}>
                      <button
                        type="button"
                        className={`admin-header__notify-item ${item.is_read ? "is-read" : ""}`}
                        onClick={() => handleClickNotification(item)}
                      >
                        <span>{item.message}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>

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
