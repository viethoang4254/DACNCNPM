function HeroSection() {
  return (
    <section className="home__hero">
      <div className="home__hero-overlay" />
      <div className="home__hero-content">
        <p className="home__hero-eyebrow">Khám phá vẻ đẹp Việt Nam</p>
        <h1>Từ núi rừng hùng vì đến biển xanh nhiệt đới.</h1>
        <p className="home__hero-sub">
          Lên kế hoạch và bắt đầu hành trình của bạn ngày hôm nay
        </p>

        <div className="home__search" aria-label="travel search">
          <div className="home__search-grid">
            <label>
              Điểm đến
              <input type="text" placeholder="Where to?" />
            </label>
            <label>
              Check-in
              <input type="date" />
            </label>
            <label>
              Check-out
              <input type="date" />
            </label>
            <label>
              lượng khách
              <select defaultValue="2">
                <option value="1">1 người</option>
                <option value="2">2 người</option>
                <option value="3">3 người</option>
                <option value="4">4+ người</option>
              </select>
            </label>
            <button type="button">Tìm Kiếm</button>
          </div>
        </div>
      </div>
    </section>
  );
}

export default HeroSection;
