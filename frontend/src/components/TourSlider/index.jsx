import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import UserTourCard from "../user/TourCard";
import "./TourSlider.scss";

function TourSlider({ tours = [] }) {
  const trackRef = useRef(null);
  const dragStateRef = useRef({
    isDragging: false,
    startX: 0,
    startScrollLeft: 0,
  });
  const [isDragging, setIsDragging] = useState(false);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const normalizedTours = useMemo(
    () => (Array.isArray(tours) ? tours : []),
    [tours],
  );

  const updateScrollButtons = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;

    const maxScrollLeft = track.scrollWidth - track.clientWidth;
    const epsilon = 2;

    setCanScrollLeft(track.scrollLeft > epsilon);
    setCanScrollRight(track.scrollLeft < maxScrollLeft - epsilon);
  }, []);

  useEffect(() => {
    updateScrollButtons();

    const track = trackRef.current;
    if (!track) return undefined;

    const handleScroll = () => updateScrollButtons();
    const handleResize = () => updateScrollButtons();

    track.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleResize);

    return () => {
      track.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleResize);
    };
  }, [normalizedTours, updateScrollButtons]);

  const scrollByPage = (direction) => {
    const track = trackRef.current;
    if (!track) return;

    // Scroll by one visible "page" (desktop = 4 cards).
    const distance = track.clientWidth;
    track.scrollBy({
      left: direction === "right" ? distance : -distance,
      behavior: "smooth",
    });
  };

  const handleWheel = (event) => {
    const track = trackRef.current;
    if (!track) return;

    // Convert vertical wheel gestures into horizontal scrolling.
    if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return;
    event.preventDefault();
    track.scrollLeft += event.deltaY;
  };

  const handleMouseDown = (event) => {
    const track = trackRef.current;
    if (!track) return;

    // Save the drag origin so we can calculate how far to pan the track.
    dragStateRef.current = {
      isDragging: true,
      startX: event.clientX,
      startScrollLeft: track.scrollLeft,
    };
    setIsDragging(true);
  };

  const handleMouseMove = (event) => {
    const track = trackRef.current;
    const dragState = dragStateRef.current;

    if (!track || !dragState.isDragging) return;

    event.preventDefault();
    const deltaX = event.clientX - dragState.startX;
    track.scrollLeft = dragState.startScrollLeft - deltaX;
  };

  const stopDragging = () => {
    dragStateRef.current.isDragging = false;
    setIsDragging(false);
  };

  return (
    <div className="tour-slider">
      <button
        type="button"
        className="tour-slider__btn tour-slider__btn--left"
        onClick={() => scrollByPage("left")}
        disabled={!canScrollLeft}
        aria-label="Scroll left"
      >
        &lt;
      </button>

      <div
        ref={trackRef}
        className={`tour-slider__track${isDragging ? " is-dragging" : ""}`}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={stopDragging}
        onMouseLeave={stopDragging}
      >
        {normalizedTours.map((tour) => (
          <div
            className="tour-slider__item"
            key={
              tour.key ||
              `${tour.id || "tour"}-${tour.viewedAt || tour.viewed_at || "x"}`
            }
          >
            <UserTourCard
              tour={tour}
              buttonLabel={tour.buttonLabel || "View"}
              viewedText={tour.viewedText || ""}
            />
          </div>
        ))}
      </div>

      <button
        type="button"
        className="tour-slider__btn tour-slider__btn--right"
        onClick={() => scrollByPage("right")}
        disabled={!canScrollRight}
        aria-label="Scroll right"
      >
        &gt;
      </button>
    </div>
  );
}

export default TourSlider;
