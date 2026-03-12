function StatsCard({ title, value, hint, accent = "blue", icon: Icon }) {
  return (
    <article className={`stats-card stats-card--${accent}`}>
      {Icon && (
        <div className="stats-card__icon">
          <Icon />
        </div>
      )}
      <p className="stats-card__title">{title}</p>
      <h3 className="stats-card__value">{value}</h3>
      <p className="stats-card__hint">{hint}</p>
    </article>
  );
}

export default StatsCard;
