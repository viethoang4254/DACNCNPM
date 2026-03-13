import { useEffect, useMemo, useState } from "react";
import DataTable from "../../../components/admin/DataTable";
import Pagination from "../../../components/admin/Pagination";
import apiClient from "../../../utils/apiClient";
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
  const [page, setPage]       = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");

  useEffect(() => {
    let active = true;
    async function fetchReviews() {
      try {
        setLoading(true);
        const res = await apiClient.get("/api/reviews");
        if (!active) return;
        setReviews(Array.isArray(res.data?.data) ? res.data.data : []);
      } catch (err) {
        if (!active) return;
        setError(err?.response?.data?.message || "Không thể tải danh sách đánh giá");
      } finally {
        if (active) setLoading(false);
      }
    }
    fetchReviews();
    return () => { active = false; };
  }, []);

  const totalPages = Math.max(1, Math.ceil(reviews.length / LIMIT));
  const paginated  = useMemo(() => reviews.slice((page - 1) * LIMIT, page * LIMIT), [reviews, page]);

  const columns = [
    { key: "id",        header: "ID" },
    { key: "user_name", header: "Người dùng" },
    { key: "ten_tour",  header: "Tour" },
    {
      key: "rating",
      header: "Đánh giá",
      render: (row) => <StarRating value={row.rating} />,
    },
    { key: "comment",    header: "Bình luận" },
    {
      key: "created_at",
      header: "Ngày tạo",
      render: (row) => new Date(row.created_at).toLocaleDateString("vi-VN"),
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
        <DataTable columns={columns} data={paginated} emptyText="Chưa có đánh giá" />
      )}
      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  );
}

export default Reviews;
