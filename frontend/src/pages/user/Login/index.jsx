import { useState } from "react";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { saveAuthSession } from "../../../utils/authStorage";
import "./Login.scss";

const EMAIL_REGEX = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const validateEmail = (value) => {
  if (!value.trim()) {
    return "Vui lòng nhập email";
  }

  if (!EMAIL_REGEX.test(value.trim())) {
    return "Email không đúng định dạng. Ví dụ: ten@domain.com";
  }

  return "";
};

function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const redirectPath =
    typeof location?.state?.from === "string" && location.state.from.trim()
      ? location.state.from
      : "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [isEmailTouched, setIsEmailTouched] = useState(false);
  const [isPasswordTouched, setIsPasswordTouched] = useState(false);

  const validatePassword = (value) => {
    if (!value) {
      return "Vui lòng nhập mật khẩu";
    }

    return "";
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const nextEmailError = validateEmail(email);
    const nextPasswordError = validatePassword(password);

    setEmailError(nextEmailError);
    setPasswordError(nextPasswordError);
    setIsEmailTouched(true);
    setIsPasswordTouched(true);
    setSubmitError("");

    if (nextEmailError || nextPasswordError) {
      return;
    }

    try {
      setIsSubmitting(true);

      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim(),
          mat_khau: password,
        }),
      });

      const payload = await response.json();

      if (!response.ok || !payload.success) {
        const backendMessage = payload?.message || "Đăng nhập thất bại";
        if (response.status === 401) {
          setSubmitError("Email hoặc mật khẩu không đúng");
          return;
        }

        const firstValidationError = payload?.data?.errors?.[0]?.msg;
        setSubmitError(firstValidationError || backendMessage);
        return;
      }

      const token = payload?.data?.token;
      const user = payload?.data?.user;
      if (!token || !user) {
        setSubmitError("Phản hồi đăng nhập không hợp lệ");
        return;
      }

      saveAuthSession({ token, user, rememberMe });

      if (user.role === "admin") {
        navigate("/admin", { replace: true });
        return;
      }

      if (user.role === "customer") {
        navigate(redirectPath, { replace: true });
        return;
      }

      setSubmitError("Vai trò tài khoản không hợp lệ");
    } catch {
      setSubmitError("Không thể kết nối máy chủ. Vui lòng thử lại sau.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEmailChange = (event) => {
    const nextEmail = event.target.value;
    setEmail(nextEmail);

    if (isEmailTouched) {
      setEmailError(validateEmail(nextEmail));
    }
  };

  const handleEmailBlur = () => {
    setIsEmailTouched(true);
    setEmailError(validateEmail(email));
  };

  const handlePasswordChange = (event) => {
    const nextPassword = event.target.value;
    setPassword(nextPassword);

    if (isPasswordTouched) {
      setPasswordError(validatePassword(nextPassword));
    }
  };

  const handlePasswordBlur = () => {
    setIsPasswordTouched(true);
    setPasswordError(validatePassword(password));
  };

  return (
    <main className="auth-page auth-page--login">
      <section className="auth-card">
        <div className="auth-card__left">
          <p className="auth-card__eyebrow">VietXanh Travel</p>
          <h1>Chào mừng bạn trở lại</h1>
          <p>
            Đăng nhập để quản lý lịch đặt tour, theo dõi ưu đãi và nhận thông
            báo hành trình mới nhất.
          </p>
        </div>

        <div className="auth-card__right">
          <h2>ĐĂNG NHẬP</h2>
          <form className="auth-form" onSubmit={handleSubmit} noValidate>
            <label htmlFor="login-email">Email</label>
            <input
              id="login-email"
              type="email"
              placeholder="email@example.com"
              value={email}
              onChange={handleEmailChange}
              onBlur={handleEmailBlur}
              className={emailError ? "is-invalid" : ""}
              aria-invalid={Boolean(emailError)}
            />
            {emailError && <p className="auth-form__error">{emailError}</p>}

            <label htmlFor="login-password">Mật khẩu</label>
            <div className="auth-form__password-field">
              <input
                id="login-password"
                type={showPassword ? "text" : "password"}
                placeholder="Nhập mật khẩu"
                value={password}
                onChange={handlePasswordChange}
                onBlur={handlePasswordBlur}
                className={passwordError ? "is-invalid" : ""}
                aria-invalid={Boolean(passwordError)}
              />
              <button
                type="button"
                className="auth-form__password-toggle"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
              >
                {showPassword ? <FaEye /> : <FaEyeSlash />}
              </button>
            </div>
            {passwordError && (
              <p className="auth-form__error">{passwordError}</p>
            )}

            <div className="auth-form__row">
              <label className="auth-checkbox" htmlFor="remember-me">
                <input
                  id="remember-me"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(event) => setRememberMe(event.target.checked)}
                />
                Ghi nhớ đăng nhập
              </label>
              <a href="#">Quên mật khẩu?</a>
            </div>

            {submitError && <p className="auth-form__error">{submitError}</p>}

            <button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Đang đăng nhập..." : "Đăng nhập"}
            </button>
          </form>

          <p className="auth-switch">
            Chưa có tài khoản? <Link to="/register">Đăng ký ngay</Link>
          </p>
        </div>
      </section>
    </main>
  );
}

export default Login;
