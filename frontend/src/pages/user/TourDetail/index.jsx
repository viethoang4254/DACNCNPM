import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import TourGallery from "./components/TourGallery/index.jsx";
import BookingCard from "./components/BookingCard/index.jsx";
import Breadcrumb from "./components/Breadcrumb/index.jsx";
import TourTabs from "./components/TourTabs/index.jsx";
import TourOverview from "./components/TourOverview/index.jsx";
import TourItinerary from "./components/TourItinerary/index.jsx";
import TourReviews from "./components/TourReviews/index.jsx";
import SimilarTours from "./components/SimilarTours/index.jsx";
import "./TourDetail.scss";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

function resolveImageUrl(path) {
  if (!path) return "";
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

function getAverageRating(reviews = []) {
  if (reviews.length === 0) return 0;
  const total = reviews.reduce(
    (sum, review) => sum + Number(review.rating || 0),
    0,
  );
  return total / reviews.length;
}

function TourDetailPage() {
  const { id } = useParams();
  const [tour, setTour] = useState(null);
  const [images, setImages] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [itineraries, setItineraries] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [similarTours, setSimilarTours] = useState([]);
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let ignore = false;

    async function fetchDetail() {
      setLoading(true);
      setError("");

      try {
        const [
          tourRes,
          imageRes,
          scheduleRes,
          itineraryRes,
          reviewRes,
          similarRes,
        ] = await Promise.all([
          fetch(`${API_BASE_URL}/api/tours/${id}`),
          fetch(`${API_BASE_URL}/api/tours/${id}/images`),
          fetch(`${API_BASE_URL}/api/tours/${id}/schedules`),
          fetch(`${API_BASE_URL}/api/tours/${id}/itineraries`),
          fetch(`${API_BASE_URL}/api/tours/${id}/reviews`),
          fetch(`${API_BASE_URL}/api/tours/similar/${id}`),
        ]);

        if (!tourRes.ok) {
          throw new Error(`Không thể tải tour (${tourRes.status})`);
        }

        const [
          tourJson,
          imageJson,
          scheduleJson,
          itineraryJson,
          reviewJson,
          similarJson,
        ] = await Promise.all([
          tourRes.json(),
          imageRes.ok ? imageRes.json() : Promise.resolve({ data: [] }),
          scheduleRes.ok ? scheduleRes.json() : Promise.resolve({ data: [] }),
          itineraryRes.ok ? itineraryRes.json() : Promise.resolve({ data: [] }),
          reviewRes.ok ? reviewRes.json() : Promise.resolve({ data: [] }),
          similarRes.ok ? similarRes.json() : Promise.resolve({ data: [] }),
        ]);

        if (ignore) return;

        const nextTour = tourJson?.data || null;
        const nextImages = Array.isArray(imageJson?.data)
          ? imageJson.data
              .map((item) => resolveImageUrl(item.image_url))
              .filter(Boolean)
          : [];

        const fallbackCover = resolveImageUrl(nextTour?.hinh_anh);
        const mergedImages =
          nextImages.length > 0
            ? nextImages
            : fallbackCover
              ? [fallbackCover]
              : [];

        const nextSimilarTours = Array.isArray(similarJson?.data)
          ? similarJson.data.map((item) => ({
              ...item,
              hinh_anh: resolveImageUrl(item.hinh_anh),
            }))
          : [];

        const nextItineraries = Array.isArray(itineraryJson?.data)
          ? itineraryJson.data.map((item) => ({
              ...item,
              image_url: resolveImageUrl(item.image_url),
            }))
          : [];

        setTour(nextTour);
        setImages(mergedImages);
        setSchedules(
          Array.isArray(scheduleJson?.data) ? scheduleJson.data : [],
        );
        setItineraries(nextItineraries);
        setReviews(Array.isArray(reviewJson?.data) ? reviewJson.data : []);
        setSimilarTours(nextSimilarTours);
      } catch (err) {
        if (ignore) return;
        setError(err?.message || "Không thể tải chi tiết tour.");
      } finally {
        if (ignore) return;
        setLoading(false);
      }
    }

    fetchDetail();

    return () => {
      ignore = true;
    };
  }, [id]);

  const averageRating = useMemo(() => getAverageRating(reviews), [reviews]);

  const includedServices = useMemo(() => {
    if (!tour) return [];

    return [
      `Xe đưa đón bằng ${tour.phuong_tien || "phương tiện du lịch"} theo lịch trình`,
      `Lưu trú tiêu chuẩn trong ${Math.max(1, Number(tour.so_ngay || 1))} ngày`,
      "Vé tham quan các điểm trong chương trình",
      "Hướng dẫn viên đồng hành xuyên suốt tour",
      "Nước suối, bảo hiểm du lịch và hỗ trợ 24/7",
    ];
  }, [tour]);

  if (loading) {
    return (
      <main className="tour-detail tour-detail--state">
        Đang tải chi tiết tour...
      </main>
    );
  }

  if (error || !tour) {
    return (
      <main className="tour-detail tour-detail--state">
        {error || "Không tìm thấy tour."}
      </main>
    );
  }

  return (
    <main className="tour-detail">
      <Breadcrumb tourName={tour.ten_tour} />

      <div className="tour-detail__grid">
        <section className="tour-detail__left">
          <TourGallery images={images} />

          <article className="tour-detail__headline card">
            <h1>{tour.ten_tour}</h1>
            <p>
              {"★".repeat(Math.round(averageRating) || 0)}
              <span>
                {averageRating.toFixed(1)} ({reviews.length} đánh giá)
              </span>
            </p>
          </article>

          <section
            className="tour-detail__services card"
            aria-label="Dịch vụ kèm theo"
          >
            <h3>Dịch vụ kèm theo</h3>
            <ul>
              {includedServices.map((service) => (
                <li key={service}>{service}</li>
              ))}
            </ul>
          </section>

          <TourTabs activeTab={activeTab} onTabChange={setActiveTab} />

          {activeTab === "overview" && <TourOverview tour={tour} />}
          {activeTab === "itinerary" && (
            <TourItinerary
              tour={tour}
              images={images}
              itineraries={itineraries}
            />
          )}
          {activeTab === "reviews" && <TourReviews reviews={reviews} />}
        </section>

        <aside className="tour-detail__right">
          <BookingCard tour={tour} schedules={schedules} />
          <SimilarTours tours={similarTours} />
          <section className="tour-detail__mini-review card">
            <h3>Đánh giá nhanh</h3>
            <p className="tour-detail__mini-score">
              {averageRating.toFixed(1)} / 5.0
            </p>
            <p>{reviews.length} khách đã đánh giá tour này.</p>
          </section>
        </aside>
      </div>
    </main>
  );
}

export default TourDetailPage;
