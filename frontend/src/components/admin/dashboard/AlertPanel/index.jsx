import {
  FaCircleExclamation,
  FaCircleInfo,
  FaMoneyCheckDollar,
} from "react-icons/fa6";
import "./AlertPanel.scss";

const TYPE_META = {
  risk: {
    label: "Nguy cơ hủy",
    icon: FaCircleExclamation,
    className: "risk",
  },
  low: {
    label: "Thiếu khách",
    icon: FaCircleInfo,
    className: "low",
  },
  payment: {
    label: "Chưa thanh toán",
    icon: FaMoneyCheckDollar,
    className: "payment",
  },
};

function AlertPanel({ alerts = [] }) {
  return (
    <section className="dashboard-panel">
      <div className="dashboard-panel__header">
        <h3>Cảnh báo hệ thống</h3>
      </div>

      {alerts.length === 0 ? (
        <div className="dashboard-empty">Chưa có dữ liệu</div>
      ) : (
        <ul className="dashboard-alert-list">
          {alerts.map((item) => {
            const meta = TYPE_META[item.type] || TYPE_META.low;
            const Icon = meta.icon;

            return (
              <li
                key={item.id}
                className={`dashboard-alert dashboard-alert--${meta.className}`}
              >
                <div className="dashboard-alert__icon">
                  <Icon />
                </div>
                <div>
                  <p className="dashboard-alert__type">{meta.label}</p>
                  <p className="dashboard-alert__message">{item.message}</p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

export default AlertPanel;
