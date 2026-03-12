import "./Home.scss";
import { useCallback, useMemo } from "react";
import HeroSection from "../../../components/user/HeroSection";
import PopularTours from "../../../components/user/PopularTours";
import FeaturedDestinations from "../../../components/user/FeaturedDestinations";
import ApiProductList from "../../../components/user/ApiProductList";
import WhyChooseUs from "../../../components/user/WhyChooseUs";
import Reviews from "../../../components/user/Reviews";
import { featuredDestinations, reasons, reviews } from "../../../data/homeData";

function Home() {
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

  const fetchTours = useCallback(async () => {
    const response = await fetch(`${apiBaseUrl}/api/tours`);

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

  return (
    <main className="home">
      <HeroSection />
      <PopularTours fetchTours={fetchTours} />
      <FeaturedDestinations destinations={featuredDestinations} />
      <ApiProductList fetchTours={fetchTours} />
      <WhyChooseUs reasons={reasons} />
      <Reviews reviews={reviews} />
    </main>
  );
}

export default Home;
