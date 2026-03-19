import { Link } from "react-router-dom";
import "./Breadcrumb.scss";

function Breadcrumb({ tourName }) {
  return (
    <nav className="tour-detail__breadcrumb" aria-label="Breadcrumb">
      <Link to="/">Trang chủ</Link>
      <span>/</span>
      <Link to="/tours">Tours</Link>
      <span>/</span>
      <strong>{tourName || "Chi tiết tour"}</strong>
    </nav>
  );
}

export default Breadcrumb;
