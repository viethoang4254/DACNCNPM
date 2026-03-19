import { useMemo, useState } from "react";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import "./TourGallery.scss";

function TourGallery({ images = [] }) {
  const normalizedImages = useMemo(() => images.filter(Boolean), [images]);

  const [mainImage, setMainImage] = useState(normalizedImages[0] || "");
  const [thumbStart, setThumbStart] = useState(0);

  const visibleThumbs = 5;
  const thumbImages = normalizedImages.slice(
    thumbStart,
    thumbStart + visibleThumbs,
  );

  const canPrev = thumbStart > 0;
  const canNext = thumbStart + visibleThumbs < normalizedImages.length;

  const activeImage = mainImage || normalizedImages[0] || "";

  return (
    <section className="tour-detail__gallery card">
      <div className="tour-detail__main-image-wrap">
        {activeImage ? (
          <img src={activeImage} alt="Tour" className="tour-detail__main-image" />
        ) : (
          <div className="tour-detail__main-image-empty">Không có hình ảnh</div>
        )}
      </div>

      {normalizedImages.length > 0 && (
        <div className="tour-detail__thumbs-wrap">
          <button
            type="button"
            className="tour-detail__thumb-nav"
            disabled={!canPrev}
            onClick={() => setThumbStart((prev) => Math.max(0, prev - 1))}
            aria-label="Ảnh trước"
          >
            <FaChevronLeft />
          </button>

          <div className="tour-detail__thumbs">
            {thumbImages.map((img) => (
              <button
                key={img}
                type="button"
                className={`tour-detail__thumb${activeImage === img ? " is-active" : ""}`}
                onClick={() => setMainImage(img)}
              >
                <img src={img} alt="Thumbnail" />
              </button>
            ))}
          </div>

          <button
            type="button"
            className="tour-detail__thumb-nav"
            disabled={!canNext}
            onClick={() => setThumbStart((prev) => prev + 1)}
            aria-label="Ảnh sau"
          >
            <FaChevronRight />
          </button>
        </div>
      )}
    </section>
  );
}

export default TourGallery;
