import { MdClose } from "react-icons/md";
import "./ItineraryViewModal.scss";

function ItineraryViewModal({ open, detail, loading = false, onClose }) {
  if (!open) return null;

  const tour = detail?.tour || null;
  const itineraries = Array.isArray(detail?.itineraries)
    ? detail.itineraries
    : [];

  return (
    <div
      className="admin-modal__backdrop"
      onClick={(event) => {
        if (event.target === event.currentTarget && !loading) {
          onClose?.();
        }
      }}
    >
      <div className="itinerary-view-modal">
        <header className="itinerary-view-modal__header">
          <div>
            <h3>{tour?.ten_tour || "Chi tiết lịch trình"}</h3>
            <p>{tour ? `Số ngày: ${tour.so_ngay}` : ""}</p>
          </div>
          <button
            className="itinerary-view-modal__close"
            type="button"
            aria-label="Đóng"
            onClick={onClose}
            disabled={loading}
          >
            <MdClose />
          </button>
        </header>

        <div className="itinerary-view-modal__body">
          {itineraries.length === 0 ? (
            <p className="itinerary-view-modal__empty">
              Tour này chưa có lịch trình.
            </p>
          ) : (
            itineraries.map((item) => (
              <article
                className="itinerary-view-modal__timeline-item"
                key={item.day_number}
              >
                <h4>Ngày {item.day_number}</h4>
                <h5>{item.title || `Ngày ${item.day_number}`}</h5>
                <p>{item.description || "Chưa có mô tả."}</p>
              </article>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default ItineraryViewModal;
