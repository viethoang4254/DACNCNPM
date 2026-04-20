import { useState } from "react";
import { useNavigate } from "react-router-dom";
import heroBannerAvif from "../../../assets/images/banner-banahill-1600.avif";
import heroBannerWebp from "../../../assets/images/banner-banahill-1600.webp";
import heroBannerJpg from "../../../assets/images/banner-banahill.jpg";

function HeroSection() {
  const navigate = useNavigate();
  const [destination, setDestination] = useState("");
  const [startDate, setStartDate] = useState("");
  const [guests, setGuests] = useState("2");

  const handleSubmit = (event) => {
    event.preventDefault();

    const params = new URLSearchParams();
    if (destination) params.set("destination", destination);
    if (startDate) params.set("date", startDate);
    if (guests) params.set("guests", guests);

    navigate(`/tours?${params.toString()}`);
  };

  return (
    <section className="home__hero">
      {/*
        Render hero as real image element so browser can prioritize LCP resource
        with fetchPriority=high. This is typically faster than CSS background LCP.
      */}
      <picture className="home__hero-media" aria-hidden="true">
        <source srcSet={heroBannerAvif} type="image/avif" />
        <source srcSet={heroBannerWebp} type="image/webp" />
        <img
          className="home__hero-image"
          src={heroBannerJpg}
          alt=""
          loading="eager"
          fetchPriority="high"
          decoding="async"
        />
      </picture>
      <div className="home__hero-overlay" />
      <div className="home__hero-content">
        <p className="home__hero-eyebrow">Khám phá vẻ đẹp Việt Nam</p>
        <h1>Từ núi rừng hùng vĩ đến biển xanh nhiệt đới.</h1>
        <p className="home__hero-sub">
          Lên kế hoạch và bắt đầu hành trình của bạn ngày hôm nay
        </p>

        <form
          className="home__search"
          aria-label="travel search"
          onSubmit={handleSubmit}
        >
          <div className="home__search-grid">
            <label>
              Điểm đến
              <input
                type="search"
                value={destination}
                onChange={(event) => setDestination(event.target.value)}
                placeholder="Nhập điểm đến bạn muốn khám phá"
              />
            </label>
            <label>
              Ngày khởi hành
              <input
                type="date"
                value={startDate}
                onChange={(event) => setStartDate(event.target.value)}
              />
            </label>
            <label>
              Số khách
              <select
                value={guests}
                onChange={(event) => setGuests(event.target.value)}
              >
                <option value="1">1 người</option>
                <option value="2">2 người</option>
                <option value="3">3 người</option>
                <option value="4">4 người</option>
                <option value="5">5+ người</option>
              </select>
            </label>
            <button type="submit">Tìm Kiếm</button>
          </div>
        </form>
      </div>
    </section>
  );
}

export default HeroSection;
