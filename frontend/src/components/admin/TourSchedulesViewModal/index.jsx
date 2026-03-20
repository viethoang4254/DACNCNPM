import { useEffect, useMemo, useRef } from "react";
import { MdClose, MdDelete } from "react-icons/md";
import { PiPencilLineFill } from "react-icons/pi";
import { FaCircle, FaFireAlt } from "react-icons/fa";
import { BiSolidDiscount } from "react-icons/bi";
import { HiExclamationTriangle } from "react-icons/hi2";
import { LuCalendarDays } from "react-icons/lu";
import { getDaysLeftFromDateKey } from "../../../utils/dateOnly";
import "./style.scss";

const STATUS_META = {
  open: { className: "status--open" },
  warning: { className: "status--warning" },
  warning_critical: { className: "status--cancelled" },
  guaranteed: { className: "status--guaranteed" },
  full: { className: "status--full" },
  cancelled: { className: "status--cancelled" },
  completed: { className: "status--completed" },
};

const STATUS_TEXT = {
  completed: "Đã kết thúc",
  cancelled: "Đã hủy",
  warning_critical: "Nguy cơ hủy",
  warning: "Thiếu khách",
  guaranteed: "Đảm bảo khởi hành",
  full: "Đã đầy",
  open: "",
};

const ALERT_LEVEL_BY_STATUS = {
  cancelled: "neutral",
  warning_critical: "critical",
  warning: "warning",
  guaranteed: "stable",
  full: "stable",
  completed: "neutral",
  open: "neutral",
};

function getDaysLeft(start_date) {
  return getDaysLeftFromDateKey(start_date);
}

function getStatusIcon(status) {
  if (status === "warning_critical") {
    return (
      <FaCircle
        className="tour-schedules-view-modal__dot tour-schedules-view-modal__dot--critical"
        aria-hidden="true"
      />
    );
  }

  if (status === "warning") {
    return (
      <FaCircle
        className="tour-schedules-view-modal__dot tour-schedules-view-modal__dot--warning"
        aria-hidden="true"
      />
    );
  }

  if (status === "guaranteed") {
    return (
      <FaCircle
        className="tour-schedules-view-modal__dot tour-schedules-view-modal__dot--guaranteed"
        aria-hidden="true"
      />
    );
  }

  return null;
}

function calculateScheduleStatus(schedule) {
  const bookedSlots = Number(schedule?.booked_slots || 0);
  const maxSlots = Number(schedule?.max_slots || 0);
  const minRequiredRatio = Number(schedule?.min_required_ratio ?? 0.5);
  const daysLeft = getDaysLeft(schedule?.start_date);
  const percent = maxSlots > 0 ? bookedSlots / maxSlots : 0;

  let status = "open";

  if (daysLeft < 0) {
    status = "completed";
  } else if (percent >= 1) {
    status = "full";
  } else if (percent >= minRequiredRatio) {
    status = "guaranteed";
  } else if (daysLeft === 0 && percent < minRequiredRatio) {
    status = "cancelled";
  } else if (daysLeft <= 2 && percent < minRequiredRatio) {
    status = "warning_critical";
  } else if (daysLeft <= 7 && percent < minRequiredRatio) {
    status = "warning";
  } else {
    status = "open";
  }

  const statusText = STATUS_TEXT[status] || "";

  return {
    status,
    daysLeft,
    bookedSlots,
    maxSlots,
    percentText: `${Math.round(percent * 100)}%`,
    statusText,
    alertLevel: ALERT_LEVEL_BY_STATUS[status] || "neutral",
    compactText: ["completed", "full"].includes(status) ? statusText : "",
    alertText: ["cancelled", "warning_critical", "warning"].includes(status)
      ? statusText
      : "",
  };
}

