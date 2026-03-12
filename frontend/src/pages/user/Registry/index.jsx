import { useEffect, useState } from "react";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { Link, useNavigate } from "react-router-dom";
import "./Registry.scss";

const EMAIL_REGEX = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
const PHONE_REGEX = /^(?:\+84|0)(?:3|5|7|8|9)\d{8}$/;
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

const validatePhone = (value) => {
  const normalizedPhone = value.replace(/\s+/g, "").trim();
  if (!normalizedPhone) {
    return "Vui lòng nhập số điện thoại";
  }

  if (!PHONE_REGEX.test(normalizedPhone)) {
    return "Số điện thoại chưa đúng định dạng Việt Nam";
  }

  return "";
};

function Registry() {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [fullNameError, setFullNameError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");
  const [termsError, setTermsError] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [isFullNameTouched, setIsFullNameTouched] = useState(false);
  const [isEmailTouched, setIsEmailTouched] = useState(false);
  const [isPhoneTouched, setIsPhoneTouched] = useState(false);
  const [isPasswordTouched, setIsPasswordTouched] = useState(false);
  const [isConfirmPasswordTouched, setIsConfirmPasswordTouched] =
    useState(false);
  const [isTermsTouched, setIsTermsTouched] = useState(false);

  const validateFullName = (value) => {
    if (!value.trim()) {
      return "Vui lòng nhập họ và tên";
    }

    if (value.trim().length < 2) {
      return "Họ và tên phải có ít nhất 2 ký tự";
    }

    return "";
  };

  const validatePassword = (value) => {
    if (!value) {
      return "Vui lòng nhập mật khẩu";
    }

    if (value.length < 6) {
      return "Mật khẩu phải có ít nhất 6 ký tự";
    }

    return "";
  };

  const validateConfirmPassword = (value, originalPassword) => {
    if (!value) {
      return "Vui lòng xác nhận mật khẩu";
    }

    if (value !== originalPassword) {
      return "Mật khẩu xác nhận không khớp";
    }

    return "";
  };

  const validateTerms = (value) => {
    if (!value) {
      return "Bạn cần đồng ý điều khoản trước khi đăng ký";
    }

    return "";
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const nextFullNameError = validateFullName(fullName);
    const nextEmailError = validateEmail(email);
    const nextPhoneError = validatePhone(phone);
    const nextPasswordError = validatePassword(password);
    const nextConfirmPasswordError = validateConfirmPassword(
      confirmPassword,
      password,
    );
    const nextTermsError = validateTerms(acceptTerms);

    setFullNameError(nextFullNameError);
    setEmailError(nextEmailError);
    setPhoneError(nextPhoneError);
    setPasswordError(nextPasswordError);
    setConfirmPasswordError(nextConfirmPasswordError);
    setTermsError(nextTermsError);

    setIsFullNameTouched(true);
    setIsEmailTouched(true);
    setIsPhoneTouched(true);
    setIsPasswordTouched(true);
    setIsConfirmPasswordTouched(true);
    setIsTermsTouched(true);

    setSubmitError("");
    setSubmitSuccess("");

    if (
      nextFullNameError ||
      nextEmailError ||
      nextPhoneError ||
      nextPasswordError ||
      nextConfirmPasswordError ||
      nextTermsError
    ) {
      return;
    }

    try {
      setIsSubmitting(true);

      const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ho_ten: fullName.trim(),
          email: email.trim(),
          mat_khau: password,
          so_dien_thoai: phone.replace(/\s+/g, "").trim(),
        }),
      });

      const payload = await response.json();

      if (!response.ok || !payload.success) {
        const backendMessage = payload?.message || "Đăng ký thất bại";

        if (
          response.status === 409 ||
          /email already exists/i.test(backendMessage)
        ) {
          setEmailError("Email này đã được đăng ký. Vui lòng dùng email khác.");
          setSubmitError("Email đã tồn tại trong hệ thống.");
          return;
        }

        const firstValidationError = payload?.data?.errors?.[0]?.msg;
        setSubmitError(firstValidationError || backendMessage);
        return;
      }

      setSubmitSuccess(
        "Đăng ký thành công. Bạn có thể đăng nhập ngay bây giờ.",
      );
      setFullName("");
      setEmail("");
      setPhone("");
      setPassword("");
      setConfirmPassword("");
      setAcceptTerms(false);

      setFullNameError("");
      setEmailError("");
      setPhoneError("");
      setPasswordError("");
      setConfirmPasswordError("");
      setTermsError("");

      setIsFullNameTouched(false);
      setIsEmailTouched(false);
      setIsPhoneTouched(false);
      setIsPasswordTouched(false);
      setIsConfirmPasswordTouched(false);
      setIsTermsTouched(false);
    } catch {
      setSubmitError("Không thể kết nối máy chủ. Vui lòng thử lại sau.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFullNameChange = (event) => {
    const nextFullName = event.target.value;
    setFullName(nextFullName);
    if (isFullNameTouched) {
      setFullNameError(validateFullName(nextFullName));
    }
  };

  const handleFullNameBlur = () => {
    setIsFullNameTouched(true);
    setFullNameError(validateFullName(fullName));
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

  const handlePhoneChange = (event) => {
    const nextPhone = event.target.value;
    setPhone(nextPhone);

    if (isPhoneTouched) {
      setPhoneError(validatePhone(nextPhone));
    }
  };

  const handlePhoneBlur = () => {
    setIsPhoneTouched(true);
    setPhoneError(validatePhone(phone));
  };

  const handlePasswordChange = (event) => {
    const nextPassword = event.target.value;
    setPassword(nextPassword);

    if (isPasswordTouched) {
      setPasswordError(validatePassword(nextPassword));
    }
    if (isConfirmPasswordTouched) {
      setConfirmPasswordError(
        validateConfirmPassword(confirmPassword, nextPassword),
      );
    }
  };

  const handlePasswordBlur = () => {
    setIsPasswordTouched(true);
    setPasswordError(validatePassword(password));
  };

  const handleConfirmPasswordChange = (event) => {
    const nextConfirmPassword = event.target.value;
    setConfirmPassword(nextConfirmPassword);

    if (isConfirmPasswordTouched) {
      setConfirmPasswordError(
        validateConfirmPassword(nextConfirmPassword, password),
      );
    }
  };

  const handleConfirmPasswordBlur = () => {
    setIsConfirmPasswordTouched(true);
    setConfirmPasswordError(validateConfirmPassword(confirmPassword, password));
  };

  const handleTermsChange = (event) => {
    const nextChecked = event.target.checked;
    setAcceptTerms(nextChecked);

    if (isTermsTouched) {
      setTermsError(validateTerms(nextChecked));
    }
  };

  useEffect(() => {
    if (!submitSuccess) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      navigate("/login");
    }, 1500);

    return () => window.clearTimeout(timeoutId);
  }, [submitSuccess, navigate]);

  return (
    <main className="registry-page">
      <section className="registry-card">
        <div className="registry-card__left">
          <p className="registry-card__eyebrow">BestPrice Membership</p>
          <h1>Tạo tài khoản mới</h1>
          <p>
            Đăng ký để nhận ưu đãi độc quyền, tích điểm cho mỗi hành trình và
            theo dõi lịch sử đặt tour.
          </p>
        </div>

        <div className="registry-card__right">
          <h2>Đăng ký tài khoản</h2>
          <form className="registry-form" onSubmit={handleSubmit} noValidate>
            <label htmlFor="full-name">Họ và tên</label>
            <input
              id="full-name"
              type="text"
              placeholder="Nhập họ và tên"
              value={fullName}
              onChange={handleFullNameChange}
              onBlur={handleFullNameBlur}
              className={fullNameError ? "is-invalid" : ""}
              aria-invalid={Boolean(fullNameError)}
            />
            {fullNameError && (
              <p className="registry-form__error">{fullNameError}</p>
            )}

            <label htmlFor="registry-email">Email</label>
            <input
              id="registry-email"
              type="email"
              placeholder="email@example.com"
              value={email}
              onChange={handleEmailChange}
              onBlur={handleEmailBlur}
              className={emailError ? "is-invalid" : ""}
              aria-invalid={Boolean(emailError)}
            />
            {emailError && <p className="registry-form__error">{emailError}</p>}

            <label htmlFor="registry-phone">Số điện thoại</label>
            <input
              id="registry-phone"
              type="tel"
              inputMode="numeric"
              placeholder="Nhập số điện thoại"
              value={phone}
              onChange={handlePhoneChange}
              onBlur={handlePhoneBlur}
              className={phoneError ? "is-invalid" : ""}
              aria-invalid={Boolean(phoneError)}
            />
            {phoneError && <p className="registry-form__error">{phoneError}</p>}

            <label htmlFor="registry-password">Mật khẩu</label>
            <div className="registry-form__password-field">
              <input
                id="registry-password"
                type={showPassword ? "text" : "password"}
                placeholder="Tối thiểu 6 ký tự"
                value={password}
                onChange={handlePasswordChange}
                onBlur={handlePasswordBlur}
                className={passwordError ? "is-invalid" : ""}
                aria-invalid={Boolean(passwordError)}
              />
              <button
                type="button"
                className="registry-form__password-toggle"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
              >
                {showPassword ? <FaEye /> : <FaEyeSlash />}
              </button>
            </div>
            {passwordError && (
              <p className="registry-form__error">{passwordError}</p>
            )}

            <label htmlFor="confirm-password">Xác nhận mật khẩu</label>
            <div className="registry-form__password-field">
              <input
                id="confirm-password"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Nhập lại mật khẩu"
                value={confirmPassword}
                onChange={handleConfirmPasswordChange}
                onBlur={handleConfirmPasswordBlur}
                className={confirmPasswordError ? "is-invalid" : ""}
                aria-invalid={Boolean(confirmPasswordError)}
              />
              <button
                type="button"
                className="registry-form__password-toggle"
                onClick={() => setShowConfirmPassword((prev) => !prev)}
                aria-label={
                  showConfirmPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"
                }
              >
                {showConfirmPassword ? <FaEye /> : <FaEyeSlash />}
              </button>
            </div>
            {confirmPasswordError && (
              <p className="registry-form__error">{confirmPasswordError}</p>
            )}

            <label className="registry-checkbox" htmlFor="accept-terms">
              <input
                id="accept-terms"
                type="checkbox"
                checked={acceptTerms}
                onChange={handleTermsChange}
                onBlur={() => {
                  setIsTermsTouched(true);
                  setTermsError(validateTerms(acceptTerms));
                }}
              />
              Tôi đồng ý với điều khoản và chính sách bảo mật
            </label>
            {termsError && <p className="registry-form__error">{termsError}</p>}

            {submitError && (
              <p className="registry-form__error">{submitError}</p>
            )}
            {submitSuccess && (
              <p className="registry-form__success">{submitSuccess}</p>
            )}

            <button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Đang đăng ký..." : "Tạo tài khoản"}
            </button>
          </form>

          <p className="registry-switch">
            Đã có tài khoản? <Link to="/login">Đăng nhập</Link>
          </p>
        </div>
      </section>
    </main>
  );
}

export default Registry;
