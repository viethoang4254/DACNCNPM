import { useState } from "react";
import { useNavigate } from "react-router-dom";
import MessageModal from "../../../components/user/MessageModal";
import { changeUserPassword, getApiMessage } from "../../../services/userService";
import { clearAuthSession } from "../../../utils/authStorage";
import "./ChangePassword.scss";

const initialForm = {
  oldPassword: "",
  newPassword: "",
  confirmPassword: "",
};

const initialErrors = {
  oldPassword: "",
  newPassword: "",
  confirmPassword: "",
};

function ChangePassword() {
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState(initialErrors);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState({
    oldPassword: false,
    newPassword: false,
    confirmPassword: false,
  });
  const [modal, setModal] = useState({
    isOpen: false,
    type: "success",
    title: "",
    message: "",
    shouldLogout: false,
  });

  const validate = (values) => {
    const nextErrors = {
      oldPassword: "",
      newPassword: "",
      confirmPassword: "",
    };

    if (!values.oldPassword) {
      nextErrors.oldPassword = "Vui lòng nhập mật khẩu hiện tại";
    }

    if (!values.newPassword) {
      nextErrors.newPassword = "Vui lòng nhập mật khẩu mới";
    } else if (values.newPassword.length < 6) {
      nextErrors.newPassword = "Mật khẩu mới phải từ 6 ký tự";
    }

    if (!values.confirmPassword) {
      nextErrors.confirmPassword = "Vui lòng xác nhận mật khẩu";
    } else if (values.confirmPassword !== values.newPassword) {
      nextErrors.confirmPassword = "Xác nhận mật khẩu không khớp";
    }

    return nextErrors;
  };

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));

    setErrors((prev) => ({
      ...prev,
      [name]: "",
    }));
  };

  const togglePasswordVisibility = (key) => {
    setShowPassword((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const nextErrors = validate(form);
    setErrors(nextErrors);

    if (Object.values(nextErrors).some(Boolean)) {
      return;
    }

    try {
      setIsSubmitting(true);

      await changeUserPassword({
        oldPassword: form.oldPassword,
        newPassword: form.newPassword,
      });

      setForm(initialForm);
      setModal({
        isOpen: true,
        type: "success",
        title: "Đổi mật khẩu thành công",
        message: "Vui lòng đăng nhập lại để tiếp tục sử dụng hệ thống.",
        shouldLogout: true,
      });
    } catch (error) {
      setModal({
        isOpen: true,
        type: "error",
        title: "Đổi mật khẩu thất bại",
        message: getApiMessage(error, "Không thể đổi mật khẩu lúc này."),
        shouldLogout: false,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseModal = () => {
    const shouldLogout = modal.shouldLogout;

    setModal((prev) => ({
      ...prev,
      isOpen: false,
    }));

    if (shouldLogout) {
      clearAuthSession();
      navigate("/login", { replace: true });
    }
  };

  return (
    <section className="change-password">
      <div className="change-password__head">
        <h1>Đổi mật khẩu</h1>
        <p>Cập nhật mật khẩu để bảo mật tài khoản của bạn.</p>
      </div>

      <form className="change-password__form" onSubmit={handleSubmit} noValidate>
        <div className="change-password__field">
          <label htmlFor="oldPassword">Mật khẩu hiện tại</label>
          <div className="change-password__input-wrap">
            <input
              id="oldPassword"
              name="oldPassword"
              type={showPassword.oldPassword ? "text" : "password"}
              value={form.oldPassword}
              onChange={handleChange}
              className={errors.oldPassword ? "is-invalid" : ""}
            />
            <button
              type="button"
              onClick={() => togglePasswordVisibility("oldPassword")}
            >
              {showPassword.oldPassword ? "Ẩn" : "Hiện"}
            </button>
          </div>
          {errors.oldPassword && (
            <p className="change-password__error">{errors.oldPassword}</p>
          )}
        </div>

        <div className="change-password__field">
          <label htmlFor="newPassword">Mật khẩu mới</label>
          <div className="change-password__input-wrap">
            <input
              id="newPassword"
              name="newPassword"
              type={showPassword.newPassword ? "text" : "password"}
              value={form.newPassword}
              onChange={handleChange}
              className={errors.newPassword ? "is-invalid" : ""}
            />
            <button
              type="button"
              onClick={() => togglePasswordVisibility("newPassword")}
            >
              {showPassword.newPassword ? "Ẩn" : "Hiện"}
            </button>
          </div>
          {errors.newPassword && (
            <p className="change-password__error">{errors.newPassword}</p>
          )}
        </div>

        <div className="change-password__field">
          <label htmlFor="confirmPassword">Xác nhận mật khẩu mới</label>
          <div className="change-password__input-wrap">
            <input
              id="confirmPassword"
              name="confirmPassword"
              type={showPassword.confirmPassword ? "text" : "password"}
              value={form.confirmPassword}
              onChange={handleChange}
              className={errors.confirmPassword ? "is-invalid" : ""}
            />
            <button
              type="button"
              onClick={() => togglePasswordVisibility("confirmPassword")}
            >
              {showPassword.confirmPassword ? "Ẩn" : "Hiện"}
            </button>
          </div>
          {errors.confirmPassword && (
            <p className="change-password__error">{errors.confirmPassword}</p>
          )}
        </div>

        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Đang đổi mật khẩu..." : "Đổi mật khẩu"}
        </button>
      </form>

      <MessageModal
        isOpen={modal.isOpen}
        type={modal.type}
        title={modal.title}
        message={modal.message}
        onClose={handleCloseModal}
      />
    </section>
  );
}

export default ChangePassword;
