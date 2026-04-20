import { useEffect, useMemo, useState } from "react";
import DataTable from "../../../components/admin/DataTable";
import Pagination from "../../../components/admin/Pagination";
import {
  getAdminReviews,
  hideReview,
  showReview,
} from "../../../services/reviewService";
import "./Reviews.scss";

const LIMIT = 10;

function StarRating({ value }) {
  const filled = Math.max(0, Math.min(5, Number(value) || 0));
  return (
    <span className="star-rating">
      {"★".repeat(filled)}
      <span className="star-empty">{"★".repeat(5 - filled)}</span>
    </span>
  );
}

function Reviews() {
  const [reviews, setReviews] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoadingId, setActionLoadingId] = useState(null);

  async function fetchReviews() {
    try {
      setLoading(true);
      setError("");
      const data = await getAdminReviews();
      setReviews(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(
        err?.response?.data?.message || "Không thể tải danh sách đánh giá",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let active = true;
    fetchReviews().catch(() => null);
    return () => {
      active = false;
    };
  }, []);

  async function handleHide(review) {
    try {
      setActionLoadingId(Number(review.id));
      await hideReview(review.id);
      await fetchReviews();
    } catch (err) {
      setError(err?.response?.data?.message || "Không thể ẩn đánh giá");
    } finally {
      setActionLoadingId(null);
    }
  }

  async function handleShow(review) {
    try {
      setActionLoadingId(Number(review.id));
      await showReview(review.id);
      await fetchReviews();
    } catch (err) {
      setError(err?.response?.data?.message || "Không thể hiện lại đánh giá");
    } finally {
      setActionLoadingId(null);
    }
  }

  const totalPages = Math.max(1, Math.ceil(reviews.length / LIMIT));
  const paginated = useMemo(
    () => reviews.slice((page - 1) * LIMIT, page * LIMIT),
    [reviews, page],
  );

  const columns = [
    { key: "id", header: "ID" },
    { key: "user_name", header: "Người dùng" },
    { key: "ten_tour", header: "Tour" },
    {
      key: "rating",
      header: "Đánh giá",
      render: (row) => <StarRating value={row.rating} />,
    },
    { key: "comment", header: "Bình luận" },
    {
      key: "is_hidden",
      header: "Trạng thái",
      render: (row) => (
        <span
          className={`review-visibility-badge ${row.is_hidden ? "is-hidden" : "is-visible"}`}
        >
          {row.is_hidden ? "Đang ẩn" : "Đang hiển thị"}
        </span>
      ),
    },
    {
      key: "created_at",
      header: "Ngày tạo",
      render: (row) => new Date(row.created_at).toLocaleDateString("vi-VN"),
    },
    {
      key: "actions",
      header: "Thao tác",
      render: (row) => {
        const isBusy = Number(actionLoadingId) === Number(row.id);
        if (row.is_hidden) {
          return (
            <button
              type="button"
              className="admin-btn admin-btn--primary review-action-btn"
              onClick={() => handleShow(row)}
              disabled={isBusy}
            >
              {isBusy ? "Đang xử lý..." : "Hiện lại"}
            </button>
          );
        }

        return (
          <button
            type="button"
            className="admin-btn admin-btn--danger review-action-btn"
            onClick={() => handleHide(row)}
            disabled={isBusy}
          >
            {isBusy ? "Đang xử lý..." : "Ẩn"}
          </button>
        );
      },
    },
  ];

  return (
    <div className="admin-card">
      <div className="admin-toolbar">
        <h3>Đánh giá</h3>
        <span className="admin-toolbar__meta">{reviews.length} đánh giá</span>
      </div>
      {error && <p className="admin-state admin-state--error">{error}</p>}
      {loading ? (
        <p className="admin-state">Đang tải đánh giá...</p>
      ) : (
        <DataTable
          columns={columns}
          data={paginated}
          emptyText="Chưa có đánh giá"
        />
      )}
      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  );
}

export default Reviews;
