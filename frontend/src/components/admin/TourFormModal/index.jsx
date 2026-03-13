import { useEffect, useState } from "react";
import "./TourFormModal.scss";

const initialFormState = {
  ten_tour: "",
  mo_ta: "",
  tinh_thanh: "",
  diem_khoi_hanh: "",
  phuong_tien: "",
  so_ngay: "",
  so_nguoi_toi_da: "",
};

const initialTouchedState = {
  ten_tour: false,
  mo_ta: false,
  gia: false,
  tinh_thanh: false,
  diem_khoi_hanh: false,
  phuong_tien: false,
  so_ngay: false,
  so_nguoi_toi_da: false,
};

const sanitizeCurrencyInput = (value) => String(value ?? "").replace(/[^\d]/g, "");

const normalizeCurrencyValue = (value) => {
  const digits = sanitizeCurrencyInput(value);
  return digits ? Number(digits) : 0;
};

const normalizeInitialPriceValue = (value) => {
  if (value === null || value === undefined || value === "") {
    return "";
  }

  const raw = String(value).trim();
  if (!raw) {
    return "";
  }

  if (/^\d+(\.\d+)?$/.test(raw)) {
    const numericValue = Number(raw);
    if (Number.isFinite(numericValue)) {
      return String(Math.round(numericValue));
    }
  }

  return sanitizeCurrencyInput(raw);
};

const formatPriceForDisplay = (value) => {
  const digits = sanitizeCurrencyInput(value);
  if (!digits) return "";
  return Number(digits).toLocaleString("vi-VN");
};

const getFieldError = (name, value) => {
  const normalizedValue = typeof value === "string" ? value.trim() : value;

  if (["ten_tour", "tinh_thanh", "diem_khoi_hanh", "phuong_tien"].includes(name)) {
    if (!normalizedValue) return "Trường này không được để trống.";
    return "";
  }

  if (name === "gia") {
    const numericValue = normalizeCurrencyValue(value);

    if (normalizedValue === "" || normalizedValue === null || normalizedValue === undefined) {
      return "Vui lòng nhập giá tour.";
    }

    if (numericValue <= 0) {
      return "Giá tour phải lớn hơn 0.";
    }

    return "";
  }

  if (name === "so_ngay") {
    if (normalizedValue === "" || normalizedValue === null || normalizedValue === undefined) {
      return "Vui lòng nhập số ngày.";
    }

    if (!Number.isInteger(Number(normalizedValue)) || Number(normalizedValue) <= 0) {
      return "Số ngày phải là số nguyên dương.";
    }

    return "";
  }

  if (name === "so_nguoi_toi_da") {
    if (normalizedValue === "" || normalizedValue === null || normalizedValue === undefined) {
      return "Vui lòng nhập số người tối đa.";
    }

    if (!Number.isInteger(Number(normalizedValue)) || Number(normalizedValue) <= 0) {
      return "Số người tối đa phải là số nguyên dương.";
    }

    return "";
  }

  return "";
};

