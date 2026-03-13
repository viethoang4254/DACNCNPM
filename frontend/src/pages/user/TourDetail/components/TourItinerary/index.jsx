import "./TourItinerary.scss";

function splitDescriptionIntoDays(description = "", dayCount = 1) {
  const cleaned = String(description || "").trim();
  const chunks = cleaned
    .split(/[.!?]/)
    .map((item) => item.trim())
    .filter(Boolean);

  const days = Math.max(1, Number(dayCount) || 1);

  return Array.from({ length: days }).map((_, index) => {
    const sentence =
      chunks[index] ||
      chunks[chunks.length - 1] ||
      "Lịch trình đang được cập nhật.";
    return {
      day: index + 1,
      title: `Ngày ${index + 1}`,
      description: sentence,
    };
  });
}

function TourItinerary({ tour, images = [] }) {
  const items = splitDescriptionIntoDays(tour?.mo_ta, tour?.so_ngay);

  return (
    <section className="tour-detail__section card">
      <h3>Lịch trình tour</h3>
      <div className="tour-detail__timeline">
        {items.map((item, index) => (
          <article key={item.day} className="tour-detail__timeline-item">
            <div className="tour-detail__timeline-image">
              {images[index] ? <img src={images[index]} alt={item.title} /> : <div />}
            </div>
            <div className="tour-detail__timeline-content">
              <h4>{item.title}</h4>
              <p>{item.description}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

export default TourItinerary;
