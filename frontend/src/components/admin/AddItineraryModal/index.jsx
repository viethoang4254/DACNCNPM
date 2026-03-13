import { useEffect, useState } from "react";
import { MdClose } from "react-icons/md";
import { getAuthToken } from "../../../utils/authStorage";
import "./AddItineraryModal.scss";

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

function AddItineraryModal({ open, loading = false, onClose, onSubmit }) {
  const [tours, setTours] = useState([]);
  const [toursLoading, setToursLoading] = useState(false);
  const [tourId, setTourId] = useState("");
  const [ngayThu, setNgayThu] = useState("");
  const [tieuDe, setTieuDe] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!open) {
      setTourId("");
      setNgayThu("");
      setTieuDe("");
      setDescription("");
      setImageUrl("");
      setUploadingImage(false);
      setErrors({});
      return;
    }

    fetchTours();
  }, [open]);

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
      image_url: imageUrl.trim(),
    });
  }

  async function handleUploadFile(event) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) return;

    try {
      setUploadingImage(true);

      const formData = new FormData();
      formData.append("image", file);

      const payload = await fetchJson(
        `${API_BASE_URL}/api/admin/itineraries/upload-image`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${getAuthToken()}`,
          },
          body: formData,
        },
      );

      const uploadedUrl = payload?.data?.image_url || "";
      setImageUrl(uploadedUrl);
      setErrors((prev) => ({ ...prev, imageUrl: "" }));
    } catch (error) {
      setErrors((prev) => ({
        ...prev,
        imageUrl: error.message || "Upload ảnh thất bại.",
      }));
    } finally {
      setUploadingImage(false);
    }
  }

  if (!open) return null;

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
            <h3>Thêm lịch trình</h3>
            <p>Tạo lịch trình tour theo từng ngày</p>
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

          <div className="itinerary-modal__field">
            <label className="itinerary-modal__label">Ảnh (image_url)</label>
            <div className="itinerary-modal__image-row">
              <input
                type="text"
                className="admin-input"
                value={imageUrl}
                onChange={(event) => {
                  setImageUrl(event.target.value);
                  setErrors((prev) => ({ ...prev, imageUrl: "" }));
                }}
                disabled={loading || uploadingImage}
                placeholder="Nhập URL hoặc upload ảnh"
              />
              <label
                className={`admin-btn admin-btn--ghost itinerary-modal__upload-btn${uploadingImage ? " is-uploading" : ""}`}
              >
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleUploadFile}
                  disabled={loading || uploadingImage}
                  hidden
                />
                {uploadingImage ? "Đang upload..." : "Upload ảnh"}
              </label>
            </div>
            {errors.imageUrl && (
              <p className="admin-field-error">{errors.imageUrl}</p>
            )}
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
              disabled={loading || toursLoading || uploadingImage}
            >
              {loading ? "Đang lưu..." : "Lưu"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddItineraryModal;
