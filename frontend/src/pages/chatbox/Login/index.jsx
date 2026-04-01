import { useEffect, useState } from "react";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { getAuthUser, saveAuthSession } from "../../../utils/authStorage";
import "./Login.scss";

const EMAIL_REGEX = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const validateEmail = (value) => {
  if (!value.trim()) return "Vui lòng nhập email";
  if (!EMAIL_REGEX.test(value.trim())) return "Email không đúng định dạng. Ví dụ: ten@domain.com";
  return "";
};

function ChatboxLogin() {
  const navigate = useNavigate();

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

  useEffect(() => {
    const user = getAuthUser();
    if (user?.role === "admin" || user?.role === "chatbox") {
      navigate("/chatbox", { replace: true });
    }
  }, [navigate]);

  const validatePassword = (value) => {
    if (!value) return "Vui lòng nhập mật khẩu";
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

    if (nextEmailError || nextPasswordError) return;

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
        if (response.status === 401) {
          setSubmitError("Email hoặc mật khẩu không đúng");
          return;
        }

        const backendMessage = payload?.message || "Đăng nhập thất bại";
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

      if (user.role !== "admin" && user.role !== "chatbox") {
        setSubmitError("Tài khoản này không có quyền truy cập chatbox");
        return;
      }

      saveAuthSession({ token, user, rememberMe });
      navigate("/chatbox", { replace: true });
    } catch {
      setSubmitError("Không thể kết nối máy chủ. Vui lòng thử lại sau.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEmailChange = (event) => {
    const nextEmail = event.target.value;
    setEmail(nextEmail);
    if (isEmailTouched) setEmailError(validateEmail(nextEmail));
  };

  const handleEmailBlur = () => {
    setIsEmailTouched(true);
    setEmailError(validateEmail(email));
  };

  const handlePasswordChange = (event) => {
    const nextPassword = event.target.value;
    setPassword(nextPassword);
    if (isPasswordTouched) setPasswordError(validatePassword(nextPassword));
  };

  const handlePasswordBlur = () => {
    setIsPasswordTouched(true);
    setPasswordError(validatePassword(password));
  };

  return (
    <main className="auth-page auth-page--login auth-page--chatbox">
      <section className="auth-card">
        <div className="auth-card__left">
          <p className="auth-card__eyebrow">BestPrice Travel</p>
          <h1>Chatbox</h1>
          <p>Đăng nhập tài khoản chatbox để trực chat với khách hàng.</p>
        </div>

        <div className="auth-card__right">
          <h2>Đăng nhập chatbox</h2>
          <form className="auth-form" onSubmit={handleSubmit} noValidate>
            <label htmlFor="chatbox-login-email">Email</label>
            <input
              id="chatbox-login-email"
              type="email"
              placeholder="email@example.com"
              value={email}
              onChange={handleEmailChange}
              onBlur={handleEmailBlur}
              className={emailError ? "is-invalid" : ""}
              aria-invalid={Boolean(emailError)}
            />
            {emailError && <p className="auth-form__error">{emailError}</p>}

            <label htmlFor="chatbox-login-password">Mật khẩu</label>
            <div className="auth-form__password-field">
              <input
                id="chatbox-login-password"
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
            {passwordError && <p className="auth-form__error">{passwordError}</p>}

            <div className="auth-form__row">
              <label className="auth-checkbox" htmlFor="chatbox-remember-me">
                <input
                  id="chatbox-remember-me"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(event) => setRememberMe(event.target.checked)}
                />
                Ghi nhớ đăng nhập
              </label>
            </div>

            {submitError && <p className="auth-form__error">{submitError}</p>}

            <button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Đang đăng nhập..." : "Đăng nhập"}
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}

export default ChatboxLogin;
