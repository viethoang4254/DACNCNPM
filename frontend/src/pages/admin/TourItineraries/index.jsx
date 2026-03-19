import { useEffect, useMemo, useState } from "react";
import { FaPlus, FaSearch } from "react-icons/fa";
import ConfirmModal from "../../../components/admin/ConfirmModal";
import ItineraryFormModal from "../../../components/admin/ItineraryFormModal";
import ItineraryTable from "../../../components/admin/ItineraryTable";
import ItineraryViewModal from "../../../components/admin/ItineraryViewModal";
import Pagination from "../../../components/admin/Pagination";
import { getAuthToken } from "../../../utils/authStorage";
import "./TourItineraries.scss";

const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000"
).replace(/\/+$/, "");
const LIMIT = 10;

async function fetchJson(url, options = {}) {
  const response = await fetch(url, options);
  const raw = await response.text();
  const payload = raw ? JSON.parse(raw) : {};

  if (!response.ok) {
    throw new Error(payload?.message || "Request failed");
  }

  return payload;
}

function TourItineraries() {
  const [rows, setRows] = useState([]);
  const [tours, setTours] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: LIMIT,
    totalPages: 1,
    total: 0,
  });

  const [viewOpen, setViewOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState("create");
  const [deleteOpen, setDeleteOpen] = useState(false);

  const [selectedTour, setSelectedTour] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [selectedDetail, setSelectedDetail] = useState(null);

  const [notification, setNotification] = useState({
    open: false,
    title: "",
    message: "",
    variant: "primary",
  });

  const authHeaders = useMemo(() => {
    const token = getAuthToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  }, []);

  function openNotification(title, message, variant = "primary") {
    setNotification({ open: true, title, message, variant });
  }

  async function fetchTours() {
    try {
      const payload = await fetchJson(
        `${API_BASE_URL}/api/tours?page=1&limit=300&sort=latest`,
      );
      setTours(Array.isArray(payload?.data) ? payload.data : []);
    } catch {
      setTours([]);
    }
  }

  async function fetchList() {
    try {
      setLoading(true);
      setError("");

      const query = new URLSearchParams({
        page: String(page),
        limit: String(LIMIT),
        search: search.trim(),
      });

      const payload = await fetchJson(
        `${API_BASE_URL}/api/admin/itineraries?${query.toString()}`,
        {
          headers: {
            ...authHeaders,
          },
        },
      );

      setRows(Array.isArray(payload?.data) ? payload.data : []);
      setPagination(
        payload?.pagination || {
          page,
          limit: LIMIT,
          totalPages: 1,
          total: 0,
        },
      );
    } catch (requestError) {
      setRows([]);
      setError(requestError.message || "Không thể tải danh sách itinerary.");
    } finally {
      setLoading(false);
    }
  }

  async function fetchDetail(tourId) {
    setDetailLoading(true);
    try {
      const payload = await fetchJson(
        `${API_BASE_URL}/api/admin/itineraries/${tourId}`,
        {
          headers: {
            ...authHeaders,
          },
        },
      );

      setSelectedDetail(payload?.data || null);
      return payload?.data || null;
    } catch (requestError) {
      openNotification(
        "Lỗi",
        requestError.message || "Không thể tải chi tiết itinerary.",
        "danger",
      );
      setSelectedDetail(null);
      return null;
    } finally {
      setDetailLoading(false);
    }
  }

  useEffect(() => {
    fetchTours();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchList();
    }, 300);

    return () => clearTimeout(timer);
  }, [page, search]);

  async function handleOpenView(row) {
    setSelectedTour(row);
    const detail = await fetchDetail(row.id);
    if (detail) {
      setViewOpen(true);
    }
  }

  async function handleOpenEdit(row) {
    setSelectedTour(row);
    const detail = await fetchDetail(row.id);
    if (detail) {
      setFormMode("edit");
      setFormOpen(true);
    }
  }

  function handleOpenCreate() {
    setFormMode("create");
    setSelectedTour(null);
    setSelectedDetail(null);
    setFormOpen(true);
  }

  async function handleSubmitForm(payload) {
    try {
      setSubmitting(true);

      if (formMode === "create") {
        await fetchJson(`${API_BASE_URL}/api/admin/itineraries`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...authHeaders,
          },
          body: JSON.stringify(payload),
        });

        openNotification("Thành công", "Tạo itinerary thành công.", "primary");
      } else {
        await fetchJson(
          `${API_BASE_URL}/api/admin/itineraries/${selectedTour.id}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              ...authHeaders,
            },
            body: JSON.stringify({ itineraries: payload.itineraries }),
          },
        );

        openNotification(
          "Thành công",
          "Cập nhật itinerary thành công.",
          "primary",
        );
      }

      setFormOpen(false);
      setSelectedDetail(null);
      await fetchList();
    } catch (requestError) {
      openNotification(
        "Lỗi",
        requestError.message || "Lưu itinerary thất bại.",
        "danger",
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!selectedTour) return;

    try {
      setSubmitting(true);
      await fetchJson(
        `${API_BASE_URL}/api/admin/itineraries/${selectedTour.id}`,
        {
          method: "DELETE",
          headers: {
            ...authHeaders,
          },
        },
      );

      openNotification(
        "Thành công",
        "Đã xóa toàn bộ itinerary của tour.",
        "primary",
      );
      setDeleteOpen(false);
      setSelectedTour(null);
      await fetchList();
    } catch (requestError) {
      openNotification(
        "Lỗi",
        requestError.message || "Xóa itinerary thất bại.",
        "danger",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="admin-card admin-page-itineraries-v2">
      <div className="admin-toolbar">
        <h3>Quản lý lịch trình</h3>

        <div className="admin-page-itineraries-v2__actions">
          <span className="admin-toolbar__meta">
            {pagination.total || 0} tour
          </span>

          <button
            className="admin-btn admin-btn--primary"
            onClick={handleOpenCreate}
            disabled={submitting}
          >
            <FaPlus /> Thêm lịch trình
          </button>

          <div className="admin-search-wrap">
            <FaSearch className="admin-search-icon" />
            <input
              className="admin-input-search"
              placeholder="Tìm tour theo tên hoặc ID..."
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
            />
          </div>
        </div>
      </div>

      {error && <p className="admin-state admin-state--error">{error}</p>}

      {loading ? (
        <p className="admin-state">Đang tải dữ liệu itinerary...</p>
      ) : (
        <ItineraryTable
          data={rows}
          loading={submitting || detailLoading}
          onView={handleOpenView}
          onEdit={handleOpenEdit}
          onDelete={(row) => {
            setSelectedTour(row);
            setDeleteOpen(true);
          }}
        />
      )}

      <Pagination
        page={pagination.page || page}
        totalPages={pagination.totalPages || 1}
        onPageChange={setPage}
      />

      <ItineraryViewModal
        open={viewOpen}
        detail={selectedDetail}
        loading={detailLoading}
        onClose={() => {
          if (detailLoading) return;
          setViewOpen(false);
          setSelectedDetail(null);
        }}
      />

      <ItineraryFormModal
        open={formOpen}
        mode={formMode}
        tours={tours}
        detail={selectedDetail}
        loading={submitting}
        onClose={() => {
          if (submitting) return;
          setFormOpen(false);
          setSelectedDetail(null);
        }}
        onSubmit={handleSubmitForm}
      />

      <ConfirmModal
        open={deleteOpen}
        title="Xóa itinerary"
        message={
          selectedTour
            ? `Bạn có chắc muốn xóa toàn bộ itinerary của tour ${selectedTour.ten_tour}?`
            : "Bạn có chắc muốn xóa?"
        }
        confirmText="Xác nhận xóa"
        cancelText="Hủy"
        onCancel={() => {
          if (submitting) return;
          setDeleteOpen(false);
          setSelectedTour(null);
        }}
        onConfirm={handleDelete}
        confirmVariant="danger"
      />

      <ConfirmModal
        open={notification.open}
        title={notification.title}
        message={notification.message}
        confirmText="Đóng"
        hideCancel
        onConfirm={() => setNotification((prev) => ({ ...prev, open: false }))}
        confirmVariant={notification.variant}
      />
    </div>
  );
}

export default TourItineraries;
