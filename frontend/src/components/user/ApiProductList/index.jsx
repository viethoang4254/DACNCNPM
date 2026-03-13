import { useEffect, useMemo, useState } from "react";

function toProductModel(item) {
  const imageFallback =
    "https://images.unsplash.com/photo-1527631746610-bca00a040d60?auto=format&fit=crop&w=900&q=80";

  return {
    id: item.id,
    name: item.ten_tour || item.name || "Tour du lich",
    location: item.tinh_thanh || item.location || "Viet Nam",
    days: Number(item.so_ngay || item.days || 1),
    price: Number(item.gia || item.price || 0),
    image: item.hinh_anh || item.image || imageFallback,
  };
}

function ApiProductList({
  fetchTours,
  tours: toursProp,
  isLoading: isLoadingProp,
  error: errorProp,
}) {
  const [items, setItems] = useState(Array.isArray(toursProp) ? toursProp : []);
  const [isLoading, setIsLoading] = useState(
    typeof isLoadingProp === "boolean" ? isLoadingProp : true,
  );
  const [error, setError] = useState(errorProp || "");

  const usesExternalData = Array.isArray(toursProp);

  const products = useMemo(
    () => items.map((item) => toProductModel(item)),
    [items],
  );

  useEffect(() => {
    if (usesExternalData) {
      setItems(toursProp);
      setIsLoading(Boolean(isLoadingProp));
      setError(errorProp || "");
      return;
    }

    let isMounted = true;

    const loadProducts = async () => {
      try {
        setIsLoading(true);
        setError("");

        if (typeof fetchTours !== "function") {
          setItems([]);
          return;
        }

        const tours = await fetchTours();
        if (!isMounted) return;

        const normalizedTours = Array.isArray(tours) ? tours : [];
        const selected = normalizedTours.slice(0, 4);
        setItems(selected);
      } catch (err) {
        if (!isMounted) return;
        setError(err?.message || "Khong the tai danh sach san pham");
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadProducts();

    return () => {
      isMounted = false;
    };
  }, [errorProp, fetchTours, isLoadingProp, toursProp, usesExternalData]);

  return (
    <section className="home__section home__section--products">
      <div className="home__section-heading">
        <h2>Tours nổi bật</h2>
        <p>Chọn nhanh các tour đang được quan tâm nhiều tuần này.</p>
      </div>

      {isLoading && (
        <p className="home__message">Dang tai danh sach san pham...</p>
      )}
      {error && (
        <p className="home__message home__message--error">Loi: {error}</p>
      )}

      <div className="home__products-grid">
        {!isLoading &&
          !error &&
          products.map((item) => (
            <article className="home__product-card" key={item.id}>
              <div className="home__product-image-wrap">
                <img src={item.image} alt={item.name} loading="lazy" />
                <span>{item.days}N</span>
              </div>

              <div className="home__product-content">
                <h3>{item.name}</h3>
                <p className="home__product-location">{item.location}</p>
                <p className="home__product-price">
                  {item.price.toLocaleString("vi-VN")} VND / 1 người
                </p>
              </div>
            </article>
          ))}
      </div>
    </section>
  );
}

export default ApiProductList;
