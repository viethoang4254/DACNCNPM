import { useEffect, useMemo, useRef, useState } from "react";
import "./TourSearchDropdown.scss";

function TourSearchDropdown({
  tours = [],
  selectedTourId = "",
  onSelectTour,
  placeholder = "Tìm tour...",
  emptyLabel = "-- Chọn tour --",
  notFoundText = "Không tìm thấy tour phù hợp",
  disabled = false,
  invalid = false,
}) {
  const wrapperRef = useRef(null);

  const [search, setSearch] = useState("");
  const [filteredTours, setFilteredTours] = useState([]);
  const [selectedTour, setSelectedTour] = useState(null);
  const [openDropdown, setOpenDropdown] = useState(false);

  const selectedIdString = String(selectedTourId ?? "");

  useEffect(() => {
    const matched = tours.find((tour) => String(tour.id) === selectedIdString) || null;
    setSelectedTour(matched);
    if (!openDropdown) {
      setSearch(matched?.ten_tour || "");
    }
  }, [tours, selectedIdString, openDropdown]);

  useEffect(() => {
    const keyword = search.trim().toLowerCase();
    const next = keyword
      ? tours.filter((tour) =>
          String(tour.ten_tour || "").toLowerCase().includes(keyword),
        )
      : tours;

    setFilteredTours(next);
  }, [search, tours]);

  useEffect(() => {
    function handleOutsideClick(event) {
      if (!wrapperRef.current?.contains(event.target)) {
        setOpenDropdown(false);
        setSearch(selectedTour?.ten_tour || "");
      }
    }

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [selectedTour]);

  const displayValue = useMemo(() => {
    if (openDropdown) return search;
    if (selectedTour) return selectedTour.ten_tour || "";
    return "";
  }, [openDropdown, search, selectedTour]);

  function handleInputFocus() {
    if (disabled) return;
    setOpenDropdown(true);
  }

  function handleInputChange(event) {
    if (disabled) return;
    setSearch(event.target.value);
    setOpenDropdown(true);
  }

  function handleSelectTour(tour) {
    setSelectedTour(tour);
    setSearch(tour.ten_tour || "");
    setOpenDropdown(false);
    onSelectTour?.(tour);
  }

  function handleClearSelection() {
    setSelectedTour(null);
    setSearch("");
    setOpenDropdown(true);
    onSelectTour?.(null);
  }

  return (
    <div ref={wrapperRef} className={`tour-dropdown${invalid ? " tour-dropdown--invalid" : ""}`}>
      <div className="tour-dropdown__input-wrap">
        <input
          type="text"
          className="admin-input tour-dropdown__input"
          value={displayValue}
          onFocus={handleInputFocus}
          onChange={handleInputChange}
          placeholder={placeholder}
          disabled={disabled}
        />
        {!disabled && (selectedTour || search) && (
          <button
            type="button"
            className="tour-dropdown__clear"
            onClick={handleClearSelection}
            aria-label="Xóa tour đã chọn"
          >
            x
          </button>
        )}
      </div>

      {openDropdown && !disabled && (
        <div className="tour-dropdown__menu" role="listbox">
          <button
            type="button"
            className={`tour-dropdown__item${!selectedTourId ? " is-selected" : ""}`}
            onClick={handleClearSelection}
          >
            {emptyLabel}
          </button>

          {filteredTours.length === 0 ? (
            <div className="tour-dropdown__empty">{notFoundText}</div>
          ) : (
            filteredTours.map((tour) => (
              <button
                type="button"
                key={tour.id}
                className={`tour-dropdown__item${String(tour.id) === selectedIdString ? " is-selected" : ""}`}
                onClick={() => handleSelectTour(tour)}
              >
                {tour.ten_tour}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default TourSearchDropdown;
