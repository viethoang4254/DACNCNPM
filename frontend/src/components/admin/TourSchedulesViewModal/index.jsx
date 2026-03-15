import { MdClose, MdDelete } from "react-icons/md";
import { PiPencilLineFill } from "react-icons/pi";
import "./style.scss";

const STATUS_META = {
  "Sắp khởi hành": { icon: "🟢", className: "status--upcoming" },
  "Đang khởi hành": { icon: "🟠", className: "status--ongoing" },
  "Đã khởi hành": { icon: "🔴", className: "status--done" },
};

const getSlotMessage = (slots) => {
  const value = Number(slots || 0);
  if (value <= 0) return "Hết chỗ";
  return `Còn lại ${value} chỗ`;
};

function TourSchedulesViewModal({
  open,
  tour,
  schedules = [],
  loading = false,
  onClose,
  onAdd,
  onEdit,
  onDelete,
  formatDate,
}) {
  if (!open) return null;

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

          {schedules.length === 0 ? (
            <p className="tour-schedules-view-modal__empty">
              Tour này chưa có lịch khởi hành.
            </p>
          ) : (
            <div className="tour-schedules-view-modal__list">
              {schedules.map((schedule) => (
                <div
                  className="tour-schedules-view-modal__item"
                  key={schedule.id}
                >
                  <div className="tour-schedules-view-modal__item-top">
                    <span className="tour-schedules-view-modal__item-date">
                      📅 {formatDate(schedule.start_date)}
                    </span>
                    <span
                      className={`tour-schedules-view-modal__status ${STATUS_META[schedule.status]?.className || ""}`}
                    >
                      {STATUS_META[schedule.status]?.icon || "ℹ️"}{" "}
                      {schedule.status || "Không rõ"}
                    </span>
                  </div>

                  <div className="tour-schedules-view-modal__item-main">
                    {/* <span className="tour-schedules-view-modal__item-meta">
                      {getSlotMessage(schedule.available_slots)}
                    </span> */}
                    {schedule.status === "Đã khởi hành" && (
                      <span className="tour-schedules-view-modal__item-lock">
                        Đã kết thúc - Không thể chỉnh sửa
                      </span>
                    )}
                  </div>

                  <div className="admin-icon-actions">
                    <button
                      type="button"
                      className="admin-icon-btn"
                      title="Sửa"
                      onClick={() => onEdit?.(schedule)}
                      disabled={loading || schedule.status === "Đã khởi hành"}
                    >
                      <PiPencilLineFill />
                    </button>
                    <button
                      type="button"
                      className="admin-icon-btn admin-icon-btn--danger"
                      title="Xóa"
                      onClick={() => onDelete?.(schedule)}
                      disabled={loading || schedule.status === "Đã khởi hành"}
                    >
                      <MdDelete />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default TourSchedulesViewModal;
