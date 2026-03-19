import { useMemo, useState } from "react";
import { FaChevronDown, FaChevronRight } from "react-icons/fa";
import "./ItineraryAccordion.scss";

function ItineraryAccordion({ itineraries = [], onChange, readOnly = false }) {
  const sortedItems = useMemo(
    () =>
      [...itineraries].sort(
        (a, b) => Number(a.day_number) - Number(b.day_number),
      ),
    [itineraries],
  );

  const [expandedDays, setExpandedDays] = useState([]);

  function toggleDay(dayNumber) {
    setExpandedDays((prev) =>
      prev.includes(dayNumber)
        ? prev.filter((item) => item !== dayNumber)
        : [...prev, dayNumber],
    );
  }

  function handleExpandAll() {
    setExpandedDays(sortedItems.map((item) => Number(item.day_number)));
  }

  function handleCollapseAll() {
    setExpandedDays([]);
  }

  function handleFieldChange(dayNumber, field, value) {
    if (!onChange) return;

    const next = sortedItems.map((item) =>
      Number(item.day_number) === Number(dayNumber)
        ? { ...item, [field]: value }
        : item,
    );

    onChange(next);
  }

  return (
    <div className="itinerary-accordion">
      <div className="itinerary-accordion__controls">
        <button type="button" className="admin-btn" onClick={handleExpandAll}>
          Mở rộng
        </button>
        <button type="button" className="admin-btn" onClick={handleCollapseAll}>
          Thu gọn
        </button>
      </div>

      <div className="itinerary-accordion__list">
        {sortedItems.map((item) => {
          const dayNumber = Number(item.day_number);
          const expanded = expandedDays.includes(dayNumber);
          const title = item.title?.trim() || `Ngày ${dayNumber}`;

          return (
            <section className="itinerary-accordion__item" key={dayNumber}>
              <button
                type="button"
                className="itinerary-accordion__header"
                onClick={() => toggleDay(dayNumber)}
              >
                <span className="itinerary-accordion__header-icon">
                  {expanded ? <FaChevronDown /> : <FaChevronRight />}
                </span>
                <span className="itinerary-accordion__header-label">
                  Ngày {dayNumber}
                </span>
                <span className="itinerary-accordion__header-title">
                  - {title}
                </span>
              </button>

              {expanded && (
                <div className="itinerary-accordion__content">
                  <div className="itinerary-accordion__field">
                    <label>Tiêu đề</label>
                    <input
                      type="text"
                      className="admin-input"
                      value={item.title || ""}
                      disabled={readOnly}
                      onChange={(event) =>
                        handleFieldChange(
                          dayNumber,
                          "title",
                          event.target.value,
                        )
                      }
                    />
                  </div>

                  <div className="itinerary-accordion__field">
                    <label>Mô tả</label>
                    <textarea
                      className="admin-textarea"
                      rows={4}
                      value={item.description || ""}
                      disabled={readOnly}
                      onChange={(event) =>
                        handleFieldChange(
                          dayNumber,
                          "description",
                          event.target.value,
                        )
                      }
                    />
                  </div>
                </div>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}

export default ItineraryAccordion;
