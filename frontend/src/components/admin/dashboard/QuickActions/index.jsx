import { useNavigate } from "react-router-dom";
import {
  FaCalendarPlus,
  FaCreditCard,
  FaPlus,
  FaUserPlus,
} from "react-icons/fa6";
import "./QuickActions.scss";

const ACTIONS = [
  {
    key: "tour",
    label: "Tạo tour",
    icon: FaPlus,
    to: "/admin/tours",
  },
  {
    key: "schedule",
    label: "Tạo lịch trình",
    icon: FaCalendarPlus,
    to: "/admin/schedules",
  },
  {
    key: "user",
    label: "Thêm user",
    icon: FaUserPlus,
    to: "/admin/users",
  },
  {
    key: "payment",
    label: "Xem thanh toán",
    icon: FaCreditCard,
    to: "/admin/payments",
  },
];

function QuickActions() {
  const navigate = useNavigate();

  return (
    <section className="dashboard-panel">
      <div className="dashboard-panel__header">
        <h3>Quick actions</h3>
      </div>

      <div className="dashboard-quick-actions">
        {ACTIONS.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.key}
              type="button"
              className="dashboard-quick-actions__btn"
              onClick={() => navigate(item.to)}
            >
              <Icon />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

export default QuickActions;
