import { useEffect, useState } from "react";
import { FaPlus, FaSearch } from "react-icons/fa";
import { MdDelete } from "react-icons/md";
import { PiPencilLineFill } from "react-icons/pi";
import ConfirmModal from "../../../components/admin/ConfirmModal";
import DataTable from "../../../components/admin/DataTable";
import Pagination from "../../../components/admin/Pagination";
import TourFormModal from "../../../components/admin/TourFormModal";
import apiClient from "../../../utils/apiClient";

const LIMIT = 10;

function AdminTours() {
  const [tours, setTours] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTour, setSelectedTour] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [notification, setNotification] = useState({ open: false, title: "", message: "", variant: "primary" });
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const getApiMessage = (err, fallback) =>
    err?.response?.data?.data?.errors?.[0]?.msg || err?.response?.data?.message || fallback;

  async function fetchTours() {
    try {
      setLoading(true);
      setError("");

      const response = await apiClient.get("/api/tours", {
        params: { page: 1, limit: 200, sort: "latest" },
      });

      setTours(Array.isArray(response.data?.data) ? response.data.data : []);
    } catch (err) {
      setError(getApiMessage(err, "Cannot load tours"));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchTours();
  }, []);

  function openNotification(title, message, variant = "primary") {
    setNotification({ open: true, title, message, variant });
  }

  async function createTour(payload) {
    try {
      setSubmitting(true);
      await apiClient.post("/api/tours", payload);
      setShowModal(false);
      setSelectedTour(null);
      await fetchTours();
      openNotification("Success", "Thêm tour thành công", "primary");
    } catch (err) {
      openNotification("Error", getApiMessage(err, "Thêm tour thất bại"), "danger");
    } finally {
      setSubmitting(false);
    }
  }

  async function updateTour(payload) {
    if (!selectedTour) return;

    try {
      setSubmitting(true);
      await apiClient.put(`/api/tours/${selectedTour.id}`, payload);
      setShowModal(false);
      setSelectedTour(null);
      await fetchTours();
      openNotification("Success", "Cập nhật tour thành công", "primary");
    } catch (err) {
      openNotification("Error", getApiMessage(err, "Cập nhật tour thất bại"), "danger");
    } finally {
      setSubmitting(false);
    }
  }

  async function deleteTour() {
    if (!selectedTour) return;

    try {
      setSubmitting(true);
      await apiClient.delete(`/api/tours/${selectedTour.id}`);
      setShowDeleteConfirm(false);
      setSelectedTour(null);
      await fetchTours();
      openNotification("Success", "Xóa tour thành công", "primary");
    } catch (err) {
      setShowDeleteConfirm(false);
      openNotification("Error", getApiMessage(err, "Xóa tour thất bại"), "danger");
    } finally {
      setSubmitting(false);
    }
  }

  function handleSubmitTour(payload) {
    if (selectedTour) {
      updateTour(payload);
      return;
    }

    createTour(payload);
  }

  function handleAddTour() {
    setSelectedTour(null);
    setShowModal(true);
  }

  function handleEditTour(tour) {
    setSelectedTour(tour);
    setShowModal(true);
  }

  function handleDeleteClick(tour) {
    setSelectedTour(tour);
    setShowDeleteConfirm(true);
  }

  const filteredTours = tours.filter((tour) => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return true;

    return [
      tour.ten_tour,
      tour.mo_ta,
      tour.tinh_thanh,
      tour.diem_khoi_hanh,
      tour.phuong_tien,
    ].some((value) => String(value || "").toLowerCase().includes(keyword));
  });

  const totalPages = Math.max(1, Math.ceil(filteredTours.length / LIMIT));
  const paginatedTours = filteredTours.slice((page - 1) * LIMIT, page * LIMIT);

  useEffect(() => {
    if (page > totalPages) {
      setPage(1);
    }
  }, [page, totalPages]);

  const columns = [
    { key: "id", header: "ID", className: "admin-col-id" },
    { key: "ten_tour", header: "Tour Name" },
    {
      key: "mo_ta",
      header: "Description",
      className: "admin-col-description",
      render: (row) => <div className="admin-description-cell">{row.mo_ta || "-"}</div>,
    },
    {
      key: "gia",
      header: "Price",
      render: (row) => `${Number(row.gia).toLocaleString("vi-VN")} ₫`,
    },
    { key: "tinh_thanh", header: "Province" },
    { key: "diem_khoi_hanh", header: "Departure" },
    { key: "phuong_tien", header: "Transport" },
    { key: "so_ngay", header: "Days" },
    { key: "so_nguoi_toi_da", header: "Max People" },
    {
      key: "created_at",
      header: "Created At",
      render: (row) => new Date(row.created_at).toLocaleString("vi-VN"),
    },
    {
      key: "actions",
      header: "Actions",
      render: (row) => (
        <div className="admin-icon-actions">
          <button
            type="button"
            className="admin-icon-btn"
            onClick={() => handleEditTour(row)}
            disabled={submitting}
            aria-label={`Edit tour ${row.ten_tour}`}
            title="Edit"
          >
            <PiPencilLineFill />
          </button>
          <button
            type="button"
            className="admin-icon-btn admin-icon-btn--danger"
            onClick={() => handleDeleteClick(row)}
            disabled={submitting}
            aria-label={`Delete tour ${row.ten_tour}`}
            title="Delete"
          >
            <MdDelete />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="admin-card">
      <div className="admin-toolbar">
        <h3>Tours</h3>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span className="admin-toolbar__meta">{filteredTours.length} tours</span>
          <button type="button" className="admin-btn admin-btn--primary" onClick={handleAddTour} disabled={submitting}>
            <FaPlus />
            Add Tour
          </button>
          <div className="admin-search-wrap">
            <FaSearch className="admin-search-icon" />
            <input
              className="admin-input-search"
              placeholder="Search name, province, transport…"
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
        <p className="admin-state">Loading tours…</p>
      ) : (
        <DataTable columns={columns} data={paginatedTours} emptyText="No tours found" />
      )}

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />

      <TourFormModal
        open={showModal}
        mode={selectedTour ? "edit" : "create"}
        tour={selectedTour}
        loading={submitting}
        onClose={() => {
          if (submitting) return;
          setShowModal(false);
          setSelectedTour(null);
        }}
        onSubmit={handleSubmitTour}
      />

      <ConfirmModal
        open={showDeleteConfirm}
        title="Delete Tour"
        message="Bạn có chắc muốn xóa tour này không?"
        confirmText={submitting ? "Deleting..." : "Confirm Delete"}
        cancelText="Cancel"
        onCancel={() => {
          if (submitting) return;
          setShowDeleteConfirm(false);
          setSelectedTour(null);
        }}
        onConfirm={deleteTour}
        confirmVariant="danger"
      />

      <ConfirmModal
        open={notification.open}
        title={notification.title}
        message={notification.message}
        confirmText="Close"
        hideCancel
        onCancel={() => setNotification((prev) => ({ ...prev, open: false }))}
        onConfirm={() => setNotification((prev) => ({ ...prev, open: false }))}
        confirmVariant={notification.variant}
      />
    </div>
  );
}

export default AdminTours;
