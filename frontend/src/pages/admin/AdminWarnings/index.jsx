import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { LuEye } from "react-icons/lu";
import { FaBell, FaCircle, FaTimesCircle } from "react-icons/fa";
import DataTable from "../../../components/admin/DataTable";
import TourSchedulesViewModal from "../../../components/admin/TourSchedulesViewModal";
import apiClient from "../../../utils/apiClient";
import {
  formatDateVi,
  getDaysLeftFromDateKey,
  toDateKey,
} from "../../../utils/dateOnly";
import "./AdminWarnings.scss";

const MIN_RATIO = 0.5;

const toRatio = (percentValue) => {
  const value = Number(percentValue || 0);
  if (!Number.isFinite(value)) return 0;
  if (value > 1) return value / 100;
  return value;
};

const formatDate = (value) => {
  return formatDateVi(value, "-");
};

const formatPercent = (ratio) => `${Math.round(Number(ratio || 0) * 100)}%`;

const resolveScheduleStatus = (item, daysLeft) => {
  const ratio = toRatio(item.percent);
  if (daysLeft < 0) return "completed";
  if (ratio >= MIN_RATIO) return "guaranteed";
  if (daysLeft === 0 && ratio < MIN_RATIO) return "cancelled";
  if (daysLeft <= 2 && ratio < MIN_RATIO) return "warning_critical";
  if (daysLeft <= 7 && ratio < MIN_RATIO) return "warning";
  return "open";
};

const resolveDaysLeft = (item) => {
  const computedDaysLeft = getDaysLeftFromDateKey(item?.start_date);
  if (Number.isFinite(computedDaysLeft)) return computedDaysLeft;

  const apiDaysLeft = Number(item?.days_left);
  if (Number.isFinite(apiDaysLeft)) return apiDaysLeft;

  return Number.POSITIVE_INFINITY;
};

