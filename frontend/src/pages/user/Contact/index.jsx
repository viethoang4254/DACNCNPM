import { useMemo, useState } from "react";
import { FaMapMarkerAlt, FaPhoneAlt, FaEnvelope } from "react-icons/fa";
import "./Contact.scss";

const INITIAL_FORM = {
  fullName: "",
  email: "",
  phone: "",
  message: "",
};

function Contact() {
  const apiBaseUrl = useMemo(
    () => import.meta.env.VITE_API_BASE_URL || "http://localhost:5000",
    [],
  );

  const [form, setForm] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState("");
  const [submitType, setSubmitType] = useState("success");

  const validate = (values) => {
    const nextErrors = {};

    if (!values.fullName.trim()) {
      nextErrors.fullName = "Vui lòng nhập họ và tên";
    }

    if (!values.email.trim()) {
      nextErrors.email = "Vui lòng nhập email";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
      nextErrors.email = "Email không hợp lệ";
    }

    if (!values.phone.trim()) {
      nextErrors.phone = "Vui lòng nhập số điện thoại";
    }

    if (!values.message.trim()) {
      nextErrors.message = "Vui lòng nhập nội dung tin nhắn";
    }

    return nextErrors;
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
    setSubmitMessage("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const nextErrors = validate(form);

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setErrors({});
    setIsSubmitting(true);
    setSubmitMessage("");

    try {
      const response = await fetch(`${apiBaseUrl}/api/contact`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ho_ten: form.fullName.trim(),
          email: form.email.trim(),
          so_dien_thoai: form.phone.trim(),
          noi_dung: form.message.trim(),
        }),
      });

      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(payload.message || `HTTP ${response.status}`);
      }

      setSubmitType("success");
      setSubmitMessage("Tin nhắn của bạn đã được gửi thành công.");
      setForm(INITIAL_FORM);
    } catch (error) {
      setSubmitType("error");
      setSubmitMessage(
        error.message || "Không thể gửi tin nhắn. Vui lòng thử lại sau.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="contact-page">
      <section className="contact-page__banner">
        <div className="contact-page__banner-overlay" />
        <div className="contact-page__container contact-page__banner-content">
          <h1>Liên Hệ Với Chúng Tôi</h1>
          <p>
            Đội ngũ BestPrice Travel luôn sẵn sàng hỗ trợ bạn lên kế hoạch cho
            hành trình khám phá Việt Nam trọn vẹn nhất.
          </p>
        </div>
      </section>

      <section className="contact-page__container contact-page__content">
        <div className="contact-form-card">
          <h2>Gửi tin nhắn cho chúng tôi</h2>
          <p>
            Điền thông tin bên dưới và đội ngũ tư vấn sẽ liên hệ lại trong thời
            gian sớm nhất.
          </p>

          <form className="contact-form" onSubmit={handleSubmit} noValidate>
            <div className="contact-form__group">
              <label htmlFor="fullName">Họ và tên</label>
              <input
                id="fullName"
                name="fullName"
                type="text"
                value={form.fullName}
                onChange={handleChange}
                className={errors.fullName ? "is-invalid" : ""}
                placeholder="Nguyễn Văn A"
              />
              {errors.fullName && (
                <span className="error-text">{errors.fullName}</span>
              )}
            </div>

            <div className="contact-form__row">
              <div className="contact-form__group">
                <label htmlFor="email">Email</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  className={errors.email ? "is-invalid" : ""}
                  placeholder="you@email.com"
                />
                {errors.email && (
                  <span className="error-text">{errors.email}</span>
                )}
              </div>

              <div className="contact-form__group">
                <label htmlFor="phone">Số điện thoại</label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={form.phone}
                  onChange={handleChange}
                  className={errors.phone ? "is-invalid" : ""}
                  placeholder="0901 234 567"
                />
                {errors.phone && (
                  <span className="error-text">{errors.phone}</span>
                )}
              </div>
            </div>

            <div className="contact-form__group">
              <label htmlFor="message">Nội dung tin nhắn</label>
              <textarea
                id="message"
                name="message"
                rows="6"
                value={form.message}
                onChange={handleChange}
                className={errors.message ? "is-invalid" : ""}
                placeholder="Bạn cần tư vấn tour nào?"
              />
              {errors.message && (
                <span className="error-text">{errors.message}</span>
              )}
            </div>

            {submitMessage && (
              <p
                className={`contact-form__feedback contact-form__feedback--${submitType}`}
                role="status"
              >
                {submitMessage}
              </p>
            )}

            <button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Sending..." : "Send Message"}
            </button>
          </form>
        </div>

        <aside className="contact-sidebar">
          <div className="contact-info-grid">
            <article className="contact-info-card">
              <div className="contact-info-card__icon-wrap">
                <FaMapMarkerAlt />
              </div>
              <h3>Địa chỉ</h3>
              <p>23 Nguyễn Văn Linh, Hải Châu, Đà Nẵng</p>
            </article>

            <article className="contact-info-card">
              <div className="contact-info-card__icon-wrap">
                <FaPhoneAlt />
              </div>
              <h3>Số điện thoại</h3>
              <p>1900 6868</p>
            </article>

            <article className="contact-info-card">
              <div className="contact-info-card__icon-wrap">
                <FaEnvelope />
              </div>
              <h3>Email</h3>
              <p>support@bestpricetravel.vn</p>
            </article>
          </div>

          <div className="contact-map-card">
            <h3>Bản đồ văn phòng</h3>
            <iframe
              title="BestPrice Travel Office Map"
              src="https://maps.google.com/maps?q=Da%20Nang&t=&z=13&ie=UTF8&iwloc=&output=embed"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </aside>
      </section>
    </main>
  );
}

export default Contact;
