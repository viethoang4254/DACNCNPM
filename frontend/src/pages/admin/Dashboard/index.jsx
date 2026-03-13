import { useEffect, useMemo, useState } from "react";
import { FaBook, FaMapMarkedAlt, FaMoneyCheckAlt, FaUsers } from "react-icons/fa";
import ChartRevenue from "../../../components/admin/ChartRevenue";
import DataTable from "../../../components/admin/DataTable";
import StatsCard from "../../../components/admin/StatsCard";
import apiClient from "../../../utils/apiClient";
import "./Dashboard.scss";

const bookingStatusLabels = {
  pending: "Chờ xác nhận",
  confirmed: "Đã xác nhận",
  cancelled: "Đã hủy",
};

function Dashboard() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalTours: 0,
    totalBookings: 0,
    revenue: 0,
  });
  const [latestBookings, setLatestBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function fetchDashboard() {
      try {
        setLoading(true);
        const [statsRes, bookingsRes] = await Promise.all([
          apiClient.get("/api/admin/stats"),
          apiClient.get("/api/admin/bookings"),
        ]);

        if (!active) return;
        setStats(statsRes.data?.data || stats);
        setLatestBookings((bookingsRes.data?.data || []).slice(0, 5));
      } catch (err) {
        if (!active) return;
        setError(err?.response?.data?.message || "Không thể tải dữ liệu tổng quan");
      } finally {
        if (active) setLoading(false);
      }
    }

    fetchDashboard();
    return () => {
      active = false;
    };
  }, []);

  const columns = useMemo(
    () => [
      { key: "id", header: "Mã đơn" },
      { key: "user_name", header: "Người dùng" },
      { key: "ten_tour", header: "Tour" },
      { key: "so_nguoi", header: "Số người" },
      {
        key: "tong_tien",
        header: "Tổng tiền",
        render: (row) => `${Number(row.tong_tien || 0).toLocaleString("vi-VN")} ₫`,
      },
      {
        key: "trang_thai",
        header: "Trạng thái",
        render: (row) => <span className={`status-pill status-pill--${row.trang_thai}`}>{bookingStatusLabels[row.trang_thai] || row.trang_thai}</span>,
      },
    ],
    []
  );

  return (
    <div className="admin-stack">
      {error && <p className="admin-state admin-state--error">{error}</p>}

      <div className="admin-grid admin-grid--stats">
        <StatsCard title="Tổng người dùng" value={stats.totalUsers} hint="Tài khoản hệ thống" accent="blue" icon={FaUsers} />
        <StatsCard title="Tổng tour" value={stats.totalTours} hint="Tour đang quản lý" accent="orange" icon={FaMapMarkedAlt} />
        <StatsCard title="Tổng đơn đặt" value={stats.totalBookings} hint="Đơn đặt tour" accent="green" icon={FaBook} />
        <StatsCard
          title="Tổng doanh thu"
          value={`${Number(stats.revenue || 0).toLocaleString("vi-VN")} ₫`}
          hint="Doanh thu đã thanh toán"
          accent="purple"
          icon={FaMoneyCheckAlt}
        />
      </div>

      <ChartRevenue />

      <div className="admin-card">
        <div className="admin-toolbar">
          <h3>Đơn đặt gần đây</h3>
          <span className="admin-toolbar__meta">5 bản ghi mới nhất</span>
        </div>
        {loading ? (
          <p className="admin-state">Đang tải...</p>
        ) : (
          <DataTable columns={columns} data={latestBookings} emptyText="Chưa có đơn đặt tour" />
        )}
      </div>
    </div>
  );
}

export default Dashboard;