function AdminWarnings() {
  const [rows, setRows] = useState([]);
  const [allSchedules, setAllSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("critical");
  const [selectedTour, setSelectedTour] = useState(null);
  const [openModal, setOpenModal] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function fetchWarnings() {
      try {
        setLoading(true);
        setError("");

        const [warningRes, schedulesRes] = await Promise.all([
          apiClient.get("/api/schedules/warning"),
          apiClient.get("/api/schedules"),
        ]);

        if (!mounted) return;

        setRows(
          Array.isArray(warningRes.data?.data) ? warningRes.data.data : [],
        );
        setAllSchedules(
          Array.isArray(schedulesRes.data?.data) ? schedulesRes.data.data : [],
        );
      } catch (err) {
        if (!mounted) return;
        setError(
          err?.response?.data?.message || "Không thể tải dữ liệu cảnh báo",
        );
      } finally {
        if (mounted) setLoading(false);
      }
    }

    fetchWarnings();

    return () => {
      mounted = false;
    };
  }, []);

  const normalizedRows = useMemo(
    () =>
      rows.map((item) => {
        const daysLeft = resolveDaysLeft(item);
        return {
          ...item,
          days_left: daysLeft,
          status: resolveScheduleStatus(item, daysLeft),
        };
      }),
    [rows],
  );

  const warningSchedules = useMemo(
    () => normalizedRows.filter((item) => item.status === "warning"),
    [normalizedRows],
  );

  const criticalSchedules = useMemo(
    () => normalizedRows.filter((item) => item.status === "warning_critical"),
    [normalizedRows],
  );

  const cancelledSchedules = useMemo(
    () => normalizedRows.filter((item) => item.status === "cancelled"),
    [normalizedRows],
  );

  const totalAlerts = warningSchedules.length + criticalSchedules.length;

  const dataMap = {
    critical: criticalSchedules,
    warning: warningSchedules,
    cancelled: cancelledSchedules,
  };

  const headingMap = {
    critical: "Nguy cơ hủy",
    warning: "Thiếu khách",
    cancelled: "Đã hủy",
  };

  const emptyMap = {
    critical: "Không có lịch nguy cơ hủy",
    warning: "Không có lịch thiếu khách",
    cancelled: "Không có lịch đã hủy",
  };

  const currentData = dataMap[activeTab] || [];

  const schedulesForSelectedTour = useMemo(() => {
    if (!selectedTour?.tour_id) return [];

    return allSchedules
      .filter(
        (schedule) => Number(schedule.tour_id) === Number(selectedTour.tour_id),
      )
      .sort((a, b) =>
        toDateKey(a.start_date).localeCompare(toDateKey(b.start_date)),
      );
  }, [allSchedules, selectedTour]);

  const columns = [
    { key: "ten_tour", header: "Tour" },
    {
      key: "start_date",
      header: "Ngày đi",
      render: (row) => formatDate(row.start_date),
    },
    {
      key: "booked_slots",
      header: "Đã đặt",
      render: (row) => `${row.booked_slots}/${row.max_slots}`,
    },
    {
      key: "percent",
      header: "%",
      render: (row) => formatPercent(toRatio(row.percent)),
    },
    {
      key: "days_left",
      header: "Còn bao nhiêu ngày",
      render: (row) => `${row.days_left} ngày`,
    },
    {
      key: "actions",
      header: "Thao tác",
      render: (row) => (
        <div className="admin-icon-actions">
          <button
            type="button"
            className="admin-icon-btn"
            title="Xem chi tiết"
            aria-label={`Xem chi tiết lịch của tour ${row.ten_tour}`}
            onClick={() => {
              setSelectedTour({ tour_id: row.tour_id, ten_tour: row.ten_tour });
              setOpenModal(true);
            }}
          >
            <LuEye aria-hidden="true" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="admin-card admin-page-warnings">
      <div className="admin-toolbar">
        <h3>Cảnh báo lịch khởi hành</h3>
        <span className="admin-toolbar__meta admin-page-warnings__meta">
          <FaBell aria-hidden="true" /> Cảnh báo ({totalAlerts})
        </span>
      </div>

      {loading && <p className="admin-state">Đang tải cảnh báo...</p>}
      {!loading && error && (
        <p className="admin-state admin-state--error">{error}</p>
      )}

      {!loading && !error ? (
        <div className="admin-page-warnings__sections">
          <div
            className="admin-page-warnings__tabs"
            role="tablist"
            aria-label="Bộ lọc cảnh báo lịch khởi hành"
          >
            <button
              type="button"
              className={`admin-page-warnings__tab ${activeTab === "critical" ? "is-active" : ""}`}
              onClick={() => setActiveTab("critical")}
            >
              <FaCircle
                className="admin-page-warnings__dot admin-page-warnings__dot--critical"
                aria-hidden="true"
              />
              Nguy cơ hủy ({criticalSchedules.length})
            </button>
            <button
              type="button"
              className={`admin-page-warnings__tab ${activeTab === "warning" ? "is-active" : ""}`}
              onClick={() => setActiveTab("warning")}
            >
              <FaCircle
                className="admin-page-warnings__dot admin-page-warnings__dot--warning"
                aria-hidden="true"
              />
              Thiếu khách ({warningSchedules.length})
            </button>
            <button
              type="button"
              className={`admin-page-warnings__tab ${activeTab === "cancelled" ? "is-active" : ""}`}
              onClick={() => setActiveTab("cancelled")}
            >
              <FaTimesCircle
                className="admin-page-warnings__dot admin-page-warnings__dot--cancelled"
                aria-hidden="true"
              />
              Đã hủy ({cancelledSchedules.length})
            </button>
          </div>

          <section className="admin-page-warnings__section">
            <h4 className="admin-page-warnings__heading">
              {activeTab === "critical" && (
                <FaCircle
                  className="admin-page-warnings__dot admin-page-warnings__dot--critical"
                  aria-hidden="true"
                />
              )}
              {activeTab === "warning" && (
                <FaCircle
                  className="admin-page-warnings__dot admin-page-warnings__dot--warning"
                  aria-hidden="true"
                />
              )}
              {activeTab === "cancelled" && (
                <FaTimesCircle
                  className="admin-page-warnings__dot admin-page-warnings__dot--cancelled"
                  aria-hidden="true"
                />
              )}
              {headingMap[activeTab]} ({currentData.length})
            </h4>
            <DataTable
              columns={columns}
              data={currentData}
              emptyText={emptyMap[activeTab]}
            />
          </section>

          <p className="admin-page-warnings__hint">
            Quản lý lịch chi tiết tại{" "}
            <Link to="/admin/schedules">Quản lý lịch khởi hành</Link>.
          </p>
        </div>
      ) : null}

      <TourSchedulesViewModal
        open={openModal}
        tour={selectedTour}
        schedules={schedulesForSelectedTour}
        loading={false}
        readOnly
        onClose={() => {
          setOpenModal(false);
          setSelectedTour(null);
        }}
        onAdd={() => {}}
        onEdit={() => {}}
        onDelete={() => {}}
        formatDate={formatDate}
      />
    </div>
  );
}

export default AdminWarnings;
