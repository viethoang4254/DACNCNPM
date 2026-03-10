import "./Home.scss";
import { useEffect, useMemo, useState } from "react";

function Home() {
  const [tours, setTours] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const featuredDestinations = [
    {
      name: "Da Nang",
      image:
        "https://static-images.vnncdn.net/files/publish/2022/7/8/loat-nha-hang-ven-bien-da-nang-dong-cua-hu-hong-giua-cao-diem-du-lich-b60950903c254c008fdd156c9dd0fe21.jpg",
    },
    {
      name: "Phu Quoc",
      image: "https://bazantravel.com/cdn/medias/tours/2/2671.jpg",
    },
    {
      name: "Ha Long",
      image:
        "https://i.pinimg.com/originals/56/9a/0d/569a0d355cdc1cb9d788c5eeb80f65a7.jpg",
    },
    {
      name: "Nha Trang",
      image:
        "https://a.cdn-hotels.com/gdcs/production190/d1158/5ba14116-f80f-40b5-af5b-64a8d2d4f230.jpg",
    },
    {
      name: "Sa Pa",
      image:
        "https://static.vinwonders.com/production/Sapa-Vietnam-In-March-banner.jpg",
    },
  ];

  const reasons = [
    {
      icon: "💸",
      title: "Gia tot nhat",
      description: "Gia canh tranh va uu dai lien tuc cho moi mua du lich.",
    },
    {
      icon: "🔐",
      title: "Thanh toan an toan",
      description:
        "Bao mat da lop, ho tro nhieu hinh thuc thanh toan linh hoat.",
    },
    {
      icon: "🏝️",
      title: "Tour chat luong",
      description:
        "Lich trinh toi uu, doi tac uy tin va trai nghiem thuc te tot nhat.",
    },
    {
      icon: "🎧",
      title: "Ho tro 24/7",
      description:
        "Doi ngu tu van luon san sang dong hanh trong suot hanh trinh.",
    },
  ];

  const reviews = [
    {
      name: "Nguyen Hoang Lan",
      avatar:
        "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80",
      rating: 5,
      comment:
        "Lich trinh hop ly, huong dan vien rat nhiet tinh. Gia dinh minh rat hai long voi chuyen di Da Nang.",
    },
    {
      name: "Tran Minh Quan",
      avatar:
        "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80",
      rating: 5,
      comment:
        "Dat tour nhanh, thanh toan de dang va duoc ho tro ngay khi can doi lich. Se tiep tuc ung ho.",
    },
    {
      name: "Le Bao Ngoc",
      avatar:
        "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80",
      rating: 4,
      comment:
        "Khach san sach dep, lich trinh phong phu. Mong co them nhieu uu dai cho nhom ban tre.",
    },
  ];

  const apiBaseUrl = useMemo(
    () => import.meta.env.VITE_API_BASE_URL || "http://localhost:5000",
    [],
  );
  const resolveImageUrl = (path) => {
    if (!path) return "";
    if (path.startsWith("http://") || path.startsWith("https://")) return path;
    return `${apiBaseUrl}${path.startsWith("/") ? path : `/${path}`}`;
  };

  useEffect(() => {
    const fetchTours = async () => {
      try {
        setIsLoading(true);
        setError("");

        const response = await fetch(`${apiBaseUrl}/api/tours`);
        if (!response.ok) {
          throw new Error(`Request failed with status ${response.status}`);
        }

        const payload = await response.json();
        setTours(Array.isArray(payload.data) ? payload.data : []);
      } catch (err) {
        setError(err.message || "Khong the tai danh sach san pham");
      } finally {
        setIsLoading(false);
      }
    };

    fetchTours();
  }, [apiBaseUrl]);

  return (
    <main className="home">
      <section className="home__hero">
        <div className="home__hero-overlay" />
        <div className="home__hero-content">
          <p className="home__hero-eyebrow">Kham pha ve dep Viet Nam</p>
          <h1>Từ núi rừng hùng vĩ đến biển xanh nhiệt đới.</h1>
          <p className="home__hero-sub">
            Lên kế hoạch và bắt đầu hành trình của bạn ngay hôm nay
          </p>

          <div className="home__search" aria-label="travel search">
            <div className="home__search-grid">
              <label>
                Điểm Đến
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
                Lượng Khách
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

      <section className="home__section home__section--popular">
        <div className="home__section-heading">
          <h2>Các điểm đến thịnh hành</h2>
        </div>

        {isLoading && <p className="home__message">Dang tai san pham...</p>}
        {error && (
          <p className="home__message home__message--error">Loi: {error}</p>
        )}

        <div className="home__tours-grid">
          {!isLoading &&
            !error &&
            tours.map((item) => (
              <article className="tour-card" key={item.id}>
                <div className="tour-card__image-wrap">
                  <img
                    src={
                      resolveImageUrl(item.hinh_anh) ||
                      "https://images.unsplash.com/photo-1527631746610-bca00a040d60?auto=format&fit=crop&w=900&q=80"
                    }
                    alt={item.ten_tour}
                    loading="lazy"
                  />
                  <span className="tour-card__badge">{item.so_ngay}N</span>
                </div>
                <div className="tour-card__info">
                  <h3 className="tour-card__name">{item.ten_tour}</h3>
                  <p className="tour-card__location">{item.tinh_thanh}</p>
                  <div className="tour-card__meta">
                    <span className="tour-card__price">
                      Giá/1người:{" "}
                      {Number(item.gia || 0).toLocaleString("vi-VN")} VND
                    </span>
                    <button type="button" className="tour-card__button">
                      Chi tiet
                    </button>
                  </div>
                </div>
              </article>
            ))}
        </div>
      </section>

      <section className="home__section">
        <div className="home__section-heading">
          <h2>Featured Destinations</h2>
        </div>
        <div className="home__featured-grid">
          {featuredDestinations.map((destination) => (
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

      <section className="home__section">
        <div className="home__section-heading">
          <h2>Why Choose Us</h2>
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

      <section className="home__section">
        <div className="home__section-heading">
          <h2>Customer Reviews</h2>
        </div>
        <div className="home__reviews-grid">
          {reviews.map((review) => (
            <article className="home__review-card" key={review.name}>
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
          ))}
        </div>
      </section>
    </main>
  );
}

export default Home;
