import { useEffect, useMemo, useState } from "react";
import DataTable from "../../../components/admin/DataTable";
import Pagination from "../../../components/admin/Pagination";
import apiClient from "../../../utils/apiClient";
import "./Bookings.scss";

const LIMIT = 10;

const bookingStatusLabels = {
  pending: "Chờ xác nhận",
  confirmed: "Đã xác nhận",
  cancelled: "Đã hủy",
};

function Bookings() {
  const [bookings, setBookings]           = useState([]);
  const [selectedBooking, setSelected]    = useState(null);
  const [page, setPage]                   = useState(1);
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState("");

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
        setError(err?.response?.data?.message || "Không thể tải danh sách đặt tour");
      } finally {
        if (active) setLoading(false);
      }
    }
    fetchBookings();
    return () => { active = false; };
  }, []);

  const visibleBookings = useMemo(
    () => bookings.filter((booking) => booking.trang_thai !== "pending"),
    [bookings],
  );

  const totalPages = Math.max(1, Math.ceil(visibleBookings.length / LIMIT));
  const paginated  = useMemo(() => visibleBookings.slice((page - 1) * LIMIT, page * LIMIT), [visibleBookings, page]);

  const columns = [
    { key: "id",        header: "ID" },
    { key: "user_name", header: "Người dùng" },
    { key: "ten_tour",  header: "Tour" },
    {
      key: "start_date",
      header: "Ngày đi",
      render: (row) =>
        row.start_date ? new Date(row.start_date).toLocaleDateString("vi-VN") : "—",
    },
    { key: "so_nguoi",  header: "Số khách" },
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
      key: "actions",
      header: "",
      render: (row) => (
        <button
          type="button"
          className={`admin-btn admin-btn--ghost`}
          onClick={() => setSelected((prev) => (prev?.id === row.id ? null : row))}
        >
          {selectedBooking?.id === row.id ? "Đóng" : "Xem"}
        </button>
      ),
    },
  ];

  return (
    <div className="admin-stack admin-page-bookings">
      <div className="admin-card">
        <div className="admin-toolbar">
          <h3>Đặt tour</h3>
          <span className="admin-toolbar__meta">{visibleBookings.length} bản ghi</span>
        </div>
        {error && <p className="admin-state admin-state--error">{error}</p>}
        {loading ? (
          <p className="admin-state">Đang tải danh sách đặt tour...</p>
        ) : (
          <DataTable columns={columns} data={paginated} emptyText="Chưa có đơn đã thanh toán" />
        )}
        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
      </div>

      {selectedBooking && (
        <div className="admin-card">
          <div className="admin-toolbar">
            <h3>Đơn đặt #{selectedBooking.id}</h3>
            <button type="button" className="admin-btn" onClick={() => setSelected(null)}>
              ✕ Đóng
            </button>
          </div>
          <div className="admin-detail-grid">
            <div className="admin-detail-item">
              <label>Người dùng</label>
              <span>{selectedBooking.user_name}</span>
            </div>
            <div className="admin-detail-item">
              <label>Email</label>
              <span>{selectedBooking.user_email || "—"}</span>
            </div>
            <div className="admin-detail-item">
              <label>Tour</label>
              <span>{selectedBooking.ten_tour}</span>
            </div>
            <div className="admin-detail-item">
              <label>Ngày khởi hành</label>
              <span>
                {selectedBooking.start_date
                  ? new Date(selectedBooking.start_date).toLocaleDateString("vi-VN")
                  : "—"}
              </span>
            </div>
            <div className="admin-detail-item">
              <label>Số người</label>
              <span>{selectedBooking.so_nguoi}</span>
            </div>
            <div className="admin-detail-item">
              <label>Tổng tiền</label>
              <span>{Number(selectedBooking.tong_tien).toLocaleString("vi-VN")} ₫</span>
            </div>
            <div className="admin-detail-item">
              <label>Trạng thái</label>
              <span>
                <span className={`status-pill status-pill--${selectedBooking.trang_thai}`}>
                  {bookingStatusLabels[selectedBooking.trang_thai] || selectedBooking.trang_thai}
                </span>
              </span>
            </div>
            <div className="admin-detail-item">
              <label>Ngày đặt</label>
              <span>
                {selectedBooking.created_at
                  ? new Date(selectedBooking.created_at).toLocaleDateString("vi-VN")
                  : "—"}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Bookings;
