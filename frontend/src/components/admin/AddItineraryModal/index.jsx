import { useEffect, useState } from "react";
import { MdClose } from "react-icons/md";
import "./AddItineraryModal.scss";

const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000"
).replace(/\/+$/, "");

const defaultItineraryTemplates = [
  {
    title: "Ngày 1: Khởi hành và tham quan",
    description: "Đón khách tại điểm hẹn và khởi hành đến điểm du lịch.",
  },
  {
    title: "Ngày 2: Khám phá địa điểm nổi bật",
    description:
      "Tham quan các địa điểm nổi tiếng và trải nghiệm văn hóa địa phương.",
  },
  {
    title: "Ngày 3: Kết thúc hành trình",
    description: "Mua sắm đặc sản địa phương và kết thúc tour.",
  },
];

async function fetchJson(url, options = {}) {
  const response = await fetch(url, options);
  const raw = await response.text();
  const payload = raw ? JSON.parse(raw) : {};

  if (!response.ok) {
    throw new Error(payload?.message || "Request failed");
  }

  return payload;
}

function buildGeneratedItineraries(totalDays) {
  return Array.from({ length: totalDays }, (_, index) => {
    const dayNumber = index + 1;
    const template = defaultItineraryTemplates[index] || {
      title: `Ngày ${dayNumber}: Lịch trình tham quan`,
      description: `Hoạt động tham quan và trải nghiệm trong ngày ${dayNumber}.`,
    };

    return {
      day_number: dayNumber,
      title: template.title,
      description: template.description,
    };
  });
}

function AddItineraryModal({ open, loading = false, onClose, onSubmit }) {
  const [tours, setTours] = useState([]);
  const [toursLoading, setToursLoading] = useState(false);
  const [tourId, setTourId] = useState("");
  const [itineraries, setItineraries] = useState([]);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!open) {
      setTourId("");
      setItineraries([]);
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
    const selectedTour = tours.find(
      (tour) => String(tour.id) === String(tourId),
    );

    if (!tourId) {
      nextErrors.tourId = "Vui lòng chọn tour.";
    }

    if (!selectedTour) {
      nextErrors.tourId = "Tour không hợp lệ.";
    }

    if (itineraries.length === 0) {
      nextErrors.itineraries =
        "Vui lòng bấm Auto Generate Itinerary trước khi lưu.";
    }

    itineraries.forEach((item, index) => {
      if (!item.title.trim()) {
        nextErrors[`title-${index}`] = "Vui lòng nhập tiêu đề.";
      }
    });

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
      itineraries: itineraries.map((item) => ({
        day_number: Number(item.day_number),
        title: item.title.trim(),
        description: item.description.replace(/\r\n/g, "\n"),
      })),
    });
  }

  function handleAutoGenerate() {
    const selectedTour = tours.find(
      (tour) => String(tour.id) === String(tourId),
    );
    const totalDays = Number(selectedTour?.so_ngay || 0);

    if (!selectedTour || totalDays <= 0) {
      setErrors((prev) => ({
        ...prev,
        tourId: "Vui lòng chọn tour có số ngày hợp lệ.",
      }));
      return;
    }

    setItineraries(buildGeneratedItineraries(totalDays));
    setErrors((prev) => ({
      ...prev,
      tourId: "",
      itineraries: "",
    }));
  }

  function handleItineraryChange(index, field, value) {
    setItineraries((prev) =>
      prev.map((item, currentIndex) =>
        currentIndex === index ? { ...item, [field]: value } : item,
      ),
    );

    setErrors((prev) => ({
      ...prev,
      [`${field}-${index}`]: "",
      itineraries: "",
    }));
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
            <p>Tạo nhiều block lịch trình theo số ngày của tour</p>
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
                setItineraries([]);
                setErrors((prev) => ({ ...prev, tourId: "", itineraries: "" }));
              }}
              disabled={loading || toursLoading}
            >
              <option value="">
                {toursLoading ? "Đang tải..." : "-- Chọn tour --"}
              </option>
              {tours.map((tour) => (
                <option key={tour.id} value={tour.id}>
                  {tour.ten_tour} ({tour.so_ngay} ngày)
                </option>
              ))}
            </select>
            {errors.tourId && (
              <p className="admin-field-error">{errors.tourId}</p>
            )}
          </div>

          <div className="itinerary-modal__actions">
            <button
              type="button"
              className="admin-btn admin-btn--ghost"
              onClick={handleAutoGenerate}
              disabled={loading || toursLoading}
            >
              Tự động tạo lịch trình
            </button>
          </div>

          {errors.itineraries && (
            <p className="admin-field-error">{errors.itineraries}</p>
          )}

          {itineraries.map((item, index) => (
            <div className="itinerary-modal__card" key={item.day_number}>
              <div className="itinerary-modal__card-header">
                <h4>Block {index + 1}</h4>
                <span>Ngày thứ {item.day_number}</span>
              </div>

              <div className="itinerary-modal__field">
                <label className="itinerary-modal__label">Ngày thứ</label>
                <input
                  type="number"
                  className="admin-input"
                  value={item.day_number}
                  readOnly
                  disabled
                />
              </div>

              <div className="itinerary-modal__field">
                <label className="itinerary-modal__label">Tiêu đề</label>
                <input
                  type="text"
                  className={`admin-input${errors[`title-${index}`] ? " admin-input--invalid" : ""}`}
                  value={item.title}
                  onChange={(event) =>
                    handleItineraryChange(index, "title", event.target.value)
                  }
                  disabled={loading}
                />
                {errors[`title-${index}`] && (
                  <p className="admin-field-error">
                    {errors[`title-${index}`]}
                  </p>
                )}
              </div>

              <div className="itinerary-modal__field">
                <label className="itinerary-modal__label">
                  Mô tả lịch trình
                </label>
                <textarea
                  className="admin-textarea"
                  value={item.description}
                  onChange={(event) =>
                    handleItineraryChange(
                      index,
                      "description",
                      event.target.value,
                    )
                  }
                  disabled={loading}
                />
              </div>
            </div>
          ))}

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

export default AddItineraryModal;
