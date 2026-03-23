import {
  FaCircleCheck,
  FaMoneyBillWave,
  FaHourglassHalf,
  FaBan,
} from "react-icons/fa6";
import "./StatusCar.scss";

const ICONS = {
  paid: FaCircleCheck,
  cod: FaMoneyBillWave,
  pending: FaHourglassHalf,
  cancelled: FaBan,
};

function StatusCar({ items = [] }) {
  if (!items.length) {
    return <div className="dashboard-empty">Chưa có dữ liệu</div>;
  }

  return (
    <div className="dashboard-status-grid">
      {items.map((item) => {
        const Icon = ICONS[item.key] || FaCircleCheck;
        return (
          <article
            key={item.key}
            className={`dashboard-status-card dashboard-status-card--${item.key}`}
          >
            <div className="dashboard-status-card__icon">
              <Icon />
            </div>
            <div>
              <p>{item.label}</p>
              <h4>{Number(item.value || 0).toLocaleString("vi-VN")}</h4>
            </div>
          </article>
        );
      })}
    </div>
  );
}

export default StatusCar;
