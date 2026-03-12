import { useState, useEffect, useCallback } from "react";
import FilterSidebar from "./components/FilterSidebar";
import TourList from "./components/TourList";
import Pagination from "./components/Pagination";
import "./Tours.scss";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
const LIMIT = 5;

const DEFAULT_FILTERS = {
  keyword: "",
  tinh_thanh: [],
  minDays: null,
  maxDays: null,
  minPrice: null,
  maxPrice: null,
  sort: "created_at_desc",
};

function buildQuery(filters, page) {
  const params = new URLSearchParams();
  params.set("page", page);
  params.set("limit", LIMIT);
  if (filters.keyword) params.set("keyword", filters.keyword);
  if (filters.tinh_thanh?.length === 1)
    params.set("tinh_thanh", filters.tinh_thanh[0]);
  if (filters.minPrice != null) params.set("minPrice", filters.minPrice);
  if (filters.maxPrice != null) params.set("maxPrice", filters.maxPrice);
  if (filters.minDays != null) params.set("minDays", filters.minDays);
  if (filters.maxDays != null) params.set("maxDays", filters.maxDays);
  if (filters.sort) params.set("sort", filters.sort);
  return params.toString();
}

function ToursPage() {
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [page, setPage] = useState(1);
  const [tours, setTours] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [keyword, setKeyword] = useState("");

  const fetchTours = useCallback(async (currentFilters, currentPage) => {
    setIsLoading(true);
    setError(null);
    try {
      const query = buildQuery(currentFilters, currentPage);
      const res = await fetch(`${API_BASE_URL}/api/tours?${query}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.message || "Lỗi khi tải dữ liệu");
      setTours(json.data || []);
      setPagination(json.pagination || { total: 0, totalPages: 1 });
    } catch (err) {
      setError(err.message);
      setTours([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTours(filters, page);
  }, [filters, page, fetchTours]);

  function handleFilterChange(partial) {
    setFilters((prev) => ({ ...prev, ...partial }));
    setPage(1);
  }

  function handleFilterClear() {
    setFilters(DEFAULT_FILTERS);
    setKeyword("");
    setPage(1);
  }

  function handleSearch(e) {
    e.preventDefault();
    setFilters((prev) => ({ ...prev, keyword }));
    setPage(1);
  }

  function handleSortChange(e) {
    setFilters((prev) => ({ ...prev, sort: e.target.value }));
    setPage(1);
  }

  const start = (page - 1) * LIMIT + 1;
  const end = Math.min(page * LIMIT, pagination.total);

  return (
    <div className="tours-page">
      <div className="tours-page__hero">
        <div className="tours-page__hero-inner">
          <h1 className="tours-page__hero-title">
            Khám phá Tour Du Lịch Việt Nam
          </h1>
          <p className="tours-page__hero-subtitle">
            Tìm kiếm và đặt tour du lịch trong nước với giá tốt nhất
          </p>
          <form className="tours-page__search-bar" onSubmit={handleSearch}>
            <input
              type="text"
              className="tours-page__search-input"
              placeholder="Tìm kiếm tour theo tên, điểm đến..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
            />
            <button type="submit" className="tours-page__search-btn">
              Tìm kiếm
            </button>
          </form>
        </div>
      </div>

      <div className="tours-page__container">
        <aside className="tours-page__sidebar">
          <FilterSidebar
            filters={filters}
            onChange={handleFilterChange}
            onClear={handleFilterClear}
          />
        </aside>

        <main className="tours-page__main">
          <div className="tours-page__toolbar">
            <p className="tours-page__result-count">
              {isLoading ? (
                "Đang tải..."
              ) : (
                <>
                  {pagination.total > 0
                    ? `Hiển thị ${start}–${end} trong ${pagination.total} tour`
                    : "Không tìm thấy tour nào"}
                </>
              )}
            </p>
            <div className="tours-page__sort-wrap">
              <label htmlFor="sort-select" className="tours-page__sort-label">
                Sắp xếp:
              </label>
              <select
                id="sort-select"
                className="tours-page__sort-select"
                value={filters.sort}
                onChange={handleSortChange}
              >
                <option value="created_at_desc">Mới nhất</option>
                <option value="gia_asc">Giá tăng dần</option>
                <option value="gia_desc">Giá giảm dần</option>
                <option value="ten_tour_asc">Tên A–Z</option>
              </select>
            </div>
          </div>

          <TourList tours={tours} isLoading={isLoading} error={error} />

          <Pagination
            page={page}
            totalPages={pagination.totalPages}
            onPageChange={setPage}
          />
        </main>
      </div>
    </div>
  );
}

export default ToursPage;
