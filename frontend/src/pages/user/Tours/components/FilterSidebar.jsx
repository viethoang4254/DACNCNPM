import {
  FaFilter,
  FaMapMarkerAlt,
  FaClock,
  FaMoneyBillWave,
} from "react-icons/fa";

const DESTINATIONS = [
  { value: "Đà Nẵng", label: "Đà Nẵng" },
  { value: "Phú Quốc", label: "Phú Quốc" },
  { value: "Hà Nội", label: "Hà Nội" },
  { value: "Sa Pa", label: "Sa Pa" },
  { value: "Hội An", label: "Hội An" },
  { value: "Nha Trang", label: "Nha Trang" },
  { value: "Đà Lạt", label: "Đà Lạt" },
  { value: "Huế", label: "Huế" },
];

const DAYS_OPTIONS = [
  { label: "1 – 3 ngày", value: "1-3" },
  { label: "4 – 7 ngày", value: "4-7" },
  { label: "Trên 7 ngày", value: "over-7" },
];

const PRICE_OPTIONS = [
  { label: "Dưới 2 triệu", value: "under-2" },
  { label: "2 – 5 triệu", value: "2-5" },
  { label: "5 – 10 triệu", value: "5-10" },
  { label: "Trên 10 triệu", value: "over-10" },
];

function FilterSidebar({ filters, onChange, onClear }) {
  const handleDestination = (value) => {
    onChange({ tinh_thanh: filters.tinh_thanh === value ? "" : value });
  };

  const handleDays = (opt) => {
    const isSelected = filters.duration === opt.value;
    onChange({ duration: isSelected ? "" : opt.value });
  };

  const handlePrice = (opt) => {
    const isSelected = filters.price === opt.value;
    onChange({ price: isSelected ? "" : opt.value });
  };

  const hasActiveFilter =
    filters.tinh_thanh || filters.duration || filters.price;

  return (
    <aside className="filter-sidebar">
      <div className="filter-sidebar__header">
        <FaFilter className="filter-sidebar__header-icon" />
        <h2>Bộ lọc tour</h2>
        {hasActiveFilter && (
          <button
            type="button"
            className="filter-sidebar__clear"
            onClick={onClear}
            title="Xóa tất cả bộ lọc"
          >
            <span>Xóa lọc</span>
          </button>
        )}
      </div>

      {/* Destination */}
      <div className="filter-sidebar__section">
        <div className="filter-sidebar__section-title">
          <FaMapMarkerAlt className="filter-sidebar__section-icon" />
          <h3>Điểm đến</h3>
        </div>
        <ul className="filter-sidebar__options">
          {DESTINATIONS.map((d) => (
            <li key={d.value}>
              <label className="filter-sidebar__option">
                <input
                  type="checkbox"
                  checked={filters.tinh_thanh === d.value}
                  onChange={() => handleDestination(d.value)}
                />
                <span className="filter-sidebar__checkmark" />
                <span className="filter-sidebar__option-label">{d.label}</span>
              </label>
            </li>
          ))}
        </ul>
      </div>

      {/* Days */}
      <div className="filter-sidebar__section">
        <div className="filter-sidebar__section-title">
          <FaClock className="filter-sidebar__section-icon" />
          <h3>Số ngày</h3>
        </div>
        <ul className="filter-sidebar__options">
          {DAYS_OPTIONS.map((opt) => (
            <li key={opt.label}>
              <label className="filter-sidebar__option">
                <input
                  type="checkbox"
                  checked={filters.duration === opt.value}
                  onChange={() => handleDays(opt)}
                />
                <span className="filter-sidebar__checkmark" />
                <span className="filter-sidebar__option-label">
                  {opt.label}
                </span>
              </label>
            </li>
          ))}
        </ul>
      </div>

      {/* Price */}
      <div className="filter-sidebar__section">
        <div className="filter-sidebar__section-title">
          <FaMoneyBillWave className="filter-sidebar__section-icon" />
          <h3>Mức giá</h3>
        </div>
        <ul className="filter-sidebar__options">
          {PRICE_OPTIONS.map((opt) => (
            <li key={opt.label}>
              <label className="filter-sidebar__option">
                <input
                  type="checkbox"
                  checked={filters.price === opt.value}
                  onChange={() => handlePrice(opt)}
                />
                <span className="filter-sidebar__checkmark" />
                <span className="filter-sidebar__option-label">
                  {opt.label}
                </span>
              </label>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
}

export default FilterSidebar;
