function WhyChooseUs({ reasons }) {
  return (
    <section className="home__section">
      <div className="home__section-heading">
        <h2>
          Tại sao nên chọn <span>Việt Xanh Travel ?</span>
        </h2>
      </div>

      <div className="home__why-grid">
        {reasons.map((item) => (
          <article className="home__why-card" key={item.title}>
            <span className="home__why-icon" aria-hidden="true">
              {item.icon}
            </span>
            <h3>{item.title}</h3>
            <p>{item.description}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

export default WhyChooseUs;