function TourSchedulesViewModal({
  open,
  tour,
  schedules = [],
  loading = false,
  saleLoadingScheduleId = null,
  onClose,
  onAdd,
  onEdit,
  onDelete,
  onApplySale,
  onRemoveSale,
  targetScheduleId = null,
  formatDate,
  readOnly = false,
}) {
  const scheduleItemRefs = useRef(new Map());
  const saleActionRefs = useRef(new Map());
  const highlightScheduleId = useMemo(
    () => Number(targetScheduleId || 0),
    [targetScheduleId],
  );

  useEffect(() => {
    if (!open || !highlightScheduleId) return;

    const item = scheduleItemRefs.current.get(highlightScheduleId);
    if (item) {
      item.scrollIntoView({ behavior: "smooth", block: "center" });
    }

    const saleAction = saleActionRefs.current.get(highlightScheduleId);
    if (saleAction) {
      const timer = window.setTimeout(() => {
        saleAction.focus();
      }, 240);

      return () => {
        window.clearTimeout(timer);
      };
    }

    return undefined;
  }, [highlightScheduleId, open, schedules]);

  if (!open) return null;

  const renderSale = (schedule, isLocked) => {
    const isOnSale = Boolean(schedule?.is_on_sale);
    const discount = Number(schedule?.discount_percent || 0);
    const suggestedSale =
      Boolean(schedule?.suggested_sale) && !isOnSale && !isLocked;
    const suggestedDiscount = Number(
      schedule?.suggested_discount_percent || 20,
    );
    const isSaleUpdating =
      Number(saleLoadingScheduleId) === Number(schedule.id);

    if (isOnSale) {
      return (
        <div className="tour-schedules-view-modal__sale">
          <span className="tour-schedules-view-modal__sale-label">SALE</span>
          <span className="tour-schedules-view-modal__sale-badge tour-schedules-view-modal__sale-badge--active">
            <FaFireAlt aria-hidden="true" />
            🔥 -{Math.round(discount)}%
          </span>
          {!readOnly && (
            <button
              type="button"
              className="admin-btn admin-btn--danger tour-schedules-view-modal__sale-btn"
              onClick={() => onRemoveSale?.(schedule)}
              disabled={loading || isSaleUpdating}
              ref={(node) => {
                if (node) {
                  saleActionRefs.current.set(Number(schedule.id), node);
                  return;
                }
                saleActionRefs.current.delete(Number(schedule.id));
              }}
            >
              <MdClose aria-hidden="true" />❌ Hủy
            </button>
          )}
        </div>
      );
    }

    if (suggestedSale) {
      return (
        <div className="tour-schedules-view-modal__sale">
          <span className="tour-schedules-view-modal__sale-label">SALE</span>
          <span className="tour-schedules-view-modal__sale-badge tour-schedules-view-modal__sale-badge--suggested">
            <HiExclamationTriangle aria-hidden="true" />
            Đề xuất -{Math.round(suggestedDiscount)}%
          </span>
          {!readOnly && (
            <button
              type="button"
              className="admin-btn admin-btn--primary tour-schedules-view-modal__sale-btn"
              onClick={() => onApplySale?.(schedule)}
              disabled={loading || isSaleUpdating}
              ref={(node) => {
                if (node) {
                  saleActionRefs.current.set(Number(schedule.id), node);
                  return;
                }
                saleActionRefs.current.delete(Number(schedule.id));
              }}
            >
              <FaFireAlt aria-hidden="true" />
              Áp dụng
            </button>
          )}
        </div>
      );
    }

    return (
      <div className="tour-schedules-view-modal__sale">
        <span className="tour-schedules-view-modal__sale-label">SALE</span>
        <span className="tour-schedules-view-modal__sale-badge tour-schedules-view-modal__sale-badge--none">
          <BiSolidDiscount aria-hidden="true" />
        </span>
      </div>
    );
  };

  const renderScheduleItem = (schedule) => {
    const computed = calculateScheduleStatus(schedule);
    const statusKey = computed.status;
    const isLocked = ["completed", "cancelled"].includes(statusKey);
    const isHighlighted = Number(schedule.id) === highlightScheduleId;

    return (
      <div
        className={`tour-schedules-view-modal__item ${isHighlighted ? "tour-schedules-view-modal__item--target" : ""}`}
        key={schedule.id}
        ref={(node) => {
          if (node) {
            scheduleItemRefs.current.set(Number(schedule.id), node);
            return;
          }
          scheduleItemRefs.current.delete(Number(schedule.id));
        }}
      >
        <div className="tour-schedules-view-modal__item-top">
          <span className="tour-schedules-view-modal__item-date">
            <LuCalendarDays
              className="tour-schedules-view-modal__date-icon"
              aria-hidden="true"
            />
            {formatDate(schedule.start_date)}
          </span>
          <span
            className={`tour-schedules-view-modal__status ${STATUS_META[statusKey]?.className || ""}`}
          >
            {getStatusIcon(statusKey)}
            {computed.statusText || "Mở bán"}
          </span>
        </div>

        <div className="tour-schedules-view-modal__item-main">
          <div className="tour-schedules-view-modal__metrics">
            <span className="tour-schedules-view-modal__item-meta">
              Đã đặt:{" "}
              <strong>
                {computed.bookedSlots}/{computed.maxSlots} (
                {computed.percentText})
              </strong>
            </span>
            <span className="tour-schedules-view-modal__item-meta">
              {computed.compactText}
            </span>
            {computed.alertText && (
              <span
                className={`tour-schedules-view-modal__alert tour-schedules-view-modal__alert--${computed.alertLevel}`}
              >
                {getStatusIcon(statusKey)}
                {computed.alertText}
              </span>
            )}
            {renderSale(schedule, isLocked)}
          </div>

          {isLocked && (
            <span className="tour-schedules-view-modal__item-lock">
              {computed.status === "cancelled"
                ? "Đã hủy - Không thể chỉnh sửa"
                : "Đã kết thúc - Không thể chỉnh sửa"}
            </span>
          )}
        </div>

        {!readOnly && (
          <div className="admin-icon-actions">
            <button
              type="button"
              className="admin-icon-btn"
              title="Sửa"
              onClick={() => onEdit?.(schedule)}
              disabled={loading || isLocked}
            >
              <PiPencilLineFill />
            </button>
            <button
              type="button"
              className="admin-icon-btn admin-icon-btn--danger"
              title="Xóa"
              onClick={() => onDelete?.(schedule)}
              disabled={loading || isLocked}
            >
              <MdDelete />
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      className="admin-modal__backdrop"
      onClick={(event) => {
        if (event.target === event.currentTarget && !loading) {
          onClose?.();
        }
      }}
    >
      <div className="tour-schedules-view-modal">
        <div className="tour-schedules-view-modal__header">
          <div>
            <h3>Lịch khởi hành - {tour?.ten_tour || "Tour"}</h3>
            <p>{schedules.length} lịch khởi hành</p>
          </div>
          <button
            className="tour-schedules-view-modal__close"
            type="button"
            onClick={onClose}
            disabled={loading}
            aria-label="Đóng"
          >
            <MdClose />
          </button>
        </div>

        <div className="tour-schedules-view-modal__body">
          {!readOnly && (
            <div className="tour-schedules-view-modal__toolbar">
              <button
                type="button"
                className="admin-btn admin-btn--primary"
                onClick={onAdd}
                disabled={loading}
              >
                Thêm lịch khởi hành
              </button>
            </div>
          )}

          {schedules.length === 0 ? (
            <p className="tour-schedules-view-modal__empty">
              Tour này chưa có lịch khởi hành.
            </p>
          ) : (
            <div className="tour-schedules-view-modal__list">
              {schedules.map(renderScheduleItem)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default TourSchedulesViewModal;
