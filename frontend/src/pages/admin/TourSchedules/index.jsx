import { useEffect, useState } from "react";
import { FaPlus, FaSearch } from "react-icons/fa";
import { MdDelete } from "react-icons/md";
import { PiPencilLineFill } from "react-icons/pi";

import DataTable from "../../../components/admin/DataTable";
import Pagination from "../../../components/admin/Pagination";
import ConfirmModal from "../../../components/admin/ConfirmModal";
import AddScheduleModal from "../../../components/admin/AddScheduleModal";
import EditScheduleModal from "../../../components/admin/EditScheduleModal";

import apiClient from "../../../utils/apiClient";
import "./TourSchedules.scss";

const LIMIT = 10;

function TourSchedules() {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const [notification, setNotification] = useState({
    open: false,
    title: "",
    message: "",
    variant: "primary",
  });

  const getApiMessage = (err, fallback) =>
    err?.response?.data?.data?.errors?.[0]?.msg ||
    err?.response?.data?.message ||
    fallback;

  const formatDate = (dateStr) => {
    if (!dateStr) return "—";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString("vi-VN");
  };

  async function fetchSchedules() {
    try {
      setLoading(true);
      setError("");
      const res = await apiClient.get("/api/schedules");
      setSchedules(Array.isArray(res.data?.data) ? res.data.data : []);
    } catch (err) {
      setError(getApiMessage(err, "Không thể tải danh sách lịch khởi hành"));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchSchedules();
  }, []);

  function openNotification(title, message, variant = "primary") {
    setNotification({ open: true, title, message, variant });
  }

  async function handleAddSubmit(payload) {
    try {
      setSubmitting(true);
      await apiClient.post("/api/schedules", payload);
      setShowAddModal(false);
      await fetchSchedules();
      openNotification("Thành công", "Thêm lịch khởi hành thành công", "primary");
    } catch (err) {
      openNotification("Lỗi", getApiMessage(err, "Thêm lịch thất bại"), "danger");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleEditSubmit(payload) {
    if (!selectedSchedule) return;
    try {
      setSubmitting(true);
      await apiClient.put(`/api/schedules/${selectedSchedule.id}`, payload);
      setShowEditModal(false);
      setSelectedSchedule(null);
      await fetchSchedules();
      openNotification("Thành công", "Cập nhật lịch thành công", "primary");
    } catch (err) {
      openNotification("Lỗi", getApiMessage(err, "Cập nhật lịch thất bại"), "danger");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!selectedSchedule) return;
    try {
      setSubmitting(true);
      await apiClient.delete(`/api/schedules/${selectedSchedule.id}`);
      setShowDeleteConfirm(false);
      setSelectedSchedule(null);
      await fetchSchedules();
      openNotification("Thành công", "Xóa lịch khởi hành thành công", "primary");
    } catch (err) {
      setShowDeleteConfirm(false);
      openNotification("Lỗi", getApiMessage(err, "Xóa lịch thất bại"), "danger");
    } finally {
      setSubmitting(false);
    }
  }

  const filteredSchedules = schedules.filter((s) => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return true;
    return String(s.ten_tour || "").toLowerCase().includes(keyword);
  });

  const totalPages = Math.max(1, Math.ceil(filteredSchedules.length / LIMIT));
  const paginatedSchedules = filteredSchedules.slice(
    (page - 1) * LIMIT,
    page * LIMIT,
  );

  useEffect(() => {
    if (page > totalPages) setPage(1);
  }, [page, totalPages]);

  const columns = [
    { key: "id", header: "ID" },
    { key: "ten_tour", header: "Tên Tour" },
    {
      key: "start_date",
      header: "Ngày khởi hành",
      render: (row) => formatDate(row.start_date),
    },
    {
      key: "available_slots",
      header: "Slots còn lại",
      render: (row) => (
        <span className="slots-badge">{row.available_slots}</span>
      ),
    },
    {
      key: "actions",
      header: "Thao tác",
      render: (row) => (
        <div className="admin-icon-actions">
          <button
            className="admin-icon-btn"
            onClick={() => {
              setSelectedSchedule(row);
              setShowEditModal(true);
            }}
            disabled={submitting}
            type="button"
            title="Sửa"
          >
            <PiPencilLineFill />
          </button>
          <button
            className="admin-icon-btn admin-icon-btn--danger"
            onClick={() => {
              setSelectedSchedule(row);
              setShowDeleteConfirm(true);
            }}
            disabled={submitting}
            type="button"
            title="Xóa"
          >
            <MdDelete />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="admin-card admin-page-schedules">
      <div className="admin-toolbar">
        <h3>Lịch khởi hành</h3>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span className="admin-toolbar__meta">
            {filteredSchedules.length} lịch
          </span>

          <button
            className="admin-btn admin-btn--primary"
            onClick={() => setShowAddModal(true)}
            disabled={submitting}
          >
            <FaPlus /> Thêm lịch khởi hành
          </button>

          <div className="admin-search-wrap">
            <FaSearch className="admin-search-icon" />
            <input
              className="admin-input-search"
              placeholder="Tìm theo tên tour..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>
        </div>
      </div>

      {error && <p className="admin-state admin-state--error">{error}</p>}

      {loading ? (
        <p className="admin-state">Đang tải lịch khởi hành...</p>
      ) : (
        <DataTable
          columns={columns}
          data={paginatedSchedules}
          emptyText="Không tìm thấy lịch khởi hành"
        />
      )}

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />

      <AddScheduleModal
        open={showAddModal}
        loading={submitting}
        onClose={() => {
          if (submitting) return;
          setShowAddModal(false);
        }}
        onSubmit={handleAddSubmit}
      />

      <EditScheduleModal
        open={showEditModal}
        schedule={selectedSchedule}
        loading={submitting}
        onClose={() => {
          if (submitting) return;
          setShowEditModal(false);
          setSelectedSchedule(null);
        }}
        onSubmit={handleEditSubmit}
      />

      <ConfirmModal
        open={showDeleteConfirm}
        title="Xóa lịch khởi hành"
        message={`Bạn có chắc muốn xóa lịch khởi hành${
          selectedSchedule
            ? ` của "${selectedSchedule.ten_tour}"`
            : ""
        } không?`}
        confirmText="Xác nhận xóa"
        cancelText="Hủy"
        onCancel={() => {
          if (submitting) return;
          setShowDeleteConfirm(false);
          setSelectedSchedule(null);
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

export default TourSchedules;
