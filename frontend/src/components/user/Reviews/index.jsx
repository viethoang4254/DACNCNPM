import ReviewCard from "../ReviewCard";

function Reviews({ reviews }) {
  return (
    <section className="home__section">
      <div className="home__section-heading">
        <h2>Customer Reviews</h2>
      </div>

      <div className="home__reviews-grid">
        {reviews.map((review) => (
          <ReviewCard key={review.id} review={review} />
        ))}
      </div>
    </section>
  );
}

export default Reviews;
