import { useEffect, useState } from "react";
import { MdClose } from "react-icons/md";
import "./UserFormModal.scss";

const initialFormState = {
  ho_ten: "",
  email: "",
  so_dien_thoai: "",
  mat_khau: "",
  role: "customer",
};

const EMAIL_REGEX = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
const PHONE_REGEX = /^(?:\+84|0)(?:3|5|7|8|9)\d{8}$/;

const initialTouchedState = {
  ho_ten: false,
  email: false,
  so_dien_thoai: false,
  mat_khau: false,
  role: false,
};

const getFieldError = (name, value, mode) => {
  const normalizedValue = typeof value === "string" ? value.trim() : value;

  if (name === "ho_ten") {
    if (!normalizedValue) return "Vui lòng nhập họ tên.";
    if (normalizedValue.length < 2) return "Họ tên phải có ít nhất 2 ký tự.";
    return "";
  }

  if (name === "email") {
    if (!normalizedValue) return "Vui lòng nhập email.";
    if (!EMAIL_REGEX.test(normalizedValue))
      return "Email không đúng định dạng.";
    return "";
  }

  if (name === "so_dien_thoai") {
    const normalizedPhone = String(value || "")
      .replace(/\s+/g, "")
      .trim();
    if (!normalizedPhone) return "Vui lòng nhập số điện thoại.";
    if (!PHONE_REGEX.test(normalizedPhone))
      return "Số điện thoại chưa đúng định dạng Việt Nam.";
    return "";
  }

  if (name === "mat_khau") {
    if (mode === "create" && !normalizedValue)
      return "Mật khẩu là bắt buộc khi tạo người dùng.";
    if (normalizedValue && normalizedValue.length < 6)
      return "Mật khẩu phải có ít nhất 6 ký tự.";
    return "";
  }

  if (name === "role") {
    if (!["admin", "customer"].includes(value)) return "Vai trò không hợp lệ.";
    return "";
  }

  return "";
};

