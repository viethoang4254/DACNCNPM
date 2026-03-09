import { FaRegUser } from "react-icons/fa";
import { NavLink } from "react-router-dom";
import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import "./Header.scss";
function Header() {
  const navListRef = useRef(null);
  const location = useLocation();

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
            <NavLink to="/">
              <img
                src="https://d122axpxm39woi.cloudfront.net/assets/img/bestpricetravel-logo-28122023.svg"
                alt="Logo"
              />
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
                <NavLink to="/tour" className="header__nav-item">
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
              <button className="account__btn-login">Đăng Nhập</button>
              <button className="account__btn-register">Đăng Ký</button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
export default Header;
