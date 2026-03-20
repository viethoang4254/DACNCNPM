import { useEffect, useMemo, useState } from "react";
import { FaSearch } from "react-icons/fa";
import { LuCheck, LuEye, LuX } from "react-icons/lu";
import { toast } from "react-toastify";
import DataTable from "../../../components/admin/DataTable";
import Pagination from "../../../components/admin/Pagination";
import {
  approveRefund,
  getRefundDetail,
  getRefunds,
  rejectRefund,
} from "../../../services/refundService";
import { formatDateVi } from "../../../utils/dateOnly";
import "./Refunds.scss";

const LIMIT = 10;

const refundStatusLabelMap = {
  pending: "Chờ xử lý",
  processed: "Đã hoàn tiền",
  failed: "Thất bại",
  none: "Không hoàn",
};

function formatCurrency(value) {
  return `${Number(value || 0).toLocaleString("vi-VN")} ₫`;
}

function formatDate(value) {
  return formatDateVi(value, "-");
}

const resolveDisplayRefundAmount = (refund) => {
  const status = String(refund?.refund_status || "").toLowerCase();
  if (status === "pending") {
    return Number(refund?.expected_refund_amount ?? refund?.refund_amount ?? 0);
  }

  return Number(refund?.refund_amount || 0);
};

function RefundDetailModal({
  open,
  refund,
  loading,
  onClose,
  onApprove,
  onReject,
}) {
  if (!open || !refund) return null;

  return (
    <div className="admin-modal__backdrop" onClick={onClose}>
      <div
        className="refund-detail-modal"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="refund-detail-modal__header">
          <div>
            <h3>Refund booking #{refund.booking_id}</h3>
            <p>Chi tiết yêu cầu hoàn tiền</p>
          </div>
          <button
            type="button"
            className="refund-detail-modal__close"
            onClick={onClose}
            disabled={loading}
          >
            ×
          </button>
        </div>

        <div className="refund-detail-modal__body">
          <div className="admin-detail-grid">
            <div className="admin-detail-item">
              <label>Khách hàng</label>
              <span>{refund.user_name || "-"}</span>
            </div>
            <div className="admin-detail-item">
              <label>Email</label>
              <span>{refund.user_email || "-"}</span>
            </div>
            <div className="admin-detail-item">
              <label>Tour</label>
              <span>{refund.tour_name || "-"}</span>
            </div>
            <div className="admin-detail-item">
              <label>Ngày khởi hành</label>
              <span>{formatDate(refund.start_date)}</span>
            </div>
            <div className="admin-detail-item">
              <label>Số tiền cần hoàn</label>
              <span>{formatCurrency(resolveDisplayRefundAmount(refund))}</span>
            </div>
            <div className="admin-detail-item">
              <label>Tỷ lệ hoàn dự kiến</label>
              <span>
                {Number.isFinite(Number(refund.expected_refund_percentage))
                  ? `${Number(refund.expected_refund_percentage)}%`
                  : "-"}
              </span>
            </div>
            <div className="admin-detail-item">
              <label>Thanh toán</label>
              <span>{refund.payment_status || "-"}</span>
            </div>
            <div className="admin-detail-item">
              <label>Trạng thái refund</label>
              <span>
                {refundStatusLabelMap[refund.refund_status] ||
                  refund.refund_status}
              </span>
            </div>
            <div className="admin-detail-item">
              <label>Thời điểm hủy</label>
              <span>{formatDate(refund.cancelled_at)}</span>
            </div>
            <div className="admin-detail-item full">
              <label>Lý do hủy</label>
              <span>{refund.cancel_reason || "Không có lý do"}</span>
            </div>
          </div>
        </div>

        <div className="refund-detail-modal__footer">
          <button
            type="button"
            className="admin-btn admin-btn--danger"
            onClick={() => onReject(refund)}
            disabled={loading || refund.refund_status !== "pending"}
          >
            {loading ? "Đang xử lý..." : "Từ chối"}
          </button>
          <button
            type="button"
            className="admin-btn admin-btn--primary"
            onClick={() => onApprove(refund)}
            disabled={loading || refund.refund_status !== "pending"}
          >
            {loading ? "Đang xử lý..." : "Duyệt hoàn tiền"}
          </button>
        </div>
      </div>
    </div>
  );
}

