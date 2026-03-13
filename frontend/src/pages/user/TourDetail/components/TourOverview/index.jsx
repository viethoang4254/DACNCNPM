import "./TourOverview.scss";

function TourOverview({ tour }) {
  return (
    <section className="tour-detail__section card">
      <h3>Giới thiệu tour</h3>
      <p>{tour?.mo_ta || "Nội dung đang được cập nhật."}</p>
    </section>
  );
}

export default TourOverview;
