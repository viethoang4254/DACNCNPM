import { useNavigate } from "react-router-dom";

function FeaturedDestinations({ destinations }) {
  const navigate = useNavigate();

  const handleNavigateByDestination = (destination) => {
    const params = new URLSearchParams();
    params.set("tinh_thanh", destination);
    params.set("page", "1");
    params.set("limit", "8");
    params.set("sort", "newest");

    navigate(`/tours?${params.toString()}`);
  };

  return (
    <section className="home__section">
      <div className="home__section-heading">
        <h2>Điểm đến nổi bật</h2>
      </div>

      <div className="home__featured-grid">
        {destinations.map((destination) => (
          <article
            className="home__featured-item"
            key={destination.name}
            onClick={() => handleNavigateByDestination(destination.name)}
            role="button"
            tabIndex={0}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                handleNavigateByDestination(destination.name);
              }
            }}
          >
            <img
              src={destination.image}
              alt={destination.name}
              loading="lazy"
            />
            <div className="home__featured-overlay">
              <h3>{destination.name}</h3>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

export default FeaturedDestinations;
