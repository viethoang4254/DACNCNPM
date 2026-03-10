function HeroSection() {
  return (
    <section className="home__hero">
      <div className="home__hero-overlay" />
      <div className="home__hero-content">
        <p className="home__hero-eyebrow">Kham pha ve dep Viet Nam</p>
        <h1>Tu nui rung hung vi den bien xanh nhiet doi.</h1>
        <p className="home__hero-sub">
          Len ke hoach va bat dau hanh trinh cua ban ngay hom nay
        </p>

        <div className="home__search" aria-label="travel search">
          <div className="home__search-grid">
            <label>
              Diem den
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
              Luong khach
              <select defaultValue="2">
                <option value="1">1 nguoi</option>
                <option value="2">2 nguoi</option>
                <option value="3">3 nguoi</option>
                <option value="4">4+ nguoi</option>
              </select>
            </label>
            <button type="button">Tim kiem</button>
          </div>
        </div>
      </div>
    </section>
  );
}

export default HeroSection;
