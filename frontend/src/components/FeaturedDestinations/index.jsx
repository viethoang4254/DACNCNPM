function FeaturedDestinations({ destinations }) {
  return (
    <section className="home__section">
      <div className="home__section-heading">
        <h2>Featured Destinations</h2>
      </div>

      <div className="home__featured-grid">
        {destinations.map((destination) => (
          <article className="home__featured-item" key={destination.name}>
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