function UserFormModal({
  open,
  mode = "create",
  user,
  loading = false,
  onClose,
  onSubmit,
}) {
  const [form, setForm] = useState(initialFormState);
  const [formError, setFormError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [touched, setTouched] = useState(initialTouchedState);

  useEffect(() => {
    if (!open) {
      setForm(initialFormState);
      setFormError("");
      setFieldErrors({});
      setTouched(initialTouchedState);
      return;
    }

    setForm({
      ho_ten: user?.ho_ten || "",
      email: user?.email || "",
      so_dien_thoai: user?.so_dien_thoai || "",
      mat_khau: "",
      role: user?.role || "customer",
    });
    setFormError("");
    setFieldErrors({});
    setTouched(initialTouchedState);
  }, [open, user]);

  if (!open) {
    return null;
  }

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));

    if (touched[name]) {
      setFieldErrors((prev) => ({
        ...prev,
        [name]: getFieldError(name, value, mode),
      }));
    }
  }

  function handleBlur(event) {
    const { name, value } = event.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    setFieldErrors((prev) => ({
      ...prev,
      [name]: getFieldError(name, value, mode),
    }));
  }

  function handleSubmit(event) {
    event.preventDefault();

    const nextTouched = {
      ho_ten: true,
      email: true,
      so_dien_thoai: true,
      mat_khau: true,
      role: true,
    };

    const nextFieldErrors = {
      ho_ten: getFieldError("ho_ten", form.ho_ten, mode),
      email: getFieldError("email", form.email, mode),
      so_dien_thoai: getFieldError("so_dien_thoai", form.so_dien_thoai, mode),
      mat_khau: getFieldError("mat_khau", form.mat_khau, mode),
      role: getFieldError("role", form.role, mode),
    };

    setTouched(nextTouched);
    setFieldErrors(nextFieldErrors);

    if (Object.values(nextFieldErrors).some(Boolean)) {
      setFormError("Vui lòng kiểm tra lại thông tin trong biểu mẫu.");
      return;
    }

    setFormError("");
    onSubmit({
      ho_ten: form.ho_ten.trim(),
      email: form.email.trim(),
      so_dien_thoai: form.so_dien_thoai.replace(/\s+/g, "").trim(),
      mat_khau: form.mat_khau.trim(),
      role: form.role,
    });
  }

  return (
    <div
      className="admin-modal__backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="user-form-modal-title"
    >
      <div className="user-form-modal">
        <div className="user-form-modal__header">
          <div>
            <h3 id="user-form-modal-title">
              {mode === "create" ? "Thêm người dùng" : "Chỉnh sửa người dùng"}
            </h3>
            <p>
              {mode === "create"
                ? "Tạo người dùng mới trong hệ thống."
                : "Cập nhật thông tin người dùng."}
            </p>
          </div>
          <button
            type="button"
            className="user-form-modal__close"
            onClick={onClose}
            disabled={loading}
            aria-label="Đóng"
          >
            <MdClose />
          </button>
        </div>

        <form className="user-form-modal__body" onSubmit={handleSubmit}>
          <div className="admin-form-grid">
            <div>
              <label className="user-form-modal__label" htmlFor="ho_ten">
                Họ tên
              </label>
              <input
                id="ho_ten"
                className={`admin-input ${touched.ho_ten && fieldErrors.ho_ten ? "admin-input--invalid" : ""}`}
                name="ho_ten"
                value={form.ho_ten}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="Nhập họ tên"
                aria-invalid={Boolean(touched.ho_ten && fieldErrors.ho_ten)}
              />
              {touched.ho_ten && fieldErrors.ho_ten && (
                <p className="admin-field-error">{fieldErrors.ho_ten}</p>
              )}
            </div>
            <div>
              <label className="user-form-modal__label" htmlFor="email">
                Email
              </label>
              <input
                id="email"
                className={`admin-input ${touched.email && fieldErrors.email ? "admin-input--invalid" : ""}`}
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="Nhập email"
                aria-invalid={Boolean(touched.email && fieldErrors.email)}
              />
              {touched.email && fieldErrors.email && (
                <p className="admin-field-error">{fieldErrors.email}</p>
              )}
            </div>
            <div>
              <label className="user-form-modal__label" htmlFor="so_dien_thoai">
                Số điện thoại
              </label>
              <input
                id="so_dien_thoai"
                className={`admin-input ${touched.so_dien_thoai && fieldErrors.so_dien_thoai ? "admin-input--invalid" : ""}`}
                name="so_dien_thoai"
                value={form.so_dien_thoai}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="Nhập số điện thoại"
                aria-invalid={Boolean(
                  touched.so_dien_thoai && fieldErrors.so_dien_thoai,
                )}
              />
              {touched.so_dien_thoai && fieldErrors.so_dien_thoai && (
                <p className="admin-field-error">{fieldErrors.so_dien_thoai}</p>
              )}
            </div>
            <div>
              <label className="user-form-modal__label" htmlFor="role">
                Vai trò
              </label>
              <select
                id="role"
                className={`admin-select ${touched.role && fieldErrors.role ? "admin-input--invalid" : ""}`}
                name="role"
                value={form.role}
                onChange={handleChange}
                onBlur={handleBlur}
              >
                <option value="admin">Quản trị viên</option>
                <option value="customer">Khách hàng</option>
              </select>
              {touched.role && fieldErrors.role && (
                <p className="admin-field-error">{fieldErrors.role}</p>
              )}
            </div>
            <div className="full">
              <label className="user-form-modal__label" htmlFor="mat_khau">
                Mật khẩu {mode === "edit" ? "(để trống nếu không đổi)" : ""}
              </label>
              <input
                id="mat_khau"
                className={`admin-input ${touched.mat_khau && fieldErrors.mat_khau ? "admin-input--invalid" : ""}`}
                name="mat_khau"
                type="password"
                value={form.mat_khau}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder={
                  mode === "create"
                    ? "Nhập mật khẩu"
                    : "Nhập mật khẩu mới nếu cần"
                }
                aria-invalid={Boolean(touched.mat_khau && fieldErrors.mat_khau)}
              />
              {/* <p className="user-form-modal__helper">
                {mode === "create" ? "Mật khẩu tối thiểu 6 ký tự." : "Để trống nếu muốn giữ nguyên mật khẩu hiện tại."}
              </p> */}
              {touched.mat_khau && fieldErrors.mat_khau && (
                <p className="admin-field-error">{fieldErrors.mat_khau}</p>
              )}
            </div>
          </div>

          {formError && <p className="admin-form-error">{formError}</p>}

          <div className="user-form-modal__footer">
            <button
              type="button"
              className="admin-btn"
              onClick={onClose}
              disabled={loading}
            >
              Hủy
            </button>
            <button
              type="submit"
              className="admin-btn admin-btn--primary"
              disabled={loading}
            >
              {loading
                ? "Đang lưu..."
                : mode === "create"
                  ? "Tạo người dùng"
                  : "Cập nhật người dùng"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default UserFormModal;