function AdminRefunds() {
  const [refunds, setRefunds] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("pending");
  const [keyword, setKeyword] = useState("");
  const [detailLoading, setDetailLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedRefund, setSelectedRefund] = useState(null);

  const fetchRefunds = async ({
    status = statusFilter,
    key = keyword,
    silent = false,
  } = {}) => {
    try {
      if (!silent) {
        setLoading(true);
      }
      if (!silent) {
        setError("");
      }
      const data = await getRefunds({
        status,
        keyword: key,
      });
      setRefunds(data);
      if (!silent) {
        setPage(1);
      }
    } catch (err) {
      setError(
        err?.response?.data?.message || "Không thể tải danh sách hoàn tiền",
      );
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchRefunds({ status: statusFilter, key: keyword });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchRefunds({ status: statusFilter, key: keyword });
    }, 350);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, keyword]);

  useEffect(() => {
    const timer = setInterval(() => {
      fetchRefunds({ status: statusFilter, key: keyword, silent: true });
    }, 12000);

    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, keyword]);

  const totalPages = Math.max(1, Math.ceil(refunds.length / LIMIT));
  const paginated = useMemo(
    () => refunds.slice((page - 1) * LIMIT, page * LIMIT),
    [refunds, page],
  );

  const openDetail = async (bookingId) => {
    try {
      setDetailLoading(true);
      const detail = await getRefundDetail(bookingId);
      setSelectedRefund(detail);
    } catch (err) {
      toast.error(
        err?.response?.data?.message || "Không thể tải chi tiết refund",
      );
    } finally {
      setDetailLoading(false);
    }
  };

  const handleApprove = async (refund) => {
    try {
      setActionLoading(true);
      await approveRefund(refund.booking_id);
      toast.success("Đã duyệt hoàn tiền");
      setSelectedRefund(null);
      await fetchRefunds({ status: statusFilter, key: keyword });
    } catch (err) {
      toast.error(err?.response?.data?.message || "Không thể duyệt hoàn tiền");
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (refund) => {
    try {
      setActionLoading(true);
      await rejectRefund(refund.booking_id);
      toast.success("Đã từ chối yêu cầu hoàn tiền");
      setSelectedRefund(null);
      await fetchRefunds({ status: statusFilter, key: keyword });
    } catch (err) {
      toast.error(err?.response?.data?.message || "Không thể từ chối yêu cầu");
    } finally {
      setActionLoading(false);
    }
  };

  const columns = [
    {
      key: "booking_id",
      header: "Booking ID",
      render: (row) => `#${row.booking_id}`,
    },
    { key: "user_name", header: "User" },
    { key: "tour_name", header: "Tour" },
    {
      key: "refund_amount",
      header: "Số tiền hoàn",
      render: (row) => formatCurrency(resolveDisplayRefundAmount(row)),
    },
    {
      key: "refund_status",
      header: "Trạng thái",
      render: (row) => (
        <span className={`status-pill status-pill--${row.refund_status}`}>
          {refundStatusLabelMap[row.refund_status] || row.refund_status}
        </span>
      ),
    },
    {
      key: "cancel_reason",
      header: "Lý do hủy",
      render: (row) => row.cancel_reason || "-",
    },
    {
      key: "actions",
      header: "Action",
      render: (row) => (
        <div className="admin-icon-actions">
          <button
            type="button"
            className="admin-icon-btn"
            onClick={() => openDetail(row.booking_id)}
            title="Xem chi tiết"
            disabled={detailLoading}
          >
            <LuEye />
          </button>
          <button
            type="button"
            className="admin-icon-btn"
            onClick={() => handleApprove(row)}
            title="Duyệt"
            disabled={actionLoading || row.refund_status !== "pending"}
          >
            <LuCheck />
          </button>
          <button
            type="button"
            className="admin-icon-btn admin-icon-btn--danger"
            onClick={() => handleReject(row)}
            title="Từ chối"
            disabled={actionLoading || row.refund_status !== "pending"}
          >
            <LuX />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="admin-card admin-page-refunds">
      <div className="admin-toolbar">
        <h3>Refunds</h3>
        <span className="admin-toolbar__meta">{refunds.length} yêu cầu</span>
      </div>

      <div className="admin-toolbar admin-page-refunds__filters">
        <div className="admin-search-wrap admin-page-refunds__search-wrap">
          <FaSearch className="admin-search-icon" />
          <input
            className="admin-input-search admin-page-refunds__search-input"
            placeholder="Tìm theo booking, user, tour..."
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
          />
        </div>
        <select
          className="admin-select"
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
        >
          <option value="pending">Chờ xử lý</option>
          <option value="processed">Đã hoàn tiền</option>
          <option value="failed">Thất bại</option>
          <option value="all">Tất cả</option>
        </select>
        <button
          type="button"
          className="admin-btn admin-btn--primary"
          onClick={() => fetchRefunds({ status: statusFilter, key: keyword })}
          disabled={loading}
        >
          Làm mới
        </button>
      </div>

      {error && <p className="admin-state admin-state--error">{error}</p>}

      {loading ? (
        <p className="admin-state">Đang tải yêu cầu hoàn tiền...</p>
      ) : (
        <DataTable
          columns={columns}
          data={paginated}
          emptyText="Không có yêu cầu hoàn tiền"
          keyField="booking_id"
        />
      )}

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />

      <RefundDetailModal
        open={Boolean(selectedRefund)}
        refund={selectedRefund}
        loading={actionLoading}
        onClose={() => (actionLoading ? null : setSelectedRefund(null))}
        onApprove={handleApprove}
        onReject={handleReject}
      />
    </div>
  );
}

export default AdminRefunds;
