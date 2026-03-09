import { useEffect, useMemo, useState } from "react";
import "./Home.scss";

function Home() {
  const [tours, setTours] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

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
      <section className="hero">
        <div className="hero__overlay" />
        <div className="hero__content">
          <p className="hero__eyebrow">Khám phá vẻ đẹp Việt Nam</p>
          <h1>Từ núi rừng hùng vĩ đến biển xanh nhiệt đới.</h1>
          <p className="hero__sub">
            Lên kế hoạch và bắt đầu hành trình của bạn ngay hôm nay
          </p>

          <div className="search-box" aria-label="travel search">
            <div className="search-box__grid">
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

      <section className="destinations">
        <div className="section-heading">
          <h2>Các điểm đến thịnh hành</h2>
        </div>

        {isLoading && <p>Dang tai san pham...</p>}
        {error && <p>Loi: {error}</p>}

        <div className="destinations__grid">
          {!isLoading &&
            !error &&
            tours.map((item) => (
              <article className="trip-card" key={item.id}>
                <div className="trip-card__image-wrap">
                  <img
                    src={
                      resolveImageUrl(item.hinh_anh) ||
                      "https://images.unsplash.com/photo-1527631746610-bca00a040d60?auto=format&fit=crop&w=900&q=80"
                    }
                    alt={item.ten_tour}
                    loading="lazy"
                  />
                  <span className="trip-card__rating">{item.so_ngay}N</span>
                </div>
                <div className="trip-card__content">
                  <h3>{item.ten_tour}</h3>
                  <p>{item.tinh_thanh}</p>
                  <div className="trip-card__meta">
                    <span>
                      Giá/1người:{" "}
                      {Number(item.gia || 0).toLocaleString("vi-VN")} VND
                    </span>
                    <button type="button">Chi tiết</button>
                  </div>
                </div>
              </article>
            ))}
        </div>
      </section>
    </main>
  );
}

export default Home;
