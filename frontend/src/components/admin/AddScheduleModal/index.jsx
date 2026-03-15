import { useEffect, useState } from "react";
import { MdClose } from "react-icons/md";
import apiClient from "../../../utils/apiClient";
import "./AddScheduleModal.scss";

const todayStr = () => new Date().toISOString().split("T")[0];

function AddScheduleModal({
  open,
  loading = false,
  onClose,
  onSubmit,
  initialTourId = "",
  lockTour = false,
  apiError = "",
  onClearApiError,
}) {
  const [tours, setTours] = useState([]);
  const [toursLoading, setToursLoading] = useState(false);
  const [tourId, setTourId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!open) {
      setTourId("");
      setStartDate("");
      setErrors({});
      return;
    }
    setTourId(initialTourId ? String(initialTourId) : "");
    fetchTours();
  }, [open, initialTourId]);

  async function fetchTours() {
    try {
      setToursLoading(true);
      const res = await apiClient.get("/api/tours", {
        params: { page: 1, limit: 200, sort: "latest" },
      });
      setTours(Array.isArray(res.data?.data) ? res.data.data : []);
    } catch {
      setTours([]);
    } finally {
      setToursLoading(false);
    }
  }

  function validate() {
    const errs = {};
    if (!tourId) errs.tourId = "Vui lòng chọn tour.";
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
    onSubmit({ tour_id: Number(tourId), start_date: startDate });
  }

  if (!open) return null;

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
            <h3>Thêm lịch khởi hành</h3>
            <p>Chọn tour và ngày khởi hành</p>
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
          {apiError && (
            <div className="schedule-modal__alert" role="alert">
              <strong>Cảnh báo:</strong> {apiError}
            </div>
          )}

          <div className="schedule-modal__field">
            <label className="schedule-modal__label">Tour</label>
            {lockTour ? (
              <input
                type="text"
                className="admin-input"
                value={tours.find((t) => String(t.id) === String(tourId))?.ten_tour || ""}
                disabled
                readOnly
              />
            ) : (
              <select
                className={`admin-select${errors.tourId ? " admin-input--invalid" : ""}`}
                value={tourId}
                onChange={(e) => {
                  setTourId(e.target.value);
                  setErrors((p) => ({ ...p, tourId: "" }));
                  onClearApiError?.();
                }}
                disabled={loading || toursLoading}
              >
                <option value="">
                  {toursLoading ? "Đang tải..." : "-- Chọn tour --"}
                </option>
                {tours.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.ten_tour}
                  </option>
                ))}
              </select>
            )}
            {errors.tourId && (
              <p className="admin-field-error">{errors.tourId}</p>
            )}
          </div>

          <div className="schedule-modal__field">
            <label className="schedule-modal__label">Ngày khởi hành</label>
            <input
              type="date"
              className={`admin-input${errors.startDate ? " admin-input--invalid" : ""}`}
              value={startDate}
              min={todayStr()}
              onChange={(e) => {
                setStartDate(e.target.value);
                setErrors((p) => ({ ...p, startDate: "" }));
                onClearApiError?.();
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
              disabled={loading || toursLoading}
            >
              {loading ? "Đang thêm..." : "Thêm lịch"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddScheduleModal;
