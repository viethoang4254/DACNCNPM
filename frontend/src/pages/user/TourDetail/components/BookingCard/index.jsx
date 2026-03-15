import { useEffect, useMemo, useState } from "react";
import apiClient from "../../../../../utils/apiClient";
import "./BookingCard.scss";

function formatCurrency(value) {
  return Number(value || 0).toLocaleString("vi-VN");
}

function formatDate(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("vi-VN");
}

function BookingCard({ tour, schedules = [] }) {
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

  const isSelectedScheduleAvailable = Number(selectedSchedule?.available_slots || 0) > 0;
  const canBook = Boolean(selectedScheduleId) && isSelectedScheduleAvailable && !submitting;

  useEffect(() => {
    if (scheduleOptions.length > 0) {
      const firstAvailable = scheduleOptions.find(
        (schedule) => Number(schedule.available_slots || 0) > 0,
      );
      setSelectedScheduleId(String(firstAvailable?.id || scheduleOptions[0].id));
    } else {
      setSelectedScheduleId("");
    }
  }, [scheduleOptions]);

  useEffect(() => {
    if (!selectedSchedule) return;
    const maxPeople = Math.max(1, Number(selectedSchedule.available_slots || 1));
    setPeople((prev) => Math.min(prev, maxPeople));
  }, [selectedSchedule]);

  const totalPrice = useMemo(() => Number(tour?.gia || 0) * people, [tour?.gia, people]);

  const getScheduleLabel = (schedule) => {
    const available = Number(schedule?.available_slots || 0);
    const slotText = available > 0 ? `Còn ${available} chỗ` : "Hết chỗ";
    return `${formatDate(schedule.start_date)} (${slotText})`;
  };

  async function handleBookNow() {
    if (!selectedScheduleId) {
      setMessage({ text: "Vui lòng chọn ngày khởi hành.", type: "error" });
      return;
    }

    if (!isSelectedScheduleAvailable) {
      setMessage({
        text: "Lịch này đã hết chỗ. Vui lòng chọn lịch khác.",
        type: "error",
      });
      return;
    }

    try {
      setSubmitting(true);
      setMessage({ text: "", type: "" });

      await apiClient.post("/api/bookings", {
        schedule_id: Number(selectedScheduleId),
        quantity: Number(people),
      });

      setMessage({ text: "Đặt tour thành công.", type: "success" });
    } catch (error) {
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
                disabled={Number(schedule.available_slots || 0) === 0}
              >
                {getScheduleLabel(schedule)}
              </option>
            ))
          )}
        </select>
      </label>

      <div className="tour-detail__field">
        <span>Số người</span>
        <div className="tour-detail__counter">
          <button type="button" onClick={() => setPeople((prev) => Math.max(1, prev - 1))}>
            -
          </button>
          <strong>{people}</strong>
          <button
            type="button"
            onClick={() => {
              const maxPeople = Math.max(1, Number(selectedSchedule?.available_slots || 1));
              setPeople((prev) => Math.min(maxPeople, prev + 1));
            }}
          >
            +
          </button>
        </div>
      </div>

      <div className="tour-detail__total">
        <span>Tổng giá trị</span>
        <strong>{formatCurrency(totalPrice)} VND</strong>
      </div>

      {message.text && (
        <p className={`tour-detail__booking-message tour-detail__booking-message--${message.type}`}>
          {message.text}
        </p>
      )}

      <button type="button" className="tour-detail__book-btn" disabled={!canBook} onClick={handleBookNow}>
        {submitting ? "Đang xử lý..." : "Đặt ngay"}
      </button>
    </aside>
  );
}

export default BookingCard;
