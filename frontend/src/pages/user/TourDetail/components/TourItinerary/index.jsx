import "./TourItinerary.scss";

function TourItinerary({ tour, images = [], itineraries = [] }) {
  const items = Array.isArray(itineraries) && itineraries.length > 0
    ? itineraries.map((item, index) => ({
        day: Number(item.ngay_thu) || index + 1,
        title: item.tieu_de || `Ngày ${Number(item.ngay_thu) || index + 1}`,
        description: item.description || "Lịch trình đang được cập nhật.",
        imageUrl: item.image_url || images[index] || "",
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
            <div className="tour-detail__timeline-image">
              {item.imageUrl ? <img src={item.imageUrl} alt={item.title} /> : <div />}
            </div>
            <div className="tour-detail__timeline-content">
              <h4>Ngày {item.day}: {item.title}</h4>
              <p className="tour-detail__timeline-description">{item.description}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

export default TourItinerary;
