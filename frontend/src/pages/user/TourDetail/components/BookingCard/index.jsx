import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import apiClient from "../../../../../utils/apiClient";
import { getAuthToken } from "../../../../../utils/authStorage";
import { getPriceInfo } from "../../../../../utils/price";
import "./BookingCard.scss";

function formatCurrency(value) {
  return Number(value || 0).toLocaleString("vi-VN");
}

function toLocalDateKey(value) {
  if (!value) return "";

  if (typeof value === "string") {
    const match = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (match) {
      return `${match[1]}-${match[2]}-${match[3]}`;
    }
  }

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function formatDate(value) {
  const key = toLocalDateKey(value);
  if (!key) return typeof value === "string" ? value : "";

  const [year, month, day] = key.split("-");
  return `${day}/${month}/${year}`;
}

function getDaysLeft(value) {
  const key = toLocalDateKey(value);
  if (!key) return null;

  const parts = key.split("-").map(Number);
  if (parts.length !== 3 || parts.some((item) => !Number.isInteger(item))) {
    return null;
  }

  const [year, month, day] = parts;
  const startDate = new Date(year, month - 1, day);
  if (Number.isNaN(startDate.getTime())) return null;

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  return Math.floor(
    (startDate.getTime() - today.getTime()) / (24 * 60 * 60 * 1000),
  );
}

function isScheduleBookable(schedule) {
  if (!schedule) return false;

  const availableSlots = Number(schedule.available_slots || 0);
  const daysLeft = getDaysLeft(schedule.start_date);

  if (daysLeft !== null && daysLeft <= 0) {
    return false;
  }

  return availableSlots > 0;
}

function BookingCard({ tour, schedules = [] }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedScheduleId, setSelectedScheduleId] = useState("");
  const [people, setPeople] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });

  const scheduleOptions = useMemo(
    () => (Array.isArray(schedules) ? schedules : []),
    [schedules],
  );

  const selectedSchedule = useMemo(
    () =>
      scheduleOptions.find(
        (schedule) => String(schedule.id) === String(selectedScheduleId),
      ) || null,
    [scheduleOptions, selectedScheduleId],
  );

  const isSelectedScheduleAvailable = isScheduleBookable(selectedSchedule);
  const canBook =
    Boolean(selectedScheduleId) && isSelectedScheduleAvailable && !submitting;

  useEffect(() => {
    if (scheduleOptions.length > 0) {
      const firstAvailable = scheduleOptions.find((schedule) =>
        isScheduleBookable(schedule),
      );
      setSelectedScheduleId(
        String(firstAvailable?.id || scheduleOptions[0].id),
      );
    } else {
      setSelectedScheduleId("");
    }
  }, [scheduleOptions]);

  useEffect(() => {
    if (!selectedSchedule) return;
    const maxPeople = isScheduleBookable(selectedSchedule)
      ? Math.max(1, Number(selectedSchedule.available_slots || 1))
      : 1;
    setPeople((prev) => Math.min(prev, maxPeople));
  }, [selectedSchedule]);

  const pricing = useMemo(() => {
    const { finalPrice, originalPrice, discount } = getPriceInfo(
      tour,
      selectedSchedule,
    );

    const unitFinal = Number(finalPrice || 0);
    const unitOriginal = Number(originalPrice ?? tour?.gia ?? 0);
    const originalTotal = unitOriginal * people;
    const finalTotal = unitFinal * people;
    const discountTotal = Math.max(0, originalTotal - finalTotal);

    return {
      discount,
      originalTotal,
      discountTotal,
      finalTotal,
    };
  }, [tour, selectedSchedule, people]);

  const getScheduleLabel = (schedule) => {
    const available = Number(schedule?.available_slots || 0);
    const slotText = isScheduleBookable(schedule)
      ? `Còn ${available} chỗ`
      : "Hết chỗ";
    return `${formatDate(schedule.start_date)} (${slotText})`;
  };

  async function handleBookNow() {
    if (!selectedScheduleId) {
      setMessage({ text: "Vui lòng chọn ngày khởi hành.", type: "error" });
      return;
    }

    if (!isSelectedScheduleAvailable) {
      setMessage({
        text: "Lịch này đã tới ngày khởi hành hoặc đã hết chỗ. Vui lòng chọn lịch khác.",
        type: "error",
      });
      return;
    }

    const token = getAuthToken();
    if (!token) {
      navigate("/login", {
        replace: false,
        state: {
          from: location.pathname,
        },
      });
      return;
    }

    try {
      setSubmitting(true);
      setMessage({ text: "", type: "" });

      const response = await apiClient.post("/api/bookings", {
        tour_id: Number(tour?.id || 0),
        schedule_id: Number(selectedScheduleId),
        so_nguoi: Number(people),
      });

      const bookingId = Number(
        response?.data?.data?.id || response?.data?.data?.booking?.id || 0,
      );

      if (!bookingId) {
        setMessage({
          text: "Đặt tour thành công nhưng không nhận được mã booking.",
          type: "error",
        });
        return;
      }

      navigate(`/checkout/${bookingId}`);
    } catch (error) {
      if (error?.response?.status === 401) {
        navigate("/login", {
          replace: false,
          state: {
            from: location.pathname,
          },
        });
        return;
      }

      const apiMessage = error?.response?.data?.message;
      setMessage({
        text: apiMessage || "Không thể đặt tour. Vui lòng thử lại.",
        type: "error",
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <aside className="tour-detail__booking card">
      <h3>Đặt tour nhanh</h3>

      <label className="tour-detail__field">
        <span>Ngày khởi hành</span>
        <select
          value={selectedScheduleId}
          onChange={(event) => {
            setSelectedScheduleId(event.target.value);
            setMessage({ text: "", type: "" });
          }}
          disabled={scheduleOptions.length === 0}
        >
          {scheduleOptions.length === 0 ? (
            <option value="">Chưa có lịch khởi hành</option>
          ) : (
            scheduleOptions.map((schedule) => (
              <option
                key={schedule.id}
                value={schedule.id}
                disabled={!isScheduleBookable(schedule)}
              >
                {getScheduleLabel(schedule)}
              </option>
            ))
          )}
        </select>

        {pricing.discount > 0 ? (
          <small className="tour-detail__sale-note">
            Đang áp dụng ưu đãi -{pricing.discount}% cho lịch này
          </small>
        ) : null}
      </label>

      <div className="tour-detail__field">
        <span>Số người</span>
        <div className="tour-detail__counter">
          <button
            type="button"
            onClick={() => setPeople((prev) => Math.max(1, prev - 1))}
          >
            -
          </button>
          <strong>{people}</strong>
          <button
            type="button"
            onClick={() => {
              const maxPeople = isScheduleBookable(selectedSchedule)
                ? Math.max(1, Number(selectedSchedule?.available_slots || 1))
                : 1;
              setPeople((prev) => Math.min(maxPeople, prev + 1));
            }}
          >
            +
          </button>
        </div>
      </div>

      <div className="tour-detail__breakdown">
        <div className="tour-detail__breakdown-row">
          <span>Giá gốc</span>
          <strong
            className={
              pricing.discount > 0 ? "tour-detail__breakdown-original" : ""
            }
          >
            {formatCurrency(pricing.originalTotal)} đ
          </strong>
        </div>

        <div className="tour-detail__breakdown-row">
          <span>Giảm giá</span>
          <strong className="tour-detail__breakdown-discount">
            -{formatCurrency(pricing.discountTotal)} đ
          </strong>
        </div>

        <div className="tour-detail__total">
          <span>Tổng tiền</span>
          <strong>{formatCurrency(pricing.finalTotal)} đ</strong>
        </div>
      </div>

      {message.text && (
        <p
          className={`tour-detail__booking-message tour-detail__booking-message--${message.type}`}
        >
          {message.text}
        </p>
      )}

      <button
        type="button"
        className="tour-detail__book-btn"
        disabled={!canBook}
        onClick={handleBookNow}
      >
        {submitting ? "Đang xử lý..." : "Đặt ngay"}
      </button>
    </aside>
  );
}

export default BookingCard;
