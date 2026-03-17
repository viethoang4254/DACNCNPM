import { formatViewedAgo } from "../../services/historyService";
import TourSlider from "../TourSlider";
import "./TourHistory.scss";

function TourHistory({
  historyTours = [],
  recommendedTours = [],
  loading = false,
  showRecommendation = false,
  isGuest = false,
}) {
  const showEmpty = !loading && historyTours.length === 0;

  const mapRecommendTourToUserCard = (tour) => ({
    id: Number(tour?.id || tour?.tour_id),
    name: tour?.ten_tour || "Tour đang cập nhật",
    price: Number(tour?.gia || 0),
    days: Number(tour?.so_ngay || 0),
    location: tour?.tinh_thanh || "Đang cập nhật",
    transport: tour?.phuong_tien || tour?.transport || "",
    image: tour?.hinh_anh || "https://placehold.co/600x360?text=Tour",
  });

  const mapHistoryTourToUserCard = (tour) => ({
    id: Number(tour?.tour_id || tour?.id),
    name: tour?.ten_tour || "Tour đang cập nhật",
    price: Number(tour?.gia || 0),
    days: Number(tour?.so_ngay || 0),
    location: tour?.tinh_thanh || "Đang cập nhật",
    transport: tour?.phuong_tien || tour?.transport || "",
    image: tour?.hinh_anh || "https://placehold.co/600x360?text=Tour",
  });

  return (
    <div className="tour-history-page">
      <section className="tour-history-page__section">
        <div className="tour-history-page__heading">
          <h2>Tour đã xem gần đây</h2>
          {isGuest ? <p>Đăng nhập để lưu lịch sử lâu dài</p> : null}
        </div>

        {loading ? (
          <div className="tour-history-page__skeleton-row">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="tour-history-skeleton" />
            ))}
          </div>
        ) : showEmpty ? (
          <div className="tour-history-page__empty">Bạn chưa xem tour nào</div>
        ) : (
          <TourSlider
            tours={historyTours.map((tour) => ({
              ...mapHistoryTourToUserCard(tour),
              buttonLabel: "Xem lại",
              viewedText: formatViewedAgo(tour?.viewed_at || tour?.viewedAt),
              key: `${tour.tour_id || tour.id}-${tour.viewed_at || tour.viewedAt || "x"}`,
            }))}
          />
        )}
      </section>

      {showRecommendation ? (
        <section className="tour-history-page__section">
          <div className="tour-history-page__heading">
            <h2>Gợi ý dành cho bạn</h2>
          </div>

          {loading ? (
            <div className="tour-history-page__skeleton-row">
              {Array.from({ length: 3 }).map((_, index) => (
                <div
                  key={`recommend-skeleton-${index}`}
                  className="tour-history-skeleton"
                />
              ))}
            </div>
          ) : recommendedTours.length === 0 ? (
            <div className="tour-history-page__empty">
              Chưa có gợi ý phù hợp lúc này
            </div>
          ) : (
            <TourSlider
              tours={recommendedTours.map((tour) => ({
                ...mapRecommendTourToUserCard(tour),
                buttonLabel: "View",
                key: `recommend-${tour.id || tour.tour_id}`,
              }))}
            />
          )}
        </section>
      ) : null}
    </div>
  );
}

export default TourHistory;
