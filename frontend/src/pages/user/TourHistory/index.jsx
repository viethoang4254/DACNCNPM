import { useEffect, useState } from "react";
import TourHistory from "../../../components/TourHistory";
import { getAuthUser } from "../../../utils/authStorage";
import {
  getRecommendedTours,
  getTourHistory,
} from "../../../services/historyService";
import "./TourHistory.scss";

function TourHistoryPage() {
  const authUser = getAuthUser();
  const [loading, setLoading] = useState(true);
  const [historyTours, setHistoryTours] = useState([]);
  const [recommendedTours, setRecommendedTours] = useState([]);

  useEffect(() => {
    let ignore = false;

    const fetchData = async () => {
      setLoading(true);

      try {
        const historyResult = await getTourHistory();

        if (ignore) return;
        setHistoryTours(historyResult.data || []);

        if (authUser?.id) {
          const recommendData = await getRecommendedTours();
          if (ignore) return;
          setRecommendedTours(
            Array.isArray(recommendData) ? recommendData : [],
          );
        } else {
          setRecommendedTours([]);
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    };

    fetchData();

    return () => {
      ignore = true;
    };
  }, [authUser?.id]);

  return (
    <main className="tour-history-screen">
      <div className="tour-history-screen__hero">
        <h1>Nhật ký hành trình của bạn</h1>
        <p>
          Lưu lại các tour bạn vừa khám phá và khám phá thêm các lựa chọn phù
          hợp.
        </p>
      </div>

      <TourHistory
        historyTours={historyTours}
        recommendedTours={recommendedTours}
        loading={loading}
        showRecommendation={Boolean(authUser?.id)}
        isGuest={!authUser?.id}
      />
    </main>
  );
}

export default TourHistoryPage;
