import { useEffect, useState } from "react";

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
    if (!normalizedValue) return "Vui long nhap ho ten.";
    if (normalizedValue.length < 2) return "Ho ten phai co it nhat 2 ky tu.";
    return "";
  }

  if (name === "email") {
    if (!normalizedValue) return "Vui long nhap email.";
    if (!EMAIL_REGEX.test(normalizedValue)) return "Email khong dung dinh dang.";
    return "";
  }

  if (name === "so_dien_thoai") {
    const normalizedPhone = String(value || "").replace(/\s+/g, "").trim();
    if (!normalizedPhone) return "Vui long nhap so dien thoai.";
    if (!PHONE_REGEX.test(normalizedPhone)) return "So dien thoai chua dung dinh dang Viet Nam.";
    return "";
  }

  if (name === "mat_khau") {
    if (mode === "create" && !normalizedValue) return "Mat khau la bat buoc khi tao user.";
    if (normalizedValue && normalizedValue.length < 6) return "Mat khau phai co it nhat 6 ky tu.";
    return "";
  }

  if (name === "role") {
    if (!["admin", "customer"].includes(value)) return "Role khong hop le.";
    return "";
  }

  return "";
};

function UserFormModal({ open, mode = "create", user, loading = false, onClose, onSubmit }) {
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
      setFormError("Vui long kiem tra lai thong tin trong form.");
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
    <div className="admin-modal__backdrop" role="dialog" aria-modal="true" aria-labelledby="user-form-modal-title">
      <div className="user-form-modal">
        <div className="user-form-modal__header">
          <div>
            <h3 id="user-form-modal-title">{mode === "create" ? "Add User" : "Edit User"}</h3>
            <p>{mode === "create" ? "Tao nguoi dung moi trong he thong." : "Cap nhat thong tin nguoi dung."}</p>
          </div>
          <button type="button" className="admin-btn admin-btn--ghost" onClick={onClose} disabled={loading}>
            Close
          </button>
        </div>

        <form className="user-form-modal__body" onSubmit={handleSubmit}>
          <div className="admin-form-grid">
            <div>
              <label className="user-form-modal__label" htmlFor="ho_ten">Name</label>
              <input
                id="ho_ten"
                className={`admin-input ${touched.ho_ten && fieldErrors.ho_ten ? "admin-input--invalid" : ""}`}
                name="ho_ten"
                value={form.ho_ten}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="Nhap ho ten"
                aria-invalid={Boolean(touched.ho_ten && fieldErrors.ho_ten)}
              />
              {touched.ho_ten && fieldErrors.ho_ten && <p className="admin-field-error">{fieldErrors.ho_ten}</p>}
            </div>
            <div>
              <label className="user-form-modal__label" htmlFor="email">Email</label>
              <input
                id="email"
                className={`admin-input ${touched.email && fieldErrors.email ? "admin-input--invalid" : ""}`}
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="Nhap email"
                aria-invalid={Boolean(touched.email && fieldErrors.email)}
              />
              {touched.email && fieldErrors.email && <p className="admin-field-error">{fieldErrors.email}</p>}
            </div>
            <div>
              <label className="user-form-modal__label" htmlFor="so_dien_thoai">Phone</label>
              <input
                id="so_dien_thoai"
                className={`admin-input ${touched.so_dien_thoai && fieldErrors.so_dien_thoai ? "admin-input--invalid" : ""}`}
                name="so_dien_thoai"
                value={form.so_dien_thoai}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="Nhap so dien thoai"
                aria-invalid={Boolean(touched.so_dien_thoai && fieldErrors.so_dien_thoai)}
              />
              {touched.so_dien_thoai && fieldErrors.so_dien_thoai && <p className="admin-field-error">{fieldErrors.so_dien_thoai}</p>}
            </div>
            <div>
              <label className="user-form-modal__label" htmlFor="role">Role</label>
              <select
                id="role"
                className={`admin-select ${touched.role && fieldErrors.role ? "admin-input--invalid" : ""}`}
                name="role"
                value={form.role}
                onChange={handleChange}
                onBlur={handleBlur}
              >
                <option value="admin">admin</option>
                <option value="customer">customer</option>
              </select>
              {touched.role && fieldErrors.role && <p className="admin-field-error">{fieldErrors.role}</p>}
            </div>
            <div className="full">
              <label className="user-form-modal__label" htmlFor="mat_khau">
                Password {mode === "edit" ? "(de trong neu khong doi)" : ""}
              </label>
              <input
                id="mat_khau"
                className={`admin-input ${touched.mat_khau && fieldErrors.mat_khau ? "admin-input--invalid" : ""}`}
                name="mat_khau"
                type="password"
                value={form.mat_khau}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder={mode === "create" ? "Nhap mat khau" : "Nhap mat khau moi neu can"}
                aria-invalid={Boolean(touched.mat_khau && fieldErrors.mat_khau)}
              />
              <p className="user-form-modal__helper">
                {mode === "create" ? "Mat khau toi thieu 6 ky tu." : "De trong neu muon giu nguyen mat khau hien tai."}
              </p>
              {touched.mat_khau && fieldErrors.mat_khau && <p className="admin-field-error">{fieldErrors.mat_khau}</p>}
            </div>
          </div>

          {formError && <p className="admin-form-error">{formError}</p>}

          <div className="user-form-modal__footer">
            <button type="button" className="admin-btn" onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="admin-btn admin-btn--primary" disabled={loading}>
              {loading ? "Saving..." : mode === "create" ? "Create User" : "Update User"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default UserFormModal;