function TourFormModal({ open, mode = "create", tour, loading = false, onClose, onSubmit }) {
  const [form, setForm] = useState(initialFormState);
  const [price, setPrice] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [touched, setTouched] = useState(initialTouchedState);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    if (!open) {
      setForm(initialFormState);
      setPrice("");
      setFieldErrors({});
      setTouched(initialTouchedState);
      setFormError("");
      return;
    }

    setForm({
      ten_tour: tour?.ten_tour || "",
      mo_ta: tour?.mo_ta || "",
      tinh_thanh: tour?.tinh_thanh || "",
      diem_khoi_hanh: tour?.diem_khoi_hanh || "",
      phuong_tien: tour?.phuong_tien || "",
      so_ngay: tour?.so_ngay ?? "",
      so_nguoi_toi_da: tour?.so_nguoi_toi_da ?? "",
    });
    setPrice(normalizeInitialPriceValue(tour?.gia ?? ""));
    setFieldErrors({});
    setTouched(initialTouchedState);
    setFormError("");
  }, [open, tour]);

  if (!open) {
    return null;
  }

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));

    if (touched[name]) {
      setFieldErrors((prev) => ({
        ...prev,
        [name]: getFieldError(name, value),
      }));
    }
  }

  function handlePriceChange(event) {
    const nextPrice = sanitizeCurrencyInput(event.target.value);
    setPrice(nextPrice);

    if (touched.gia) {
      setFieldErrors((prev) => ({
        ...prev,
        gia: getFieldError("gia", nextPrice),
      }));
    }
  }

  function handleBlur(event) {
    const { name, value } = event.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    setFieldErrors((prev) => ({
      ...prev,
      [name]: getFieldError(name, value),
    }));
  }

  function handleSubmit(event) {
    event.preventDefault();

    const nextTouched = {
      ten_tour: true,
      mo_ta: true,
      gia: true,
      tinh_thanh: true,
      diem_khoi_hanh: true,
      phuong_tien: true,
      so_ngay: true,
      so_nguoi_toi_da: true,
    };

    const nextFieldErrors = {
      ten_tour: getFieldError("ten_tour", form.ten_tour),
      mo_ta: getFieldError("mo_ta", form.mo_ta),
      gia: getFieldError("gia", price),
      tinh_thanh: getFieldError("tinh_thanh", form.tinh_thanh),
      diem_khoi_hanh: getFieldError("diem_khoi_hanh", form.diem_khoi_hanh),
      phuong_tien: getFieldError("phuong_tien", form.phuong_tien),
      so_ngay: getFieldError("so_ngay", form.so_ngay),
      so_nguoi_toi_da: getFieldError("so_nguoi_toi_da", form.so_nguoi_toi_da),
    };

    setTouched(nextTouched);
    setFieldErrors(nextFieldErrors);

    if (Object.values(nextFieldErrors).some(Boolean)) {
      setFormError("Vui lòng kiểm tra lại thông tin tour.");
      return;
    }

    setFormError("");

    onSubmit({
      ten_tour: form.ten_tour.trim(),
      mo_ta: form.mo_ta.trim(),
      gia: normalizeCurrencyValue(price),
      tinh_thanh: form.tinh_thanh.trim(),
      diem_khoi_hanh: form.diem_khoi_hanh.trim(),
      phuong_tien: form.phuong_tien.trim(),
      so_ngay: Number(form.so_ngay),
      so_nguoi_toi_da: Number(form.so_nguoi_toi_da),
    });
  }

  return (
    <div className="admin-modal__backdrop" role="dialog" aria-modal="true" aria-labelledby="tour-form-modal-title">
      <div className="tour-form-modal">
        <div className="tour-form-modal__header">
          <div>
            <h3 id="tour-form-modal-title">{mode === "create" ? "Thêm tour" : "Chỉnh sửa tour"}</h3>
            <p>
              {mode === "create"
                ? "Tạo tour mới với đầy đủ thông tin theo schema database."
                : "Cập nhật thông tin tour đang được chọn."}
            </p>
          </div>
          <button type="button" className="admin-btn admin-btn--ghost" onClick={onClose} disabled={loading}>
            Đóng
          </button>
        </div>

        <form className="tour-form-modal__body" onSubmit={handleSubmit}>
          <div className="admin-form-grid">
            <div className="full">
              <label className="tour-form-modal__label" htmlFor="ten_tour">Tên tour</label>
              <input
                id="ten_tour"
                className={`admin-input ${touched.ten_tour && fieldErrors.ten_tour ? "admin-input--invalid" : ""}`}
                name="ten_tour"
                type="text"
                value={form.ten_tour}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="Nhập tên tour"
                aria-invalid={Boolean(touched.ten_tour && fieldErrors.ten_tour)}
              />
              {touched.ten_tour && fieldErrors.ten_tour && <p className="admin-field-error">{fieldErrors.ten_tour}</p>}
            </div>

            <div className="full">
              <label className="tour-form-modal__label" htmlFor="mo_ta">Mô tả</label>
              <textarea
                id="mo_ta"
                className="admin-textarea"
                name="mo_ta"
                value={form.mo_ta}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="Nhập mô tả tour"
              />
            </div>

            <div>
              <label className="tour-form-modal__label" htmlFor="gia">Giá</label>
              <input
                id="gia"
                className={`admin-input ${touched.gia && fieldErrors.gia ? "admin-input--invalid" : ""}`}
                name="gia"
                type="text"
                inputMode="numeric"
                value={price}
                onChange={handlePriceChange}
                onBlur={handleBlur}
                placeholder="Nhập giá tour, ví dụ 35500000"
                aria-invalid={Boolean(touched.gia && fieldErrors.gia)}
              />
              {!touched.gia && !fieldErrors.gia && price && <p className="admin-field-error" style={{ color: "#64748b" }}>{formatPriceForDisplay(price)} VNĐ</p>}
              {touched.gia && fieldErrors.gia && <p className="admin-field-error">{fieldErrors.gia}</p>}
            </div>

            <div>
              <label className="tour-form-modal__label" htmlFor="tinh_thanh">Tỉnh thành</label>
              <input
                id="tinh_thanh"
                className={`admin-input ${touched.tinh_thanh && fieldErrors.tinh_thanh ? "admin-input--invalid" : ""}`}
                name="tinh_thanh"
                type="text"
                value={form.tinh_thanh}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="Nhập tỉnh thành"
                aria-invalid={Boolean(touched.tinh_thanh && fieldErrors.tinh_thanh)}
              />
              {touched.tinh_thanh && fieldErrors.tinh_thanh && <p className="admin-field-error">{fieldErrors.tinh_thanh}</p>}
            </div>

            <div>
              <label className="tour-form-modal__label" htmlFor="diem_khoi_hanh">Điểm khởi hành</label>
              <input
                id="diem_khoi_hanh"
                className={`admin-input ${touched.diem_khoi_hanh && fieldErrors.diem_khoi_hanh ? "admin-input--invalid" : ""}`}
                name="diem_khoi_hanh"
                type="text"
                value={form.diem_khoi_hanh}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="Nhập điểm khởi hành"
                aria-invalid={Boolean(touched.diem_khoi_hanh && fieldErrors.diem_khoi_hanh)}
              />
              {touched.diem_khoi_hanh && fieldErrors.diem_khoi_hanh && <p className="admin-field-error">{fieldErrors.diem_khoi_hanh}</p>}
            </div>

            <div>
              <label className="tour-form-modal__label" htmlFor="phuong_tien">Phương tiện</label>
              <input
                id="phuong_tien"
                className={`admin-input ${touched.phuong_tien && fieldErrors.phuong_tien ? "admin-input--invalid" : ""}`}
                name="phuong_tien"
                type="text"
                value={form.phuong_tien}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="Nhập phương tiện"
                aria-invalid={Boolean(touched.phuong_tien && fieldErrors.phuong_tien)}
              />
              {touched.phuong_tien && fieldErrors.phuong_tien && <p className="admin-field-error">{fieldErrors.phuong_tien}</p>}
            </div>

            <div>
              <label className="tour-form-modal__label" htmlFor="so_ngay">Số ngày</label>
              <input
                id="so_ngay"
                className={`admin-input ${touched.so_ngay && fieldErrors.so_ngay ? "admin-input--invalid" : ""}`}
                name="so_ngay"
                type="number"
                min="1"
                step="1"
                value={form.so_ngay}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="Nhập số ngày"
                aria-invalid={Boolean(touched.so_ngay && fieldErrors.so_ngay)}
              />
              {touched.so_ngay && fieldErrors.so_ngay && <p className="admin-field-error">{fieldErrors.so_ngay}</p>}
            </div>

            <div>
              <label className="tour-form-modal__label" htmlFor="so_nguoi_toi_da">Số người tối đa</label>
              <input
                id="so_nguoi_toi_da"
                className={`admin-input ${touched.so_nguoi_toi_da && fieldErrors.so_nguoi_toi_da ? "admin-input--invalid" : ""}`}
                name="so_nguoi_toi_da"
                type="number"
                min="1"
                step="1"
                value={form.so_nguoi_toi_da}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="Nhập số người tối đa"
                aria-invalid={Boolean(touched.so_nguoi_toi_da && fieldErrors.so_nguoi_toi_da)}
              />
              {touched.so_nguoi_toi_da && fieldErrors.so_nguoi_toi_da && <p className="admin-field-error">{fieldErrors.so_nguoi_toi_da}</p>}
            </div>
          </div>

          {formError && <p className="admin-form-error">{formError}</p>}

          <div className="tour-form-modal__footer">
            <button type="button" className="admin-btn" onClick={onClose} disabled={loading}>
              Hủy
            </button>
            <button type="submit" className="admin-btn admin-btn--primary" disabled={loading}>
              {loading ? "Đang lưu..." : mode === "create" ? "Tạo tour" : "Cập nhật tour"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default TourFormModal;