import { useEffect, useMemo, useState } from "react";
import DataTable from "../../../components/admin/DataTable";
import Pagination from "../../../components/admin/Pagination";
import apiClient from "../../../utils/apiClient";

const LIMIT = 10;

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
        setError(err?.response?.data?.message || "Cannot load bookings");
      } finally {
        if (active) setLoading(false);
      }
    }
    fetchBookings();
    return () => { active = false; };
  }, []);

  const totalPages = Math.max(1, Math.ceil(bookings.length / LIMIT));
  const paginated  = useMemo(() => bookings.slice((page - 1) * LIMIT, page * LIMIT), [bookings, page]);

  const columns = [
    { key: "id",        header: "ID" },
    { key: "user_name", header: "User" },
    { key: "ten_tour",  header: "Tour" },
    {
      key: "start_date",
      header: "Date",
      render: (row) =>
        row.start_date ? new Date(row.start_date).toLocaleDateString("vi-VN") : "—",
    },
    { key: "so_nguoi",  header: "Pax" },
    {
      key: "tong_tien",
      header: "Total",
      render: (row) => `${Number(row.tong_tien).toLocaleString("vi-VN")} ₫`,
    },
    {
      key: "trang_thai",
      header: "Status",
      render: (row) => (
        <span className={`status-pill status-pill--${row.trang_thai}`}>
          {row.trang_thai}
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
          {selectedBooking?.id === row.id ? "Close" : "View"}
        </button>
      ),
    },
  ];

  return (
    <div className="admin-stack">
      <div className="admin-card">
        <div className="admin-toolbar">
          <h3>Bookings</h3>
          <span className="admin-toolbar__meta">{bookings.length} records</span>
        </div>
        {error && <p className="admin-state admin-state--error">{error}</p>}
        {loading ? (
          <p className="admin-state">Loading bookings…</p>
        ) : (
          <DataTable columns={columns} data={paginated} emptyText="No bookings" />
        )}
        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
      </div>

      {selectedBooking && (
        <div className="admin-card">
          <div className="admin-toolbar">
            <h3>Booking #{selectedBooking.id}</h3>
            <button type="button" className="admin-btn" onClick={() => setSelected(null)}>
              ✕ Close
            </button>
          </div>
          <div className="admin-detail-grid">
            <div className="admin-detail-item">
              <label>User</label>
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
              <label>Start Date</label>
              <span>
                {selectedBooking.start_date
                  ? new Date(selectedBooking.start_date).toLocaleDateString("vi-VN")
                  : "—"}
              </span>
            </div>
            <div className="admin-detail-item">
              <label>People</label>
              <span>{selectedBooking.so_nguoi}</span>
            </div>
            <div className="admin-detail-item">
              <label>Total</label>
              <span>{Number(selectedBooking.tong_tien).toLocaleString("vi-VN")} ₫</span>
            </div>
            <div className="admin-detail-item">
              <label>Status</label>
              <span>
                <span className={`status-pill status-pill--${selectedBooking.trang_thai}`}>
                  {selectedBooking.trang_thai}
                </span>
              </span>
            </div>
            <div className="admin-detail-item">
              <label>Booked On</label>
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
