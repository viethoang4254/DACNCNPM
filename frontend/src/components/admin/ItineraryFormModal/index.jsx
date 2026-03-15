import { useEffect, useMemo, useState } from "react";
import { MdClose } from "react-icons/md";
import ItineraryAccordion from "../ItineraryAccordion";
import "./ItineraryFormModal.scss";

const defaultDescriptionByDay = {
  1: "Đón khách tại điểm hẹn và khởi hành đến điểm du lịch.",
  2: "Tham quan các địa điểm nổi tiếng và trải nghiệm văn hóa địa phương.",
  3: "Mua sắm đặc sản địa phương và kết thúc tour.",
};

export function generateItinerary(days) {
  const totalDays = Number(days) || 0;
  return Array.from({ length: totalDays }, (_, index) => {
    const day = index + 1;
    return {
      day_number: day,
      title: `Ngày ${day}`,
      description: defaultDescriptionByDay[day] || "",
    };
  });
}

function normalizeEditItems(soNgay, itineraries = []) {
  const mapByDay = new Map(
    itineraries.map((item) => [Number(item.day_number), item]),
  );

  return generateItinerary(soNgay).map((item) => {
    const existing = mapByDay.get(item.day_number);
    return existing
      ? {
          day_number: item.day_number,
          title: existing.title || item.title,
          description: existing.description || "",
        }
      : item;
  });
}

function ItineraryFormModal({
  open,
  mode = "create",
  tours = [],
  detail,
  loading = false,
  onClose,
  onSubmit,
}) {
  const [tourId, setTourId] = useState("");
  const [itineraries, setItineraries] = useState([]);
  const [errors, setErrors] = useState({});

  const selectedTour = useMemo(
    () => tours.find((tour) => String(tour.id) === String(tourId)),
    [tours, tourId],
  );

  useEffect(() => {
    if (!open) {
      setTourId("");
      setItineraries([]);
      setErrors({});
      return;
    }

    if (mode === "edit" && detail?.tour) {
      setTourId(String(detail.tour.id));
      setItineraries(
        normalizeEditItems(detail.tour.so_ngay, detail.itineraries),
      );
      setErrors({});
    }

    if (mode === "create") {
      setTourId("");
      setItineraries([]);
      setErrors({});
    }
  }, [open, mode, detail]);

  function handleAutoGenerate() {
    const days = Number(selectedTour?.so_ngay || 0);
    if (days <= 0) {
      setErrors((prev) => ({ ...prev, tourId: "Vui lòng chọn tour hợp lệ." }));
      return;
    }

    setItineraries(generateItinerary(days));
    setErrors((prev) => ({ ...prev, tourId: "", itineraries: "" }));
  }

  function validate() {
    const nextErrors = {};

    if (!tourId) {
      nextErrors.tourId = "Vui lòng chọn tour.";
    }

    if (itineraries.length === 0) {
      nextErrors.itineraries = "Vui lòng tạo itinerary trước khi lưu.";
    }

    itineraries.forEach((item, index) => {
      if (!item.title?.trim()) {
        nextErrors[`title-${index}`] = "Tiêu đề không được để trống.";
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

    const payload = {
      tour_id: Number(tourId),
      itineraries: itineraries.map((item) => ({
        day_number: Number(item.day_number),
        title: String(item.title || "").trim(),
        description: String(item.description || ""),
      })),
    };

    onSubmit?.(payload);
  }

  if (!open) return null;

  const isEdit = mode === "edit";
  const displayTour = isEdit ? detail?.tour : selectedTour;

  return (
    <div
      className="admin-modal__backdrop"
      onClick={(event) => {
        if (event.target === event.currentTarget && !loading) {
          onClose?.();
        }
      }}
    >
      <div className="itinerary-form-modal">
        <header className="itinerary-form-modal__header">
          <div>
            <h3>{isEdit ? "Sửa lịch trình" : "Tạo lịch trình"}</h3>
            <p>
              {isEdit
                ? "Sửa toàn bộ lịch trình của tour"
                : "Tạo lịch trình theo số ngày của tour"}
            </p>
          </div>
          <button
            className="itinerary-form-modal__close"
            type="button"
            onClick={onClose}
            disabled={loading}
            aria-label="Đóng"
          >
            <MdClose />
          </button>
        </header>

        <form className="itinerary-form-modal__body" onSubmit={handleSubmit}>
          <div className="itinerary-form-modal__field">
            <label>Tour</label>
            {isEdit ? (
              <input
                type="text"
                className="admin-input"
                value={displayTour?.ten_tour || ""}
                disabled
                readOnly
              />
            ) : (
              <select
                className={`admin-select${errors.tourId ? " admin-input--invalid" : ""}`}
                value={tourId}
                disabled={loading}
                onChange={(event) => {
                  setTourId(event.target.value);
                  setItineraries([]);
                  setErrors((prev) => ({
                    ...prev,
                    tourId: "",
                    itineraries: "",
                  }));
                }}
              >
                <option value="">-- Chọn tour --</option>
                {tours.map((tour) => (
                  <option key={tour.id} value={tour.id}>
                    {tour.ten_tour} ({tour.so_ngay} ngày)
                  </option>
                ))}
              </select>
            )}
            {errors.tourId && (
              <p className="admin-field-error">{errors.tourId}</p>
            )}
          </div>

          <div className="itinerary-form-modal__meta">
            <span>
              Số ngày của tour: <strong>{displayTour?.so_ngay || 0}</strong>
            </span>
            {!isEdit && (
              <button
                type="button"
                className="admin-btn admin-btn--ghost"
                onClick={handleAutoGenerate}
                disabled={loading || !tourId}
              >
                Tự động tạo lịch trình
              </button>
            )}
          </div>

          {errors.itineraries && (
            <p className="admin-field-error">{errors.itineraries}</p>
          )}

          <ItineraryAccordion
            itineraries={itineraries}
            onChange={setItineraries}
            readOnly={false}
          />

          <footer className="itinerary-form-modal__footer">
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
              {loading ? "Đang lưu..." : "Lưu itinerary"}
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
}

export default ItineraryFormModal;
