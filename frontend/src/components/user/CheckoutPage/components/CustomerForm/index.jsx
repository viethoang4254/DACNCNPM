import "./CustomerForm.scss";

function CustomerForm({ value, errors, onFieldChange }) {
  return (
    <form className="checkout-customer-form" onSubmit={(event) => event.preventDefault()}>
      <label htmlFor="checkout-name">Họ tên</label>
      <input
        id="checkout-name"
        type="text"
        placeholder="Nguyễn Văn A"
        value={value.ho_ten}
        className={errors?.ho_ten ? "is-invalid" : ""}
        onChange={(event) => onFieldChange("ho_ten", event.target.value)}
      />
      {errors?.ho_ten && <p className="checkout-customer-form__error">{errors.ho_ten}</p>}

      <label htmlFor="checkout-email">Email</label>
      <input
        id="checkout-email"
        type="email"
        placeholder="example@email.com"
        value={value.email}
        className={errors?.email ? "is-invalid" : ""}
        onChange={(event) => onFieldChange("email", event.target.value)}
      />
      {errors?.email && <p className="checkout-customer-form__error">{errors.email}</p>}

      <label htmlFor="checkout-phone">Số điện thoại</label>
      <input
        id="checkout-phone"
        type="tel"
        placeholder="09xxxxxxxx"
        value={value.so_dien_thoai}
        className={errors?.so_dien_thoai ? "is-invalid" : ""}
        onChange={(event) => onFieldChange("so_dien_thoai", event.target.value)}
      />
      {errors?.so_dien_thoai && <p className="checkout-customer-form__error">{errors.so_dien_thoai}</p>}
    </form>
  );
}

export default CustomerForm;
