import { useEffect, useMemo, useState } from "react";
import { LuEye } from "react-icons/lu";
import BookingViewModal from "../../../components/admin/BookingViewModal";
import DataTable from "../../../components/admin/DataTable";
import Pagination from "../../../components/admin/Pagination";
import apiClient from "../../../utils/apiClient";
import { formatDateVi } from "../../../utils/dateOnly";
import "./Bookings.scss";

const LIMIT = 10;

const bookingStatusLabels = {
  pending: "Chờ xác nhận",
  confirmed: "Đã xác nhận",
  cancelled: "Đã hủy",
};

const paymentStatusLabels = {
  pending: "Chờ xác nhận",
  paid: "Đã thanh toán",
  failed: "Thất bại",
};

function Bookings() {
  const [bookings, setBookings] = useState([]);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    async function fetchBookings() {
      try {
        setLoading(true);
        const res = await apiClient.get("/api/bookings");
        if (!active) return;
        setBookings(Array.isArray(res.data?.data) ? res.data.data : []);
      } catch (err) {
        if (!active) return;
        setError(
          err?.response?.data?.message || "Không thể tải danh sách đặt tour",
        );
      } finally {
        if (active) setLoading(false);
      }
    }
    fetchBookings();
    return () => {
      active = false;
    };
  }, []);

  const visibleBookings = useMemo(
    () => bookings.filter((booking) => booking.trang_thai !== "pending"),
    [bookings],
  );

  const totalPages = Math.max(1, Math.ceil(visibleBookings.length / LIMIT));
  const paginated = useMemo(
    () => visibleBookings.slice((page - 1) * LIMIT, page * LIMIT),
    [visibleBookings, page],
  );

  const columns = [
    { key: "id", header: "ID" },
    { key: "user_name", header: "Người dùng" },
    {
      key: "ten_tour",
      header: "Tour",
      className: "booking-col-tour",
      render: (row) => (
        <span className="booking-tour-name" title={row.ten_tour || "-"}>
          {row.ten_tour || "-"}
        </span>
      ),
    },
    {
      key: "start_date",
      header: "Ngày đi",
      render: (row) => formatDateVi(row.start_date, "—"),
    },
    { key: "so_nguoi", header: "Số khách" },
    {
      key: "tong_tien",
      header: "Tổng tiền",
      render: (row) => `${Number(row.tong_tien).toLocaleString("vi-VN")} ₫`,
    },
    {
      key: "trang_thai",
      header: "Trạng thái",
      render: (row) => (
        <span className={`status-pill status-pill--${row.trang_thai}`}>
          {bookingStatusLabels[row.trang_thai] || row.trang_thai}
        </span>
      ),
    },
    {
      key: "payment_status",
      header: "Thanh toán",
      render: (row) => {
        const normalized = row.payment_status || "pending";
        return (
          <span className={`status-pill status-pill--${normalized}`}>
            {paymentStatusLabels[normalized] || normalized}
          </span>
        );
      },
    },
    {
      key: "actions",
      header: "Thao tác",
      className: "booking-col-actions",
      render: (row) => (
        <div className="admin-icon-actions">
          <button
            type="button"
            className="admin-icon-btn"
            onClick={() => setSelectedBooking(row)}
            title="Xem chi tiết"
            aria-label={`Xem chi tiết đơn đặt #${row.id}`}
          >
            <LuEye aria-hidden="true" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="admin-stack admin-page-bookings">
      <div className="admin-card">
        <div className="admin-toolbar">
          <h3>Đặt tour</h3>
          <span className="admin-toolbar__meta">
            {visibleBookings.length} bản ghi
          </span>
        </div>
        {error && <p className="admin-state admin-state--error">{error}</p>}
        {loading ? (
          <p className="admin-state">Đang tải danh sách đặt tour...</p>
        ) : (
          <DataTable
            columns={columns}
            data={paginated}
            emptyText="Chưa có đơn đã thanh toán"
          />
        )}
        <Pagination
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
        />
      </div>

      <BookingViewModal
        booking={selectedBooking}
        onClose={() => setSelectedBooking(null)}
        bookingStatusLabels={bookingStatusLabels}
        paymentStatusLabels={paymentStatusLabels}
      />
    </div>
  );
}

export default Bookings;
