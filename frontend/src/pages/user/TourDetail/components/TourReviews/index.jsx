import "./TourReviews.scss";

function getAverage(reviews) {
  if (!reviews || reviews.length === 0) return 0;
  const total = reviews.reduce(
    (sum, review) => sum + Number(review.rating || 0),
    0,
  );
  return total / reviews.length;
}

function TourReviews({ reviews = [] }) {
  const average = getAverage(reviews);

  return (
    <section className="tour-detail__section card">
      <h3>Đánh giá khách hàng</h3>
      <div className="tour-detail__rating-head">
        <strong>{average.toFixed(1)}</strong>
        <span>{"★".repeat(Math.round(average) || 0)}</span>
        <small>({reviews.length} đánh giá)</small>
      </div>

      <div className="tour-detail__reviews-list">
        {reviews.length === 0 ? (
          <p>Chưa có đánh giá nào.</p>
        ) : (
          reviews.map((review) => (
            <article key={review.id} className="tour-detail__review-item">
              <header>
                <strong>{review.user_name || "Khách hàng"}</strong>
                <span>{"★".repeat(Number(review.rating || 0))}</span>
              </header>
              <p>{review.comment}</p>
            </article>
          ))
        )}
      </div>
    </section>
  );
}

export default TourReviews;
