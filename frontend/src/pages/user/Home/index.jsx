import "./Home.scss";
import { Suspense, lazy, useCallback, useEffect, useMemo, useState } from "react";
import HeroSection from "../../../components/user/HeroSection";
import PopularTours from "../../../components/user/PopularTours";
import ApiProductList from "../../../components/user/ApiProductList";
import { featuredDestinations, reasons, reviews } from "../../../data/homeData";

const FeaturedDestinations = lazy(() => import("../../../components/user/FeaturedDestinations"));
const WhyChooseUs = lazy(() => import("../../../components/user/WhyChooseUs"));
const Reviews = lazy(() => import("../../../components/user/Reviews"));

function Home() {
  const [tours, setTours] = useState([]);
  const [toursLoading, setToursLoading] = useState(true);
  const [toursError, setToursError] = useState("");

  const apiBaseUrl = useMemo(
    () => import.meta.env.VITE_API_BASE_URL || "http://localhost:5000",
    [],
  );

  const resolveImageUrl = useCallback(
    (path) => {
      if (!path) return "";
      if (path.startsWith("http://") || path.startsWith("https://"))
        return path;
      return `${apiBaseUrl}${path.startsWith("/") ? path : `/${path}`}`;
    },
    [apiBaseUrl],
  );

  const fetchTours = useCallback(async (signal) => {
    const response = await fetch(`${apiBaseUrl}/api/tours`, { signal });

    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`);
    }

    const payload = await response.json();
    const data = Array.isArray(payload.data) ? payload.data : [];

    return data.map((tour) => ({
      ...tour,
      hinh_anh: resolveImageUrl(tour.hinh_anh),
    }));
  }, [apiBaseUrl, resolveImageUrl]);

  useEffect(() => {
    const controller = new AbortController();

    const loadTours = async () => {
      try {
        setToursLoading(true);
        setToursError("");
        const data = await fetchTours(controller.signal);
        setTours(Array.isArray(data) ? data : []);
      } catch (err) {
        if (err?.name === "AbortError") {
          return;
        }

        setToursError(err?.message || "Khong the tai danh sach tour");
      } finally {
        setToursLoading(false);
      }
    };

    loadTours();

    return () => {
      controller.abort();
    };
  }, [fetchTours]);

  return (
    <main className="home">
      <HeroSection />
      <PopularTours tours={tours} isLoading={toursLoading} error={toursError} />
      <Suspense fallback={<p className="home__message">Đang tải nội dung...</p>}>
        <FeaturedDestinations destinations={featuredDestinations} />
      </Suspense>
      <ApiProductList tours={tours} isLoading={toursLoading} error={toursError} />
      <Suspense fallback={<p className="home__message">Đang tải nội dung...</p>}>
        <WhyChooseUs reasons={reasons} />
      </Suspense>
      <Suspense fallback={<p className="home__message">Đang tải nội dung...</p>}>
        <Reviews reviews={reviews} />
      </Suspense>
    </main>
  );
}

export default Home;
