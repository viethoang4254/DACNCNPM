import { useEffect, useState } from "react";
import { MdClose } from "react-icons/md";
import "./EditItineraryModal.scss";

const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000"
).replace(/\/+$/, "");

async function fetchJson(url, options = {}) {
  const response = await fetch(url, options);
  const raw = await response.text();
  const payload = raw ? JSON.parse(raw) : {};

  if (!response.ok) {
    throw new Error(payload?.message || "Request failed");
  }

  return payload;
}

function EditItineraryModal({
  open,
  itinerary,
  loading = false,
  onClose,
  onSubmit,
}) {
  const [tours, setTours] = useState([]);
  const [toursLoading, setToursLoading] = useState(false);

  const [tourId, setTourId] = useState("");
  const [ngayThu, setNgayThu] = useState("");
  const [tieuDe, setTieuDe] = useState("");
  const [description, setDescription] = useState("");
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!open || !itinerary) {
      setTourId("");
      setNgayThu("");
      setTieuDe("");
      setDescription("");
      setErrors({});
      return;
    }

    setTourId(String(itinerary.tour_id ?? ""));
    setNgayThu(String(itinerary.ngay_thu ?? ""));
    setTieuDe(itinerary.tieu_de || "");
    setDescription(itinerary.description || "");
    fetchTours();
  }, [open, itinerary]);

  async function fetchTours() {
    try {
      setToursLoading(true);
      const payload = await fetchJson(
        `${API_BASE_URL}/api/tours?page=1&limit=200&sort=latest`,
      );
      setTours(Array.isArray(payload?.data) ? payload.data : []);
    } catch {
      setTours([]);
    } finally {
      setToursLoading(false);
    }
  }

  function validate() {
    const nextErrors = {};

    if (!tourId) {
      nextErrors.tourId = "Vui lòng chọn tour.";
    }

    if (
      !ngayThu ||
      !Number.isInteger(Number(ngayThu)) ||
      Number(ngayThu) <= 0
    ) {
      nextErrors.ngayThu = "Ngày thứ phải là số nguyên > 0.";
    }

    if (!tieuDe.trim()) {
      nextErrors.tieuDe = "Vui lòng nhập tiêu đề.";
    }

    return nextErrors;
  }

  function handleSubmit(event) {
    event.preventDefault();
    const nextErrors = validate();

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    onSubmit({
      tour_id: Number(tourId),
      ngay_thu: Number(ngayThu),
      tieu_de: tieuDe.trim(),
      description: description.replace(/\r\n/g, "\n"),
    });
  }

  if (!open || !itinerary) return null;

  return (
    <div
      className="admin-modal__backdrop"
      onClick={(event) =>
        event.target === event.currentTarget && !loading && onClose()
      }
    >
      <div className="itinerary-modal">
        <div className="itinerary-modal__header">
          <div>
            <h3>Chỉnh sửa lịch trình</h3>
            <p>ID lịch trình: #{itinerary.id}</p>
          </div>
          <button
            className="itinerary-modal__close"
            onClick={onClose}
            disabled={loading}
            type="button"
            aria-label="Đóng"
          >
            <MdClose />
          </button>
        </div>

        <form
          className="itinerary-modal__body"
          onSubmit={handleSubmit}
          noValidate
        >
          <div className="itinerary-modal__field">
            <label className="itinerary-modal__label">Tour</label>
            <select
              className={`admin-select${errors.tourId ? " admin-input--invalid" : ""}`}
              value={tourId}
              onChange={(event) => {
                setTourId(event.target.value);
                setErrors((prev) => ({ ...prev, tourId: "" }));
              }}
              disabled={loading || toursLoading}
            >
              <option value="">
                {toursLoading ? "Đang tải..." : "-- Chọn tour --"}
              </option>
              {tours.map((tour) => (
                <option key={tour.id} value={tour.id}>
                  {tour.ten_tour}
                </option>
              ))}
            </select>
            {errors.tourId && (
              <p className="admin-field-error">{errors.tourId}</p>
            )}
          </div>

          <div className="itinerary-modal__field">
            <label className="itinerary-modal__label">Ngày thứ</label>
            <input
              type="number"
              className={`admin-input${errors.ngayThu ? " admin-input--invalid" : ""}`}
              value={ngayThu}
              min={1}
              onChange={(event) => {
                setNgayThu(event.target.value);
                setErrors((prev) => ({ ...prev, ngayThu: "" }));
              }}
              disabled={loading}
            />
            {errors.ngayThu && (
              <p className="admin-field-error">{errors.ngayThu}</p>
            )}
          </div>

          <div className="itinerary-modal__field">
            <label className="itinerary-modal__label">Tiêu đề</label>
            <input
              type="text"
              className={`admin-input${errors.tieuDe ? " admin-input--invalid" : ""}`}
              value={tieuDe}
              onChange={(event) => {
                setTieuDe(event.target.value);
                setErrors((prev) => ({ ...prev, tieuDe: "" }));
              }}
              disabled={loading}
            />
            {errors.tieuDe && (
              <p className="admin-field-error">{errors.tieuDe}</p>
            )}
          </div>

          <div className="itinerary-modal__field">
            <label className="itinerary-modal__label">Mô tả lịch trình</label>
            <textarea
              className="admin-textarea"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              disabled={loading}
            />
          </div>

          <div className="itinerary-modal__footer">
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
              {loading ? "Đang lưu..." : "Lưu"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditItineraryModal;
