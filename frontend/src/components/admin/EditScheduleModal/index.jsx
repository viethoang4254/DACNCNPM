import { useEffect, useState } from "react";
import { MdClose } from "react-icons/md";
import "./EditScheduleModal.scss";

function EditScheduleModal({
  open,
  schedule,
  loading = false,
  onClose,
  onSubmit,
}) {
  const [startDate, setStartDate] = useState("");
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!open || !schedule) {
      setStartDate("");
      setErrors({});
      return;
    }
    setStartDate(
      schedule.start_date ? String(schedule.start_date).slice(0, 10) : "",
    );
  }, [open, schedule]);

  function validate() {
    const errs = {};
    if (!startDate) errs.startDate = "Vui lòng chọn ngày khởi hành.";
    return errs;
  }

  function handleSubmit(e) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }
    onSubmit({ start_date: startDate });
  }

  if (!open || !schedule) return null;

  return (
    <div
      className="admin-modal__backdrop"
      onClick={(e) =>
        e.target === e.currentTarget && !loading && onClose()
      }
    >
      <div className="schedule-modal">
        <div className="schedule-modal__header">
          <div>
            <h3>Chỉnh sửa lịch khởi hành</h3>
            <p className="schedule-modal__tour-name">{schedule.ten_tour}</p>
          </div>
          <button
            className="schedule-modal__close"
            onClick={onClose}
            disabled={loading}
            type="button"
            aria-label="Đóng"
          >
            <MdClose />
          </button>
        </div>

        <form className="schedule-modal__body" onSubmit={handleSubmit} noValidate>
          <div className="schedule-modal__field">
            <label className="schedule-modal__label">Ngày khởi hành</label>
            <input
              type="date"
              className={`admin-input${errors.startDate ? " admin-input--invalid" : ""}`}
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setErrors((p) => ({ ...p, startDate: "" }));
              }}
              disabled={loading}
            />
            {errors.startDate && (
              <p className="admin-field-error">{errors.startDate}</p>
            )}
          </div>

          <div className="schedule-modal__footer">
            <button
              type="button"
              className="admin-btn"
              onClick={onClose}
              disabled={loading}
            >
              Hủy
            </button>
            <button
              type="submit"
              className="admin-btn admin-btn--primary"
              disabled={loading}
            >
              {loading ? "Đang lưu..." : "Lưu thay đổi"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditScheduleModal;
