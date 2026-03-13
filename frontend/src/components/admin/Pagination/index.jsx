import "./Pagination.scss";

function Pagination({ page, totalPages, onPageChange }) {
  if (!totalPages || totalPages <= 1) return null;

  return (
    <div className="admin-pagination">
      <button type="button" onClick={() => onPageChange(page - 1)} disabled={page <= 1}>
        Trước
      </button>
      <span>
        Trang {page} / {totalPages}
      </span>
      <button type="button" onClick={() => onPageChange(page + 1)} disabled={page >= totalPages}>
        Sau
      </button>
    </div>
  );
}

export default Pagination;
