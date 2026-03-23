import { FaArrowTrendDown, FaArrowTrendUp } from "react-icons/fa6";
import "./StatCard.scss";

function formatValue(value, isCurrency = false) {
  const number = Number(value || 0);
  if (isCurrency) {
    return `${number.toLocaleString("vi-VN")} ₫`;
  }
  return number.toLocaleString("vi-VN");
}

function StatCard({ title, value, growth = 0, icon: Icon, accent = "blue", isCurrency = false }) {
  const growthValue = Number(growth || 0);
  const isUp = growthValue >= 0;

  return (
    <article className={`dashboard-stat-card dashboard-stat-card--${accent}`}>
      <div className="dashboard-stat-card__head">
        <div className="dashboard-stat-card__icon-wrap">
          <Icon className="dashboard-stat-card__icon" />
        </div>
        <span className={`dashboard-stat-card__growth ${isUp ? "is-up" : "is-down"}`}>
          {isUp ? <FaArrowTrendUp /> : <FaArrowTrendDown />}
          {Math.abs(growthValue).toFixed(1)}%
        </span>
      </div>
      <p className="dashboard-stat-card__title">{title}</p>
      <h3 className="dashboard-stat-card__value">{formatValue(value, isCurrency)}</h3>
    </article>
  );
}

export default StatCard;
