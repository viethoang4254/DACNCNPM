import {
  FaFacebookF,
  FaInstagram,
  FaYoutube,
  FaPhoneAlt,
} from "react-icons/fa";
import { MdOutlineMailOutline } from "react-icons/md";
import { HiOutlineMapPin } from "react-icons/hi2";
import { NavLink } from "react-router-dom";
import "./Footer.scss";

function Footer() {
  return (
    <footer className="footer">
      <div className="footer__container">
        <div className="footer__col">
          <h3>VietXanh Travel</h3>
          <p>
            Chuyên cung cấp tour trong nước với lịch trình tối ưu, giá cả hợp lý
            và trải nghiệm đáng nhớ.
          </p>
        </div>

        <div className="footer__col">
          <h4>Liên kết</h4>
          <ul>
            <li>
              <NavLink to="/">Home</NavLink>
            </li>
            <li>
              <NavLink to="/tours">Tour</NavLink>
            </li>
            <li>
              <NavLink to="/about">About</NavLink>
            </li>
            <li>
              <NavLink to="/contact">Contact</NavLink>
            </li>
          </ul>
        </div>

        <div className="footer__col">
          <h4>Liên hệ</h4>
          <ul className="footer__contact-list">
            <li>
              <HiOutlineMapPin /> 484 Trần Cao Vân,Thanh Khê, TP.Đà Nẵng
            </li>
            <li>
              <FaPhoneAlt /> 0905884000
            </li>
            <li>
              <MdOutlineMailOutline /> support@vietxanhtravel.vn
            </li>
          </ul>
        </div>

        <div className="footer__col">
          <h4>Social</h4>
          <div className="footer__socials">
            <a href="#" aria-label="Facebook">
              <FaFacebookF />
            </a>
            <a href="#" aria-label="Instagram">
              <FaInstagram />
            </a>
            <a href="#" aria-label="Youtube">
              <FaYoutube />
            </a>
          </div>
        </div>
      </div>

      <div className="footer__bottom">
        <p>Copyright 2026 VietXanh Travel. All rights reserved.</p>
      </div>
    </footer>
  );
}

export default Footer;
