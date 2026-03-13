import "./TourImages.scss";

function TourImages({ images = [] }) {
  return (
    <section className="tour-detail__section card">
      <h3>Hình ảnh tour</h3>
      {images.length === 0 ? (
        <p>Chưa có hình ảnh.</p>
      ) : (
        <div className="tour-detail__images-grid">
          {images.map((image) => (
            <img key={image} src={image} alt="Tour" loading="lazy" />
          ))}
        </div>
      )}
    </section>
  );
}

export default TourImages;
