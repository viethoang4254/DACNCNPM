import "./TourTabs.scss";

function TourTabs({ activeTab, onTabChange }) {
  const tabs = [
    { id: "overview", label: "Giới thiệu tour" },
    { id: "itinerary", label: "Lịch trình tour" },
    { id: "images", label: "Hình ảnh" },
    { id: "reviews", label: "Đánh giá" },
  ];

  return (
    <nav className="tour-detail__tabs card" aria-label="Nội dung tour">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          className={`tour-detail__tab${activeTab === tab.id ? " is-active" : ""}`}
          onClick={() => onTabChange(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </nav>
  );
}

export default TourTabs;
