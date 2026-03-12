import { useEffect, useMemo, useState } from "react";
import { FaBook, FaMapMarkedAlt, FaMoneyCheckAlt, FaUsers } from "react-icons/fa";
import ChartRevenue from "../../../components/admin/ChartRevenue";
import DataTable from "../../../components/admin/DataTable";
import StatsCard from "../../../components/admin/StatsCard";
import apiClient from "../../../utils/apiClient";

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
        setError(err?.response?.data?.message || "Cannot load dashboard data");
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
      { key: "id", header: "Booking ID" },
      { key: "user_name", header: "User" },
      { key: "ten_tour", header: "Tour" },
      { key: "so_nguoi", header: "People" },
      {
        key: "tong_tien",
        header: "Total",
        render: (row) => `${Number(row.tong_tien || 0).toLocaleString("vi-VN")} ₫`,
      },
      {
        key: "trang_thai",
        header: "Status",
        render: (row) => <span className={`status-pill status-pill--${row.trang_thai}`}>{row.trang_thai}</span>,
      },
    ],
    []
  );

  return (
    <div className="admin-stack">
      {error && <p className="admin-state admin-state--error">{error}</p>}

      <div className="admin-grid admin-grid--stats">
        <StatsCard title="Total Users"    value={stats.totalUsers}    hint="Tài khoản hệ thống"      accent="blue"   icon={FaUsers} />
        <StatsCard title="Total Tours"    value={stats.totalTours}    hint="Tour đang quản lý"        accent="orange" icon={FaMapMarkedAlt} />
        <StatsCard title="Total Bookings" value={stats.totalBookings} hint="Đơn đặt tour"             accent="green"  icon={FaBook} />
        <StatsCard
          title="Total Revenue"
          value={`${Number(stats.revenue || 0).toLocaleString("vi-VN")} ₫`}
          hint="Doanh thu đã thanh toán"
          accent="purple"
          icon={FaMoneyCheckAlt}
        />
      </div>

      <ChartRevenue />

      <div className="admin-card">
        <div className="admin-toolbar">
          <h3>Latest Bookings</h3>
          <span className="admin-toolbar__meta">Last 5 records</span>
        </div>
        {loading ? (
          <p className="admin-state">Loading…</p>
        ) : (
          <DataTable columns={columns} data={latestBookings} emptyText="No bookings yet" />
        )}
      </div>
    </div>
  );
}

export default Dashboard;
