import "./Home.scss";
import {
  Suspense,
  lazy,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import HeroSection from "../../../components/user/HeroSection";
import TrendingDestinations from "../../../components/user/TrendingDestinations";
import { featuredDestinations, reasons, reviews } from "../../../data/homeData";

// Lazy-load below-fold sections to reduce initial bundle size
const FeaturedDestinations = lazy(
  () => import("../../../components/user/FeaturedDestinations"),
);
const FeaturedTours = lazy(
  () => import("../../../components/user/FeaturedTours"),
);
const WhyChooseUs = lazy(() => import("../../../components/user/WhyChooseUs"));
const Reviews = lazy(() => import("../../../components/user/Reviews"));

const SUSPENSE_FALLBACK = <p className="home__message">Đang tải nội dung...</p>;

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

  const fetchTours = useCallback(
    async (signal) => {
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
    },
    [apiBaseUrl, resolveImageUrl],
  );

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

      {/* Above-fold: TrendingDestinations shows top 4 tours immediately */}
      <TrendingDestinations
        tours={tours}
        isLoading={toursLoading}
        error={toursError}
      />

      <Suspense fallback={SUSPENSE_FALLBACK}>
        <FeaturedDestinations destinations={featuredDestinations} />
      </Suspense>

      {/* Below-fold: FeaturedTours shows up to 8 latest tours, lazily loaded */}
      <Suspense fallback={SUSPENSE_FALLBACK}>
        <FeaturedTours
          tours={tours}
          isLoading={toursLoading}
          error={toursError}
        />
      </Suspense>

      <Suspense fallback={SUSPENSE_FALLBACK}>
        <WhyChooseUs reasons={reasons} />
      </Suspense>

      <Suspense fallback={SUSPENSE_FALLBACK}>
        <Reviews reviews={reviews} />
      </Suspense>
    </main>
  );
}

export default Home;
