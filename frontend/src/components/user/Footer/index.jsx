import {
  FaFacebookF,
  FaInstagram,
  FaYoutube,
  FaPhoneAlt,
} from "react-icons/fa";
import { MdOutlineMailOutline } from "react-icons/md";
import { HiOutlineMapPin } from "react-icons/hi2";
import { Link } from "react-router-dom";
import "./Footer.scss";

function Footer() {
  return (
    <footer className="footer">
      <div className="footer__container">
        <div className="footer__col">
          <h3>BestPrice Travel</h3>
          <p>
            Chuyen cung cap tour trong nuoc voi lich trinh toi uu, gia hop ly va
            trai nghiem dang nho.
          </p>
        </div>

        <div className="footer__col">
          <h4>Liên kết</h4>
          <ul>
            <li>
              <a href="#">Trang chu</a>
            </li>
            <li>
              <a href="#">Tour noi bat</a>
            </li>
            <li>
              <a href="#">Khuyen mai</a>
            </li>
            <li>
              <a href="#">Lien he</a>
            </li>
          </ul>
        </div>

        <div className="footer__col">
          <h4>Liên hệ</h4>
          <ul className="footer__contact-list">
            <li>
              <HiOutlineMapPin /> 23 Nguyen Van Linh, Da Nang
            </li>
            <li>
              <FaPhoneAlt /> 1900 6868
            </li>
            <li>
              <MdOutlineMailOutline /> support@bestpricetravel.vn
            </li>
          </ul>
        </div>

        <div className="footer__col">
          <h4>Social</h4>
          <div className="footer__socials">
            <Link href="#" aria-label="Facebook">
              <FaFacebookF />
            </Link>
            <Link href="#" aria-label="Instagram">
              <FaInstagram />
            </Link>
            <Link href="#" aria-label="Youtube">
              <FaYoutube />
            </Link>
          </div>
        </div>
      </div>

      <div className="footer__bottom">
        <p>Copyright 2026 DACN Travel. All rights reserved.</p>
      </div>
    </footer>
  );
}

export default Footer;
