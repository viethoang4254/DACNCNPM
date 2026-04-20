import {
  FaBook,
  FaMapLocationDot,
  FaMoneyBillTrendUp,
  FaUsers,
} from "react-icons/fa6";
import AlertPanel from "../../../components/admin/dashboard/AlertPanel";
import BookingPieChart from "../../../components/admin/dashboard/BookingPieChart";
import QuickActions from "../../../components/admin/dashboard/QuickActions";
import RevenueChart from "../../../components/admin/dashboard/RevenueChart";
import StatCard from "../../../components/admin/dashboard/StatCard";
import StatusCar from "../../../components/admin/dashboard/StatusCar/indexd";
import useDashboard from "../../../hooks/useDashboard";
import "./Dashboard.scss";

const SKELETON_ITEMS = Array.from({ length: 4 }, (_, index) => index + 1);

function Dashboard() {
  const {
    summary,
    bookingStatus,
    revenueChart,
    alerts,
    loading,
    error,
    isEmpty,
    refetch,
  } = useDashboard();

  const statItems = [
    {
      key: "users",
      title: "Tổng người dùng",
      value: summary.totalUsers,
      growth: summary.growth?.users,
      icon: FaUsers,
      accent: "blue",
    },
    {
      key: "tours",
      title: "Tổng tour",
      value: summary.totalTours,
      growth: summary.growth?.tours,
      icon: FaMapLocationDot,
      accent: "orange",
    },
    {
      key: "bookings",
      title: "Tổng đơn đặt",
      value: summary.totalBookings,
      growth: summary.growth?.bookings,
      icon: FaBook,
      accent: "green",
    },
    {
      key: "revenue",
      title: "Tổng doanh thu",
      value: summary.totalRevenue,
      growth: summary.growth?.revenue,
      icon: FaMoneyBillTrendUp,
      accent: "purple",
      isCurrency: true,
    },
  ];

  const statusItems = [
    { key: "paid", label: "Đã thanh toán", value: bookingStatus.paid },
    { key: "cod", label: "COD", value: bookingStatus.cod },
    { key: "pending", label: "Chưa thanh toán", value: bookingStatus.pending },
    { key: "cancelled", label: "Đã hủy", value: bookingStatus.cancelled },
  ];

  return (
    <section className="dashboard-page">
      <header className="dashboard-page__head">
        <div>
          <h2>Dashboard</h2>
          <p>Tổng quan hệ thống</p>
        </div>
        <button
          type="button"
          className="admin-btn admin-btn--ghost"
          onClick={refetch}
        >
          Làm mới dữ liệu
        </button>
      </header>

      {error ? (
        <p className="admin-state admin-state--error">Không thể tải dữ liệu</p>
      ) : null}

      {loading ? (
        <div className="dashboard-skeleton">
          {SKELETON_ITEMS.map((item) => (
            <div key={item} className="dashboard-skeleton__item" />
          ))}
        </div>
      ) : (
        <div className="dashboard-stat-grid">
          {statItems.map((item) => (
            <StatCard key={item.key} {...item} />
          ))}
        </div>
      )}

      {loading ? (
        <div className="dashboard-skeleton dashboard-skeleton--status">
          {SKELETON_ITEMS.map((item) => (
            <div key={item} className="dashboard-skeleton__item" />
          ))}
        </div>
      ) : (
        <StatusCar items={statusItems} />
      )}

      <div className="dashboard-main-grid">
        <RevenueChart data={revenueChart} />
        <BookingPieChart status={bookingStatus} />
      </div>

      <div className="dashboard-main-grid dashboard-main-grid--secondary">
        <AlertPanel alerts={alerts} />
        <QuickActions />
      </div>

      {!loading && isEmpty ? (
        <p className="admin-state">Chưa có dữ liệu</p>
      ) : null}
    </section>
  );
}

export default Dashboard;
