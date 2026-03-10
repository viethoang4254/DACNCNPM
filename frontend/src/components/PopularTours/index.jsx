import { useEffect, useMemo, useState } from "react";
import { mockTours } from "../../data/homeData";
import TourCard from "../TourCard";

function toTourCardModel(item) {
  return {
    id: item.id,
    name: item.name || item.ten_tour,
    location: item.location || item.tinh_thanh,
    price: item.price ?? item.gia ?? 0,
    days: item.days || item.so_ngay || 1,
    image:
      item.image ||
      item.hinh_anh ||
      "https://images.unsplash.com/photo-1527631746610-bca00a040d60?auto=format&fit=crop&w=900&q=80",
  };
}

function PopularTours({ fetchTours }) {
  const [tours, setTours] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const normalizedTours = useMemo(
    () => tours.map((item) => toTourCardModel(item)),
    [tours],
  );

  useEffect(() => {
    const loadTours = async () => {
      try {
        setIsLoading(true);
        setError("");

        if (typeof fetchTours === "function") {
          const data = await fetchTours();
          setTours(Array.isArray(data) ? data : []);
          return;
        }

        setTours(mockTours);
      } catch (err) {
        setError(err?.message || "Khong the tai danh sach tour");
      } finally {
        setIsLoading(false);
      }
    };

    loadTours();
  }, [fetchTours]);

  return (
    <section className="home__section home__section--popular">
      <div className="home__section-heading">
        <h2>Cac diem den thinh hanh</h2>
      </div>

      {isLoading && <p className="home__message">Dang tai san pham...</p>}
      {error && (
        <p className="home__message home__message--error">Loi: {error}</p>
      )}

      <div className="home__tours-grid">
        {!isLoading &&
          !error &&
          normalizedTours.map((tour) => <TourCard key={tour.id} tour={tour} />)}
      </div>
    </section>
  );
}

export default PopularTours;
