import { useEffect, useMemo, useState } from "react";
import {
  getApiMessage,
  getCurrentUserProfile,
  updateCurrentUserProfile,
} from "../../../services/userService";
import MessageModal from "../../../components/user/MessageModal";
import "./InfoUser.scss";

const initialForm = {
  ho_ten: "",
  email: "",
  so_dien_thoai: "",
};

function InfoUser() {
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modal, setModal] = useState({
    isOpen: false,
    type: "success",
    title: "",
    message: "",
  });

  const hasChanges = useMemo(
    () =>
      Boolean(
        form.ho_ten.trim().length > 0 &&
          form.so_dien_thoai.trim().length > 0 &&
          !isLoading,
      ),
    [form.ho_ten, form.so_dien_thoai, isLoading],
  );

  useEffect(() => {
    let ignore = false;

    const fetchProfile = async () => {
      setIsLoading(true);
      try {
        const data = await getCurrentUserProfile();
        if (ignore) return;

        setForm({
          ho_ten: data?.ho_ten || "",
          email: data?.email || "",
          so_dien_thoai: data?.so_dien_thoai || "",
        });
      } catch (error) {
        if (ignore) return;
        setModal({
          isOpen: true,
          type: "error",
          title: "Không thể tải thông tin",
          message: getApiMessage(error, "Vui lòng thử lại sau."),
        });
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    };

    fetchProfile();

    return () => {
      ignore = true;
    };
  }, []);

  const validateForm = (values) => {
    const nextErrors = {};

    if (!values.ho_ten.trim()) {
      nextErrors.ho_ten = "Vui lòng nhập họ và tên";
    }

    if (!values.so_dien_thoai.trim()) {
      nextErrors.so_dien_thoai = "Vui lòng nhập số điện thoại";
    }

    return nextErrors;
  };

  const handleInputChange = (event) => {
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

  const handleSubmit = async (event) => {
    event.preventDefault();

    const nextErrors = validateForm(form);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    try {
      setIsSubmitting(true);
      const updated = await updateCurrentUserProfile({
        ho_ten: form.ho_ten.trim(),
        so_dien_thoai: form.so_dien_thoai.trim(),
      });

      setForm((prev) => ({
        ...prev,
        ho_ten: updated?.ho_ten || prev.ho_ten,
        so_dien_thoai: updated?.so_dien_thoai || prev.so_dien_thoai,
      }));

      setModal({
        isOpen: true,
        type: "success",
        title: "Cập nhật thành công",
        message: "Thông tin cá nhân của bạn đã được cập nhật.",
      });
    } catch (error) {
      setModal({
        isOpen: true,
        type: "error",
        title: "Cập nhật thất bại",
        message: getApiMessage(error, "Không thể cập nhật thông tin lúc này."),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <p className="info-user__loading">Đang tải thông tin cá nhân...</p>;
  }

  return (
    <section className="info-user">
      <div className="info-user__head">
        <h1>Thông tin cá nhân</h1>
        <p>Quản lý thông tin tài khoản để đặt tour nhanh hơn.</p>
      </div>

      <form className="info-user__form" onSubmit={handleSubmit} noValidate>
        <div className="info-user__field">
          <label htmlFor="ho_ten">Họ và tên</label>
          <input
            id="ho_ten"
            name="ho_ten"
            type="text"
            value={form.ho_ten}
            onChange={handleInputChange}
            className={errors.ho_ten ? "is-invalid" : ""}
          />
          {errors.ho_ten && <p className="info-user__error">{errors.ho_ten}</p>}
        </div>

        <div className="info-user__field">
          <label htmlFor="email">Email</label>
          <input id="email" name="email" type="email" value={form.email} disabled />
        </div>

        <div className="info-user__field">
          <label htmlFor="so_dien_thoai">Số điện thoại</label>
          <input
            id="so_dien_thoai"
            name="so_dien_thoai"
            type="text"
            value={form.so_dien_thoai}
            onChange={handleInputChange}
            className={errors.so_dien_thoai ? "is-invalid" : ""}
          />
          {errors.so_dien_thoai && (
            <p className="info-user__error">{errors.so_dien_thoai}</p>
          )}
        </div>

        <button type="submit" disabled={isSubmitting || !hasChanges}>
          {isSubmitting ? "Đang cập nhật..." : "Cập nhật thông tin"}
        </button>
      </form>

      <MessageModal
        isOpen={modal.isOpen}
        type={modal.type}
        title={modal.title}
        message={modal.message}
        onClose={() => setModal((prev) => ({ ...prev, isOpen: false }))}
      />
    </section>
  );
}

export default InfoUser;
