import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import FilterSidebar from "./components/FilterSidebar";
import TourList from "./components/TourList";
import Pagination from "./components/Pagination";
import {
  getTours as getToursApi,
  searchTours as searchToursApi,
} from "../../../services/tourService";
import "./Tours.scss";

const PAGE_LIMIT = 8;
const INITIAL_VISIBLE = 4;
const VISIBLE_STEP = 4;

const SORT_OPTIONS = ["newest", "price_asc", "price_desc"];
const PRICE_OPTIONS = ["under-2", "2-5", "5-10", "over-10"];
const DURATION_OPTIONS = ["1-3", "4-7", "over-7"];

function parseQuery(searchString) {
  const params = new URLSearchParams(searchString);

  const rawPage = Number(params.get("page") || 1);
  const page =
    Number.isFinite(rawPage) && rawPage > 0 ? Math.floor(rawPage) : 1;

  const sort = SORT_OPTIONS.includes(params.get("sort"))
    ? params.get("sort")
    : "newest";

  const price = PRICE_OPTIONS.includes(params.get("price"))
    ? params.get("price")
    : "";

  const duration = DURATION_OPTIONS.includes(params.get("duration"))
    ? params.get("duration")
    : "";

  return {
    page,
    limit: PAGE_LIMIT,
    sort,
    tinh_thanh: params.get("tinh_thanh") || "",
    search: (params.get("search") || params.get("keyword") || "").trim(),
    destination: (params.get("destination") || "").trim(),
    date: (params.get("date") || "").trim(),
    guests: (params.get("guests") || "").trim(),
    price,
    duration,
  };
}

function buildApiParams(state) {
  const params = {
    page: state.page || 1,
    limit: PAGE_LIMIT,
    sort: state.sort || "newest",
  };

  if (state.tinh_thanh) params.tinh_thanh = state.tinh_thanh;
  if (state.price) params.price = state.price;
  if (state.duration) params.duration = state.duration;
  if (state.search) params.search = state.search;

  return params;
}

function ToursPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const scrollContainerRef = useRef(null);
  const loadMoreRef = useRef(null);

  const urlState = useMemo(
    () => parseQuery(location.search),
    [location.search],
  );
  const queryKey = useMemo(
    () =>
      JSON.stringify({
        tinh_thanh: urlState.tinh_thanh,
        search: urlState.search,
        destination: urlState.destination,
        date: urlState.date,
        guests: urlState.guests,
        sort: urlState.sort,
        price: urlState.price,
        duration: urlState.duration,
        page: urlState.page,
      }),
    [urlState],
  );

  const [allTours, setAllTours] = useState([]);
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE);
  const [pagination, setPagination] = useState({
    total: 0,
    totalPages: 1,
    page: 1,
    limit: PAGE_LIMIT,
  });
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isRevealingMore, setIsRevealingMore] = useState(false);
  const [error, setError] = useState(null);
  const [searchMessage, setSearchMessage] = useState("");
  const [keyword, setKeyword] = useState("");

  const isHomeSearch = Boolean(
    urlState.destination || urlState.date || urlState.guests,
  );
  const hasToursPageFilters = useMemo(
    () =>
      Boolean(
        urlState.search ||
        urlState.tinh_thanh ||
        urlState.price ||
        urlState.duration ||
        urlState.sort !== "newest" ||
        urlState.page > 1,
      ),
    [
      urlState.duration,
      urlState.page,
      urlState.price,
      urlState.search,
      urlState.sort,
      urlState.tinh_thanh,
    ],
  );

  useEffect(() => {
    setKeyword(urlState.search || "");
  }, [urlState.search]);

  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    } else {
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    }

    setAllTours([]);
    setVisibleCount(INITIAL_VISIBLE);
    setTotal(0);
    setError(null);
    setSearchMessage("");
  }, [queryKey]);

  useEffect(() => {
    let ignore = false;

    const fetchTours = async () => {
      setIsLoading(true);

      try {
        let result;

        if (isHomeSearch && !hasToursPageFilters) {
          result = await searchToursApi({
            destination: urlState.destination || undefined,
            date: urlState.date || undefined,
            guests: urlState.guests || undefined,
          });
        } else {
          const params = buildApiParams(urlState);
          result = await getToursApi(params);
        }

        if (ignore) return;

        setTotal(result.total);
        setPagination({
          total: result.total,
          totalPages: result.totalPages,
          page: result.page,
          limit: result.limit,
        });
        setAllTours(result.tours || []);
        setSearchMessage(result.message || "");
        setVisibleCount(INITIAL_VISIBLE);
      } catch (err) {
        if (ignore) return;
        const apiError = err?.response?.data?.message;
        setError(apiError || err.message || "Không thể tải danh sách tour");
        setSearchMessage("");
        setAllTours([]);
        setPagination({ total: 0, totalPages: 1, page: 1, limit: PAGE_LIMIT });
      } finally {
        if (ignore) return;
        setIsLoading(false);
      }
    };

    fetchTours();

    return () => {
      ignore = true;
    };
  }, [hasToursPageFilters, isHomeSearch, queryKey, urlState]);

  useEffect(() => {
    const hasMoreToReveal = visibleCount < allTours.length;
    if (!hasMoreToReveal || isLoading) return;
    if (!loadMoreRef.current) return;

    const rootContainer = scrollContainerRef.current;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (!entry?.isIntersecting) return;
        setIsRevealingMore(true);
        setVisibleCount((prev) =>
          Math.min(prev + VISIBLE_STEP, allTours.length),
        );
        setTimeout(() => setIsRevealingMore(false), 250);
      },
      {
        root: rootContainer || null,
        rootMargin: "140px",
        threshold: 0,
      },
    );

    observer.observe(loadMoreRef.current);

    return () => observer.disconnect();
  }, [allTours.length, visibleCount, isLoading]);

  const updateUrlQuery = useCallback(
    (nextPartial, { resetPage = true, dropHomeSearch = false } = {}) => {
      const params = new URLSearchParams(location.search);

      Object.entries(nextPartial).forEach(([key, value]) => {
        if (value === undefined || value === null || value === "") {
          params.delete(key);
        } else {
          params.set(key, String(value));
        }
      });

      if (dropHomeSearch) {
        params.delete("destination");
        params.delete("date");
        params.delete("guests");
      }

      params.set("limit", String(PAGE_LIMIT));

      if (resetPage) {
        params.set("page", "1");
      } else if (!params.get("page")) {
        params.set("page", "1");
      }

      navigate(
        {
          pathname: "/tours",
          search: `?${params.toString()}`,
        },
        { replace: false },
      );
    },
    [location.search, navigate],
  );

  function handleFilterChange(partial) {
    updateUrlQuery(partial, { resetPage: true, dropHomeSearch: true });
  }

  function handleFilterClear() {
    navigate({
      pathname: "/tours",
      search: `?page=1&limit=${PAGE_LIMIT}&sort=newest`,
    });
    setKeyword("");
  }

  function handleSearch(e) {
    e.preventDefault();
    updateUrlQuery(
      { search: keyword.trim() },
      { resetPage: true, dropHomeSearch: true },
    );
  }

  function handleSortChange(e) {
    updateUrlQuery(
      { sort: e.target.value },
      { resetPage: false, dropHomeSearch: true },
    );
  }

  function handlePageChange(nextPage) {
    updateUrlQuery(
      { page: nextPage },
      { resetPage: false, dropHomeSearch: true },
    );
  }

  const visibleTours = allTours.slice(0, visibleCount);
  const shownTours = visibleTours.length;
  const hasMoreToReveal = visibleCount < allTours.length;

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
            filters={{
              tinh_thanh: urlState.tinh_thanh,
              duration: urlState.duration,
              price: urlState.price,
            }}
            onChange={handleFilterChange}
            onClear={handleFilterClear}
          />
        </aside>

        <main className="tours-page__main">
          <div className="tours-page__main-scroll" ref={scrollContainerRef}>
            <div className="tours-page__toolbar">
              <p className="tours-page__result-count">
                {isLoading && allTours.length === 0 ? (
                  "Đang tải..."
                ) : (
                  <>
                    {total > 0
                      ? `Đã hiển thị ${shownTours}/${Math.max(total, allTours.length)} tour`
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
                  value={urlState.sort}
                  onChange={handleSortChange}
                >
                  <option value="newest">Mới nhất</option>
                  <option value="price_asc">Giá tăng dần</option>
                  <option value="price_desc">Giá giảm dần</option>
                </select>
              </div>
            </div>

            {searchMessage && (
              <div
                className="tours-page__search-message"
                role="status"
                aria-live="polite"
              >
                {searchMessage}
              </div>
            )}

            <TourList
              tours={visibleTours}
              isLoading={isLoading && allTours.length === 0}
              error={error}
            />

            <div
              ref={loadMoreRef}
              className="tours-page__sentinel"
              aria-hidden="true"
            />

            {isRevealingMore && hasMoreToReveal && (
              <div
                className="tours-page__loading-more"
                role="status"
                aria-live="polite"
              >
                <span className="tours-page__spinner" aria-hidden="true" />
                <span>Đang tải thêm tour...</span>
              </div>
            )}
          </div>

          <div className="tours-page__pagination-wrap">
            <Pagination
              page={urlState.page}
              totalPages={pagination.totalPages}
              onPageChange={handlePageChange}
            />
          </div>
        </main>
      </div>
    </div>
  );
}

export default ToursPage;
