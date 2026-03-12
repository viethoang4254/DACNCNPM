function ReviewCard({ review }) {
  return (
    <article className="home__review-card">
      <div className="home__review-header">
        <img src={review.avatar} alt={review.name} loading="lazy" />
        <div>
          <h3>{review.name}</h3>
          <p>
            {"★".repeat(review.rating)}
            {"☆".repeat(5 - review.rating)}
          </p>
        </div>
      </div>
      <p className="home__review-text">{review.comment}</p>
    </article>
  );
}

export default ReviewCard;
