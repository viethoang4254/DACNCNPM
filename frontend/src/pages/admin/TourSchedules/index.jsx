import { useEffect, useMemo, useState } from "react";
import { FaPlus, FaSearch } from "react-icons/fa";
import { MdVisibility } from "react-icons/md";

import DataTable from "../../../components/admin/DataTable";
import Pagination from "../../../components/admin/Pagination";
import ConfirmModal from "../../../components/admin/ConfirmModal";
import AddScheduleModal from "../../../components/admin/AddScheduleModal";
import EditScheduleModal from "../../../components/admin/EditScheduleModal";
import TourSchedulesViewModal from "../../../components/admin/TourSchedulesViewModal";

import apiClient from "../../../utils/apiClient";
import { formatDateVi, toDateKey } from "../../../utils/dateOnly";
import "./TourSchedules.scss";

const LIMIT = 10;

function TourSchedules() {
  const duplicateScheduleMessage =
    "Tour này đã có lịch khởi hành vào ngày đã chọn.";
  const duplicateScheduleUxMessage =
    "Tour này đã có lịch khởi hành vào ngày đã chọn. Vui lòng chọn ngày khác.";

  const [schedules, setSchedules] = useState([]);
  const [tours, setTours] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [search, setSearch] = useState("");
  const [startDateFilter, setStartDateFilter] = useState("");
  const [page, setPage] = useState(1);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [addScheduleError, setAddScheduleError] = useState("");
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [selectedTour, setSelectedTour] = useState(null);
  const [tourSchedules, setTourSchedules] = useState([]);
  const [viewLoading, setViewLoading] = useState(false);
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

  const formatDate = (dateStr) => formatDateVi(dateStr);

  async function fetchBaseData() {
    try {
      setLoading(true);
      setError("");

      const [scheduleRes, toursRes] = await Promise.all([
        apiClient.get("/api/schedules"),
        apiClient.get("/api/tours", {
          params: { page: 1, limit: 300, sort: "latest" },
        }),
      ]);

      setSchedules(
        Array.isArray(scheduleRes.data?.data) ? scheduleRes.data.data : [],
      );
      setTours(Array.isArray(toursRes.data?.data) ? toursRes.data.data : []);
    } catch (err) {
      setError(getApiMessage(err, "Không thể tải danh sách lịch khởi hành"));
    } finally {
      setLoading(false);
    }
  }

  async function fetchSchedulesByTour(tourId) {
    try {
      setViewLoading(true);
      const res = await apiClient.get("/api/schedules");
      const allSchedules = Array.isArray(res.data?.data) ? res.data.data : [];
      const items = allSchedules
        .filter((schedule) => Number(schedule.tour_id) === Number(tourId))
        .sort((a, b) =>
          toDateKey(a.start_date).localeCompare(toDateKey(b.start_date)),
        );
      setTourSchedules(items);
      return items;
    } catch (err) {
      openNotification(
        "Lỗi",
        getApiMessage(err, "Không thể tải lịch của tour"),
        "danger",
      );
      setTourSchedules([]);
      return [];
    } finally {
      setViewLoading(false);
    }
  }

  useEffect(() => {
    fetchBaseData();
  }, []);

  function openNotification(title, message, variant = "primary") {
    setNotification({ open: true, title, message, variant });
  }

  async function handleAddSubmit(payload) {
    try {
      setSubmitting(true);
      setAddScheduleError("");
      await apiClient.post("/api/schedules", payload);
      setShowAddModal(false);
      await fetchBaseData();

      if (showViewModal && selectedTour) {
        await fetchSchedulesByTour(selectedTour.id);
      }

      openNotification(
        "Thành công",
        "Thêm lịch khởi hành thành công",
        "primary",
      );
    } catch (err) {
      const apiMessage = err?.response?.data?.message;
      const friendlyMessage =
        apiMessage === duplicateScheduleMessage
          ? duplicateScheduleUxMessage
          : "Không thể tạo lịch khởi hành. Vui lòng thử lại.";

      setAddScheduleError(friendlyMessage);
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
      await fetchBaseData();

      if (selectedTour) {
        await fetchSchedulesByTour(selectedTour.id);
      }

      setSelectedSchedule(null);
      openNotification("Thành công", "Cập nhật lịch thành công", "primary");
    } catch (err) {
      openNotification(
        "Lỗi",
        getApiMessage(err, "Cập nhật lịch thất bại"),
        "danger",
      );
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
      await fetchBaseData();

      if (selectedTour) {
        const items = await fetchSchedulesByTour(selectedTour.id);
        if (showViewModal && items.length === 0) {
          setShowViewModal(false);
          setSelectedTour(null);
          setTourSchedules([]);
        }
      }

      setSelectedSchedule(null);
      openNotification(
        "Thành công",
        "Xóa lịch khởi hành thành công",
        "primary",
      );
    } catch (err) {
      setShowDeleteConfirm(false);
      openNotification(
        "Lỗi",
        getApiMessage(err, "Xóa lịch thất bại"),
        "danger",
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleOpenView(row) {
    setSelectedTour(row);
    const items = await fetchSchedulesByTour(row.id);
    setTourSchedules(items);
    setShowViewModal(true);
  }

  const groupedTours = useMemo(() => {
    const tourMap = new Map(tours.map((tour) => [Number(tour.id), tour]));
    const grouped = new Map();

    schedules.forEach((schedule) => {
      const tourId = Number(schedule.tour_id);
      const tour = tourMap.get(tourId);
      const current = grouped.get(tourId) || {
        id: tourId,
        ten_tour: schedule.ten_tour || tour?.ten_tour || `Tour #${tourId}`,
        slots: Number(tour?.so_nguoi_toi_da || 0),
        booked_slots: 0,
        remaining_slots: 0,
        schedules_count: 0,
        primaryScheduleDate: null,
      };

      const remaining = Number(schedule.available_slots || 0);
      const totalSlots = Number(tour?.so_nguoi_toi_da || current.slots || 0);
      const booked = Math.max(0, totalSlots - remaining);

      current.slots = totalSlots;
      current.schedules_count += 1;

      if (
        !current.primaryScheduleDate ||
        toDateKey(schedule.start_date) <
          toDateKey(current.primaryScheduleDate)
      ) {
        current.primaryScheduleDate = schedule.start_date;
        current.remaining_slots = remaining;
        current.booked_slots = booked;
      }

      grouped.set(tourId, current);
    });

    return [...grouped.values()].sort((a, b) => a.id - b.id);
  }, [schedules, tours]);

  const filteredTours = groupedTours.filter((tour) => {
    const keyword = search.trim().toLowerCase();
    const matchesKeyword =
      !keyword ||
      String(tour.ten_tour || "")
        .toLowerCase()
        .includes(keyword);

    const matchesDate =
      !startDateFilter ||
      schedules.some(
        (schedule) =>
          Number(schedule.tour_id) === Number(tour.id) &&
            toDateKey(schedule.start_date) === startDateFilter,
      );

    return matchesKeyword && matchesDate;
  });

  const totalPages = Math.max(1, Math.ceil(filteredTours.length / LIMIT));
  const paginatedTours = filteredTours.slice((page - 1) * LIMIT, page * LIMIT);

  useEffect(() => {
    if (page > totalPages) setPage(1);
  }, [page, totalPages]);

  const columns = [
    { key: "id", header: "ID" },
    { key: "ten_tour", header: "Tên tour", className: "schedule-tour-col" },
    {
      key: "slots",
      header: "Số chỗ",
      render: (row) => <span className="slots-badge">{row.slots}</span>,
    },
    {
      key: "booked_slots",
      header: "Đã đặt",
      render: (row) => (
        <span className="schedule-stat schedule-stat--booked">
          {row.booked_slots}
        </span>
      ),
    },
    {
      key: "remaining_slots",
      header: "Còn lại",
      render: (row) => (
        <span className="schedule-stat schedule-stat--remaining">
          {row.remaining_slots}
        </span>
      ),
    },
    {
      key: "schedules_count",
      header: "Số lịch khởi hành",
      render: (row) => (
        <span className="schedule-stat">{row.schedules_count}</span>
      ),
    },
    {
      key: "actions",
      header: "Thao tác",
      render: (row) => (
        <div className="admin-icon-actions">
          <button
            className="admin-icon-btn"
            onClick={() => handleOpenView(row)}
            disabled={submitting || viewLoading}
            type="button"
            title="Xem lịch khởi hành"
          >
            <MdVisibility />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="admin-card admin-page-schedules">
      <div className="admin-toolbar">
        <h3>Quản lý lịch khởi hành</h3>

        <div className="admin-page-schedules__actions">
          <span className="admin-toolbar__meta">
            {filteredTours.length} tour
          </span>

          <button
            className="admin-btn admin-btn--primary"
            onClick={() => {
              setSelectedTour(null);
              setAddScheduleError("");
              setShowAddModal(true);
            }}
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

          <input
            type="date"
            className="admin-input admin-page-schedules__date-input"
            value={startDateFilter}
            onChange={(e) => {
              setStartDateFilter(e.target.value);
              setPage(1);
            }}
            aria-label="Lọc theo ngày khởi hành"
          />
        </div>
      </div>

      {error && <p className="admin-state admin-state--error">{error}</p>}

      {loading ? (
        <p className="admin-state">Đang tải lịch khởi hành...</p>
      ) : (
        <DataTable
          columns={columns}
          data={paginatedTours}
          emptyText="Không tìm thấy tour có lịch khởi hành"
        />
      )}

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />

      <TourSchedulesViewModal
        open={showViewModal}
        tour={selectedTour}
        schedules={tourSchedules}
        loading={submitting || viewLoading}
        onClose={() => {
          if (submitting || viewLoading) return;
          setShowViewModal(false);
          setSelectedTour(null);
          setTourSchedules([]);
        }}
        onAdd={() => {
          setAddScheduleError("");
          setShowAddModal(true);
        }}
        onEdit={(schedule) => {
          setSelectedSchedule({
            ...schedule,
            ten_tour: selectedTour?.ten_tour || schedule.ten_tour,
            max_slots:
              schedule.so_nguoi_toi_da ||
              selectedTour?.slots ||
              tours.find((tour) => Number(tour.id) === Number(schedule.tour_id))
                ?.so_nguoi_toi_da ||
              0,
          });
          setShowEditModal(true);
        }}
        onDelete={(schedule) => {
          setSelectedSchedule({
            ...schedule,
            ten_tour: selectedTour?.ten_tour || schedule.ten_tour,
          });
          setShowDeleteConfirm(true);
        }}
        formatDate={formatDate}
      />

      <AddScheduleModal
        open={showAddModal}
        loading={submitting}
        initialTourId={selectedTour?.id || ""}
        lockTour={Boolean(selectedTour)}
        apiError={addScheduleError}
        onClearApiError={() => setAddScheduleError("")}
        onClose={() => {
          if (submitting) return;
          setAddScheduleError("");
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
            ? ` ngày ${formatDate(selectedSchedule.start_date)} của "${selectedSchedule.ten_tour}"`
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
