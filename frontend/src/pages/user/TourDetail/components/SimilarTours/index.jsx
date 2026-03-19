import { Link } from "react-router-dom";
import "./SimilarTours.scss";

function formatCurrency(value) {
  return Number(value || 0).toLocaleString("vi-VN");
}

function SimilarTours({ tours = [] }) {
  return (
    <aside className="tour-detail__similar card">
      <h3>Tour tương tự</h3>
      {tours.length === 0 ? (
        <p>Chưa có tour tương tự.</p>
      ) : (
        <div className="tour-detail__similar-list">
          {tours.slice(0, 3).map((tour) => (
            <article key={tour.id} className="tour-detail__similar-item">
              <img src={tour.hinh_anh || ""} alt={tour.ten_tour} loading="lazy" />
              <div>
                <h4>{tour.ten_tour}</h4>
                <p>{formatCurrency(tour.gia)} VND</p>
                <Link to={`/tours/${tour.id}`}>Xem chi tiết</Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </aside>
  );
}

export default SimilarTours;
