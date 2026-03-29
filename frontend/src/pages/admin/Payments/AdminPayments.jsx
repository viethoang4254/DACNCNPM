import { useEffect, useMemo, useState } from "react";
import { LuEye } from "react-icons/lu";
import { toast } from "react-toastify";
import DataTable from "../../../components/admin/DataTable";
import Pagination from "../../../components/admin/Pagination";
import apiClient from "../../../utils/apiClient";
import PaymentDetailModal from "./PaymentDetailModal";
import "./Payments.scss";

const LIMIT = 12;

const paymentStatusLabels = {
  pending: "Chờ xác nhận",
  paid: "Đã thanh toán",
  failed: "Thất bại",
  refunded: "Đã hoàn tiền",
};

const paymentMethodLabels = {
  pay_at_place: "Thanh toán khi đến nơi",
  pay_later: "Thanh toán khi đến nơi",
  cod: "Thanh toán khi đến nơi",
  cash_on_delivery: "Thanh toán khi đến nơi",
  bank_transfer: "Chuyển khoản ngân hàng",
  paypal: "PayPal",
  cash: "Tiền mặt",
  card: "Thẻ ngân hàng",
  momo: "Ví MoMo",
  vnpay: "VNPay",
};

function normalizeKey(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
}

function getStatusLabel(status) {
  const statusKey = normalizeKey(status);
  return paymentStatusLabels[statusKey] || status || "-";
}

function isCodMethod(method) {
  const methodKey = normalizeKey(method);
  return [
    "pay_at_place",
    "pay_later",
    "cod",
    "cash_on_delivery",
    "cash",
  ].includes(methodKey);
}

function getPaymentStatusDisplay(payment = {}) {
  const statusKey = normalizeKey(payment.status);
  const bookingStatus = normalizeKey(payment.booking_status);

  if (isCodMethod(payment.method)) {
    if (statusKey === "pending") {
      return {
        className: "pending",
        label: "Chờ xác nhận COD",
      };
    }

    if (statusKey === "paid") {
      return {
        className: bookingStatus === "cancelled" ? "cancelled" : "confirmed",
        label:
          bookingStatus === "cancelled"
            ? "COD đã xác nhận (tour đã hủy)"
            : "Đã xác nhận COD",
      };
    }

    if (statusKey === "refunded") {
      return {
        className: "failed",
        label: "Không áp dụng hoàn tiền (COD)",
      };
    }

    if (statusKey === "failed") {
      return {
        className: "failed",
        label: "Từ chối xác nhận COD",
      };
    }
  }

  return {
    className: statusKey,
    label: getStatusLabel(statusKey),
  };
}

function getMethodLabel(method) {
  const methodKey = normalizeKey(method);
  return paymentMethodLabels[methodKey] || method || "-";
}

function formatCurrency(value) {
  return `${Number(value || 0).toLocaleString("vi-VN")} ₫`;
}

function AdminPayments() {
  const [payments, setPayments] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [isActionLoading, setIsActionLoading] = useState(false);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await apiClient.get("/api/payments");
      setPayments(Array.isArray(res.data?.data) ? res.data.data : []);
    } catch (err) {
      setError(
        err?.response?.data?.message || "Không thể tải danh sách thanh toán",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  const totalPages = Math.max(1, Math.ceil(payments.length / LIMIT));
  const paginated = useMemo(
    () => payments.slice((page - 1) * LIMIT, page * LIMIT),
    [payments, page],
  );

  const columns = [
    { key: "id", header: "ID" },
    {
      key: "booking",
      header: "Booking",
      render: (row) => `#${row.booking_id}`,
    },
    {
      key: "customer",
      header: "Khách hàng",
      render: (row) => row.user_name || "-",
    },
    {
      key: "amount",
      header: "Số tiền",
      render: (row) => formatCurrency(row.amount),
    },
    {
      key: "method",
      header: "Phương thức",
      render: (row) => getMethodLabel(row.method),
    },
    {
      key: "status",
      header: "Trạng thái",
      render: (row) => {
        const statusDisplay = getPaymentStatusDisplay(row);
        return (
          <span
            className={`status-pill status-pill--${statusDisplay.className}`}
          >
            {statusDisplay.label}
          </span>
        );
      },
    },
    {
      key: "actions",
      header: "Thao tác",
      render: (row) => (
        <div className="admin-icon-actions">
          <button
            type="button"
            className="admin-icon-btn"
            onClick={() => setSelectedPayment(row)}
            title="Xem chi tiết thanh toán"
            aria-label={`Xem chi tiết thanh toán #${row.id}`}
          >
            <LuEye aria-hidden="true" />
          </button>
        </div>
      ),
    },
  ];

  const handleConfirm = async (payment) => {
    try {
      setIsActionLoading(true);
      await apiClient.put(`/api/payments/${payment.id}/confirm`);
      toast.success("Đã xác nhận thanh toán thành công");
      setSelectedPayment(null);
      await fetchPayments();
    } catch (err) {
      toast.error(
        err?.response?.data?.message || "Không thể xác nhận thanh toán",
      );
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleReject = async (payment) => {
    try {
      setIsActionLoading(true);
      await apiClient.put(`/api/payments/${payment.id}/reject`);
      toast.success("Đã từ chối thanh toán");
      setSelectedPayment(null);
      await fetchPayments();
    } catch (err) {
      toast.error(
        err?.response?.data?.message || "Không thể từ chối thanh toán",
      );
    } finally {
      setIsActionLoading(false);
    }
  };

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
        <DataTable
          columns={columns}
          data={paginated}
          emptyText="Không có thanh toán"
          keyField="id"
        />
      )}

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />

      <PaymentDetailModal
        payment={selectedPayment}
        open={Boolean(selectedPayment)}
        loading={isActionLoading}
        onClose={() => (isActionLoading ? null : setSelectedPayment(null))}
        onConfirm={handleConfirm}
        onReject={handleReject}
        getStatusLabel={getStatusLabel}
        getPaymentStatusDisplay={getPaymentStatusDisplay}
        getMethodLabel={getMethodLabel}
        normalizeStatus={normalizeKey}
        formatCurrency={formatCurrency}
      />
    </div>
  );
}

export default AdminPayments;
