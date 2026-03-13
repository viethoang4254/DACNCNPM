import { useEffect, useMemo, useState } from "react";
import DataTable from "../../../components/admin/DataTable";
import Pagination from "../../../components/admin/Pagination";
import apiClient from "../../../utils/apiClient";
import "./Payments.scss";

const LIMIT = 12;

const paymentStatusLabels = {
  pending: "Chờ thanh toán",
  paid: "Đã thanh toán",
  failed: "Thất bại",
};

function Payments() {
  const [payments, setPayments] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    async function fetchPayments() {
      try {
        setLoading(true);
        const res = await apiClient.get("/api/payments");
        if (!active) return;
        setPayments(Array.isArray(res.data?.data) ? res.data.data : []);
      } catch (err) {
        if (!active) return;
        setError(err?.response?.data?.message || "Không thể tải danh sách thanh toán");
      } finally {
        if (active) setLoading(false);
      }
    }

    fetchPayments();
    return () => {
      active = false;
    };
  }, []);

  const totalPages = Math.max(1, Math.ceil(payments.length / LIMIT));
  const paginated = useMemo(() => payments.slice((page - 1) * LIMIT, page * LIMIT), [payments, page]);

  const columns = [
    { key: "booking_id", header: "Mã đơn" },
    {
      key: "amount",
      header: "Số tiền",
      render: (row) => `${Number(row.amount).toLocaleString("vi-VN")} ₫`,
    },
    { key: "method", header: "Phương thức" },
    {
      key: "status",
      header: "Trạng thái",
      render: (row) => (
        <span className={`status-pill status-pill--${row.status}`}>{paymentStatusLabels[row.status] || row.status}</span>
      ),
    },
    {
      key: "created_at",
      header: "Ngày tạo",
      render: (row) => new Date(row.created_at).toLocaleDateString("vi-VN"),
    },
  ];

  return (
    <div className="admin-card admin-page-payments">
      <div className="admin-toolbar">
        <h3>Thanh toán</h3>
        <span className="admin-toolbar__meta">{payments.length} bản ghi</span>
      </div>
      {error && <p className="admin-state admin-state--error">{error}</p>}
      {loading ? (
        <p className="admin-state">Đang tải thanh toán...</p>
      ) : (
        <DataTable columns={columns} data={paginated} emptyText="Không có thanh toán" keyField="id" />
      )}
      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  );
}

export default Payments;
