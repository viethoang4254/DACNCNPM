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
  { label: "1 – 3 ngày", minDays: 1, maxDays: 3 },
  { label: "4 – 7 ngày", minDays: 4, maxDays: 7 },
  { label: "Trên 7 ngày", minDays: 8, maxDays: undefined },
];

const PRICE_OPTIONS = [
  { label: "Dưới 2 triệu", minPrice: 0, maxPrice: 2000000 },
  { label: "2 – 5 triệu", minPrice: 2000000, maxPrice: 5000000 },
  { label: "5 – 10 triệu", minPrice: 5000000, maxPrice: 10000000 },
  { label: "Trên 10 triệu", minPrice: 10000000, maxPrice: undefined },
];

function FilterSidebar({ filters, onChange, onClear }) {
  const handleDestination = (value) => {
    onChange({ tinh_thanh: filters.tinh_thanh === value ? "" : value });
  };

  const handleDays = (opt) => {
    const isSelected =
      filters.minDays === opt.minDays && filters.maxDays === opt.maxDays;
    onChange(
      isSelected
        ? { minDays: undefined, maxDays: undefined }
        : { minDays: opt.minDays, maxDays: opt.maxDays },
    );
  };

  const handlePrice = (opt) => {
    const isSelected =
      filters.minPrice === opt.minPrice && filters.maxPrice === opt.maxPrice;
    onChange(
      isSelected
        ? { minPrice: undefined, maxPrice: undefined }
        : { minPrice: opt.minPrice, maxPrice: opt.maxPrice },
    );
  };

  const hasActiveFilter =
    filters.tinh_thanh ||
    filters.minDays !== undefined ||
    filters.minPrice !== undefined;

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
                  checked={
                    filters.minDays === opt.minDays &&
                    filters.maxDays === opt.maxDays
                  }
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
                  checked={
                    filters.minPrice === opt.minPrice &&
                    filters.maxPrice === opt.maxPrice
                  }
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
