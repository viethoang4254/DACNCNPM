import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./PopupBanner.scss";

function PopupBanner({
  open,
  isLoading,
  banner,
  onClose,
}) {
  const navigate = useNavigate();
  const [isImageError, setIsImageError] = useState(false);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  useEffect(() => {
    setIsImageError(false);
  }, [banner?.image_url]);

  if (isLoading) {
    return (
      <div className="popup-banner-skeleton" aria-hidden="true">
        <div className="popup-banner-skeleton__image" />
        <div className="popup-banner-skeleton__content">
          <div className="popup-banner-skeleton__line" />
          <div className="popup-banner-skeleton__line" />
        </div>
      </div>
    );
  }

  if (!open || !banner) {
    return null;
  }

  const handleNavigate = () => {
    const link = String(banner?.link || "").trim();

    if (!link) {
      onClose();
      return;
    }

    onClose();

    if (/^https?:\/\//i.test(link)) {
      window.location.assign(link);
      return;
    }

    navigate(link);
  };

  const renderCurvedLine = (text, variant = "title") => {
    const chars = Array.from(String(text || ""));
    const visibleChars = chars.filter((char) => char !== " ");
    const middle = (visibleChars.length - 1) / 2;
    const maxArc = variant === "title" ? 8.6 : 5.2;
    const curvature = variant === "title" ? 1.55 : 1.45;
    let visibleIndex = 0;

    return (
      <span className={`popup-banner-modal__curve-line popup-banner-modal__curve-line--${variant}`}>
        {chars.map((char, index) => {
          if (char === " ") {
            return (
              <span key={`space-${index}`} className="popup-banner-modal__curve-space">
                {"\u00A0"}
              </span>
            );
          }

          const rawDistance = Math.abs(visibleIndex - middle);
          const normalizedDistance = middle > 0 ? rawDistance / middle : 0;
          const offset = Math.pow(normalizedDistance, curvature) * maxArc;
          visibleIndex += 1;

          return (
            <span
              key={`${char}-${index}`}
              className="popup-banner-modal__curve-char"
              style={{ "--arc-offset": `${offset}px` }}
            >
              {char}
            </span>
          );
        })}
      </span>
    );
  };

  return (
    <div
      className="popup-banner-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby={banner?.title ? "popup-banner-title" : undefined}
      onClick={() => onClose()}
    >
      <article className="popup-banner-modal" onClick={(event) => event.stopPropagation()}>
        <div className="popup-banner-modal__poster">
          {!isImageError && banner.image_url ? (
            <img
              className="popup-banner-modal__image"
              src={banner.image_url}
              alt={banner.title || "Popup khuyến mãi"}
              onError={() => setIsImageError(true)}
            />
          ) : (
            <div className="popup-banner-modal__image-fallback">
              Hình ảnh không khả dụng
            </div>
          )}

          <div className="popup-banner-modal__overlay" />

          <button
            type="button"
            className="popup-banner-modal__close"
            aria-label="Đóng popup"
            onClick={() => onClose()}
          >
            ×
          </button>

          <div className="popup-banner-modal__content">
            <div className="popup-banner-modal__top">
              <h3 className="popup-banner-modal__title" id="popup-banner-title">
                {renderCurvedLine("CHÀO HÈ RỰC RỠ!", "title")}
              </h3>

              <p className="popup-banner-modal__subtitle">
                {renderCurvedLine("KHÁM PHÁ VIỆT NAM TRONG MƠ!", "subtitle")}
              </p>
            </div>

            <div className="popup-banner-modal__bottom">
              <div className="popup-banner-modal__promo-card">
                <p className="popup-banner-modal__promo-title">🎁 NHẬN NGAY ƯU ĐÃI ĐẾN 20%!</p>
                <p className="popup-banner-modal__promo-text">
                  {"Áp dụng cho các tour nổi bật: Phú Quốc, Đà Nẵng, Nha Trang, Vịnh Hạ Long."}
                </p>
              </div>

              <p className="popup-banner-modal__deadline">
                Hè này phải đi thôi! Ưu đãi áp dụng đến hết 15/06/2026.
              </p>

              <button type="button" className="popup-banner-modal__cta" onClick={handleNavigate}>
                Khám phá ngay
              </button>

              {/* <p className="popup-banner-modal__meta">Vietxanh Travel</p> */}
            </div>
          </div>
        </div>
      </article>
    </div>
  );
}

export default PopupBanner;
