import { FaChevronLeft, FaChevronRight } from "react-icons/fa";

function getPageRange(page, totalPages) {
  const delta = 2;
  const range = [];
  const start = Math.max(1, page - delta);
  const end = Math.min(totalPages, page + delta);

  if (start > 1) {
    range.push(1);
    if (start > 2) range.push("...");
  }
  for (let i = start; i <= end; i++) range.push(i);
  if (end < totalPages) {
    if (end < totalPages - 1) range.push("...");
    range.push(totalPages);
  }
  return range;
}

function Pagination({ page, totalPages, onPageChange }) {
  if (!totalPages || totalPages <= 1) return null;

  const pages = getPageRange(page, totalPages);

  return (
    <nav className="pagination" aria-label="Phân trang">
      <button
        type="button"
        className="pagination__btn pagination__btn--prev"
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        aria-label="Trang trước"
      >
        <FaChevronLeft />
        <span>Trước</span>
      </button>

      <ul className="pagination__pages">
        {pages.map((p, idx) =>
          p === "..." ? (
            <li key={`ellipsis-${idx}`} className="pagination__ellipsis">
              …
            </li>
          ) : (
            <li key={p}>
              <button
                type="button"
                className={`pagination__page${p === page ? " pagination__page--active" : ""}`}
                onClick={() => onPageChange(p)}
                aria-current={p === page ? "page" : undefined}
              >
                {p}
              </button>
            </li>
          ),
        )}
      </ul>

      <button
        type="button"
        className="pagination__btn pagination__btn--next"
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
        aria-label="Trang sau"
      >
        <span>Sau</span>
        <FaChevronRight />
      </button>
    </nav>
  );
}

export default Pagination;
