import {
  FaClipboardList,
  FaHistory,
  FaRegIdCard,
  FaRegUser,
  FaSignOutAlt,
} from "react-icons/fa";
import { MdOutlineTravelExplore } from "react-icons/md";
import { NavLink } from "react-router-dom";
import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { clearAuthSession, getAuthUser } from "../../../utils/authStorage";
import "./Header.scss";
function Header() {
  const navListRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();
  const authUser = getAuthUser();

  const handleLogout = () => {
    clearAuthSession();
    navigate("/login");
  };

  useEffect(() => {
    const updateSlider = () => {
      const navList = navListRef.current;
      if (!navList) {
        return;
      }

      const activeItem = navList.querySelector(".header__nav-item.active");
      if (!activeItem) {
        navList.style.setProperty("--slider-left", "0px");
        navList.style.setProperty("--slider-width", "0px");
        return;
      }

      const navRect = navList.getBoundingClientRect();
      const activeRect = activeItem.getBoundingClientRect();
      const rawLeft = activeRect.left - navRect.left;
      const width = Math.min(activeRect.width, navList.clientWidth);
      const maxLeft = Math.max(0, navList.clientWidth - width);
      const left = Math.min(Math.max(0, rawLeft), maxLeft);

      navList.style.setProperty("--slider-left", `${left}px`);
      navList.style.setProperty("--slider-width", `${width}px`);
    };

    const rafId = window.requestAnimationFrame(updateSlider);
    window.addEventListener("resize", updateSlider);

    return () => {
      window.cancelAnimationFrame(rafId);
      window.removeEventListener("resize", updateSlider);
    };
  }, [location.pathname]);

  return (
    <>
      <div className="header">
        <div className="header__container">
          <div className="header__logo">
            <NavLink
              to="/"
              className="header__logo-link"
              aria-label="VietXanh Travel"
            >
              <span className="header__logo-mark" aria-hidden="true">
                <svg
                  className="header__logo-emblem"
                  viewBox="0 0 72 72"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <defs>
                    <linearGradient
                      id="headerLogoSky"
                      x1="36"
                      y1="8"
                      x2="36"
                      y2="64"
                      gradientUnits="userSpaceOnUse"
                    >
                      <stop stopColor="#0B5FA5" />
                      <stop offset="1" stopColor="#1DA1D2" />
                    </linearGradient>
                    <linearGradient
                      id="headerLogoLeaf"
                      x1="22"
                      y1="28"
                      x2="52"
                      y2="58"
                      gradientUnits="userSpaceOnUse"
                    >
                      <stop stopColor="#68D46B" />
                      <stop offset="1" stopColor="#2AAE73" />
                    </linearGradient>
                    <linearGradient
                      id="headerLogoSun"
                      x1="48"
                      y1="16"
                      x2="58"
                      y2="28"
                      gradientUnits="userSpaceOnUse"
                    >
                      <stop stopColor="#FFD66E" />
                      <stop offset="1" stopColor="#F47B20" />
                    </linearGradient>
                  </defs>
                  <circle cx="36" cy="36" r="30" fill="url(#headerLogoSky)" />
                </svg>
                <MdOutlineTravelExplore className="header__logo-circle-icon" />
              </span>
              <span className="header__logo-text">
                <span className="header__logo-title">
                  <span className="header__logo-title-main">VietXanh</span>
                  <span className="header__logo-title-accent">Travel</span>
                </span>
                <span className="header__logo-subtitle">
                  Eco journeys across Vietnam
                </span>
              </span>
            </NavLink>
          </div>
          <div className="header__nav">
            <ul className="header__nav-list" ref={navListRef}>
              <li>
                <NavLink to="/" end className="header__nav-item">
                  Home
                </NavLink>
              </li>
              <li>
                <NavLink to="/tours" className="header__nav-item">
                  Tours
                </NavLink>
              </li>
              <li>
                <NavLink to="/about" className="header__nav-item">
                  About
                </NavLink>
              </li>
              <li>
                <NavLink to="/contact" className="header__nav-item">
                  Contact
                </NavLink>
              </li>
            </ul>
          </div>
          <div className="header__account">
            <div className="account-icon">
              <i>
                <FaRegUser />
              </i>
            </div>
            <div className="account-menu">
              {authUser ? (
                <>
                  <p className="account-menu__title">
                    Xin chào, {authUser.ho_ten}
                  </p>
                  <NavLink to="/customer" className="account__btn-login">
                    <span
                      className="account__menu-item-icon"
                      aria-hidden="true"
                    >
                      <FaRegIdCard />
                    </span>
                    Thông tin cá nhân
                  </NavLink>
                  <NavLink to="/customer" className="account__btn-login">
                    <span
                      className="account__menu-item-icon"
                      aria-hidden="true"
                    >
                      <FaClipboardList />
                    </span>
                    Lịch sử đặt tour
                  </NavLink>
                  <NavLink to="/tour-history" className="account__btn-login">
                    <span
                      className="account__menu-item-icon"
                      aria-hidden="true"
                    >
                      <FaHistory />
                    </span>
                    Tour đã xem
                  </NavLink>
                  <button
                    type="button"
                    className="account__btn-register"
                    onClick={handleLogout}
                  >
                    <span
                      className="account__menu-item-icon"
                      aria-hidden="true"
                    >
                      <FaSignOutAlt />
                    </span>
                    Đăng xuất
                  </button>
                </>
              ) : (
                <>
                  <NavLink to="/tour-history" className="account__btn-login">
                    <span
                      className="account__menu-item-icon"
                      aria-hidden="true"
                    >
                      <FaHistory />
                    </span>
                    Tour đã xem
                  </NavLink>
                  <NavLink to="/login" className="account__btn-login">
                    Đăng Nhập
                  </NavLink>
                  <NavLink to="/register" className="account__btn-register">
                    Đăng Ký
                  </NavLink>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
export default Header;
