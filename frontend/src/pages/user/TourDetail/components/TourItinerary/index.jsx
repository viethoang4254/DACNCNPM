import "./TourItinerary.scss";

function TourItinerary({ itineraries = [] }) {
  const items =
    Array.isArray(itineraries) && itineraries.length > 0
      ? itineraries.map((item, index) => ({
          day: Number(item.day_number ?? item.ngay_thu) || index + 1,
          title:
            item.title ||
            item.tieu_de ||
            `Ngày ${Number(item.day_number ?? item.ngay_thu) || index + 1}`,
          description: item.description || "Lịch trình đang được cập nhật.",
        }))
      : [];

  return (
    <section className="tour-detail__section card">
      <h3>Lịch trình tour</h3>
      <div className="tour-detail__timeline">
        {items.length === 0 && (
          <p className="tour-detail__timeline-empty">
            Tour này chưa có lịch trình chi tiết theo ngày.
          </p>
        )}
        {items.map((item) => (
          <article key={item.day} className="tour-detail__timeline-item">
            <div className="tour-detail__timeline-content">
              <h4>
                Ngày {item.day}: {item.title}
              </h4>
              <p className="tour-detail__timeline-description">
                {item.description}
              </p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

export default TourItinerary;
