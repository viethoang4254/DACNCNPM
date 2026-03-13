import { useEffect, useMemo, useState } from "react";
import { FaPlus, FaSearch } from "react-icons/fa";
import { MdDelete } from "react-icons/md";
import { PiPencilLineFill } from "react-icons/pi";

import DataTable from "../../../components/admin/DataTable";
import Pagination from "../../../components/admin/Pagination";
import ConfirmModal from "../../../components/admin/ConfirmModal";
import AddItineraryModal from "../../../components/admin/AddItineraryModal";
import EditItineraryModal from "../../../components/admin/EditItineraryModal";
import { getAuthToken } from "../../../utils/authStorage";
import "./TourItineraries.scss";

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "http://localhost:5000").replace(/\/+$/, "");
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

function resolveImageUrl(imageUrl) {
  if (!imageUrl) return "";
  if (/^https?:\/\//i.test(imageUrl)) return imageUrl;

  return imageUrl.startsWith("/")
    ? `${API_BASE_URL}${imageUrl}`
    : `${API_BASE_URL}/${imageUrl}`;
}

function TourItineraries() {
  const [itineraries, setItineraries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedItinerary, setSelectedItinerary] = useState(null);

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

  async function fetchItineraries() {
    try {
      setLoading(true);
      setError("");

      const toursPayload = await fetchJson(`${API_BASE_URL}/api/tours?page=1&limit=200&sort=latest`);
      const tours = Array.isArray(toursPayload?.data) ? toursPayload.data : [];

      const itineraryGroups = await Promise.all(
        tours.map(async (tour) => {
          const payload = await fetchJson(`${API_BASE_URL}/api/admin/tours/${tour.id}/itineraries`, {
            headers: {
              ...authHeaders,
            },
          });

          return Array.isArray(payload?.data) ? payload.data : [];
        }),
      );

      const merged = itineraryGroups
        .flat()
        .sort((a, b) => (a.tour_id === b.tour_id ? a.ngay_thu - b.ngay_thu : a.tour_id - b.tour_id));

      setItineraries(merged);
    } catch (requestError) {
      setError(requestError.message || "Không thể tải danh sách lịch trình.");
      setItineraries([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchItineraries();
  }, []);

  async function handleCreate(payload) {
    try {
      setSubmitting(true);
      await fetchJson(`${API_BASE_URL}/api/admin/itineraries`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders,
        },
        body: JSON.stringify(payload),
      });

      setShowAddModal(false);
      await fetchItineraries();
      openNotification("Thành công", "Thêm lịch trình thành công.", "primary");
    } catch (requestError) {
      openNotification("Lỗi", requestError.message || "Thêm lịch trình thất bại.", "danger");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleUpdate(payload) {
    if (!selectedItinerary) return;

    try {
      setSubmitting(true);
      await fetchJson(`${API_BASE_URL}/api/admin/itineraries/${selectedItinerary.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders,
        },
        body: JSON.stringify(payload),
      });

      setShowEditModal(false);
      setSelectedItinerary(null);
      await fetchItineraries();
      openNotification("Thành công", "Cập nhật lịch trình thành công.", "primary");
    } catch (requestError) {
      openNotification("Lỗi", requestError.message || "Cập nhật lịch trình thất bại.", "danger");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!selectedItinerary) return;

    try {
      setSubmitting(true);
      await fetchJson(`${API_BASE_URL}/api/admin/itineraries/${selectedItinerary.id}`, {
        method: "DELETE",
        headers: {
          ...authHeaders,
        },
      });

      setShowDeleteConfirm(false);
      setSelectedItinerary(null);
      await fetchItineraries();
      openNotification("Thành công", "Xóa lịch trình thành công.", "primary");
    } catch (requestError) {
      setShowDeleteConfirm(false);
      openNotification("Lỗi", requestError.message || "Xóa lịch trình thất bại.", "danger");
    } finally {
      setSubmitting(false);
    }
  }

  const filteredItineraries = itineraries.filter((item) => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return true;

    return (
      String(item.ten_tour || "").toLowerCase().includes(keyword) ||
      String(item.tieu_de || "").toLowerCase().includes(keyword) ||
      String(item.ngay_thu || "").includes(keyword)
    );
  });

  const totalPages = Math.max(1, Math.ceil(filteredItineraries.length / LIMIT));
  const paginatedItineraries = filteredItineraries.slice((page - 1) * LIMIT, page * LIMIT);

  useEffect(() => {
    if (page > totalPages) setPage(1);
  }, [page, totalPages]);

  const columns = [
    { key: "id", header: "ID" },
    { key: "ten_tour", header: "Tour" },
    {
      key: "ngay_thu",
      header: "Ngày",
      render: (row) => <span className="itinerary-day-badge">Ngày {row.ngay_thu}</span>,
    },
    {
      key: "tieu_de",
      header: "Tiêu đề",
      className: "admin-col-description",
      render: (row) => <span className="admin-description-cell">{row.tieu_de || "—"}</span>,
    },
    {
      key: "image_url",
      header: "Ảnh",
      render: (row) => {
        const src = resolveImageUrl(row.image_url);
        if (!src) return <span className="admin-thumb-placeholder">-</span>;

        return <img src={src} alt={row.tieu_de || "itinerary"} className="admin-thumb" />;
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
            title="Sửa"
            disabled={submitting}
            onClick={() => {
              setSelectedItinerary(row);
              setShowEditModal(true);
            }}
          >
            <PiPencilLineFill />
          </button>

          <button
            type="button"
            className="admin-icon-btn admin-icon-btn--danger"
            title="Xóa"
            disabled={submitting}
            onClick={() => {
              setSelectedItinerary(row);
              setShowDeleteConfirm(true);
            }}
          >
            <MdDelete />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="admin-card admin-page-itineraries">
      <div className="admin-toolbar">
        <h3>Tour Itineraries Management</h3>

        <div className="admin-page-itineraries__actions">
          <span className="admin-toolbar__meta">{filteredItineraries.length} lịch trình</span>

          <button
            className="admin-btn admin-btn--primary"
            onClick={() => setShowAddModal(true)}
            disabled={submitting}
          >
            <FaPlus /> Thêm lịch trình
          </button>

          <div className="admin-search-wrap">
            <FaSearch className="admin-search-icon" />
            <input
              className="admin-input-search"
              placeholder="Tìm tour, ngày, tiêu đề..."
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
        <p className="admin-state">Đang tải lịch trình tour...</p>
      ) : (
        <DataTable columns={columns} data={paginatedItineraries} emptyText="Không tìm thấy lịch trình" />
      )}

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />

      <AddItineraryModal
        open={showAddModal}
        loading={submitting}
        onClose={() => {
          if (submitting) return;
          setShowAddModal(false);
        }}
        onSubmit={handleCreate}
      />

      <EditItineraryModal
        open={showEditModal}
        itinerary={selectedItinerary}
        loading={submitting}
        onClose={() => {
          if (submitting) return;
          setShowEditModal(false);
          setSelectedItinerary(null);
        }}
        onSubmit={handleUpdate}
      />

      <ConfirmModal
        open={showDeleteConfirm}
        title="Xóa lịch trình"
        message={`Bạn có chắc muốn xóa lịch trình${selectedItinerary ? ` ngày ${selectedItinerary.ngay_thu}` : ""} không?`}
        confirmText="Xác nhận xóa"
        cancelText="Hủy"
        onCancel={() => {
          if (submitting) return;
          setShowDeleteConfirm(false);
          setSelectedItinerary(null);
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
