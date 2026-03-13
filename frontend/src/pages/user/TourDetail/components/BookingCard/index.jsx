import { useEffect, useMemo, useState } from "react";
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

  useEffect(() => {
    if (schedules.length > 0) {
      setSelectedScheduleId(String(schedules[0].id));
    } else {
      setSelectedScheduleId("");
    }
  }, [schedules]);

  const totalPrice = useMemo(() => Number(tour?.gia || 0) * people, [tour?.gia, people]);

  return (
    <aside className="tour-detail__booking card">
      <h3>Đặt tour nhanh</h3>

      <label className="tour-detail__field">
        <span>Ngày khởi hành</span>
        <select
          value={selectedScheduleId}
          onChange={(event) => setSelectedScheduleId(event.target.value)}
          disabled={schedules.length === 0}
        >
          {schedules.length === 0 ? (
            <option value="">Chưa có lịch khởi hành</option>
          ) : (
            schedules.map((schedule) => (
              <option key={schedule.id} value={schedule.id}>
                {formatDate(schedule.start_date)}
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
          <button type="button" onClick={() => setPeople((prev) => prev + 1)}>
            +
          </button>
        </div>
      </div>

      <div className="tour-detail__total">
        <span>Tổng giá trị</span>
        <strong>{formatCurrency(totalPrice)} VND</strong>
      </div>

      <button type="button" className="tour-detail__book-btn" disabled={!selectedScheduleId}>
        Đặt ngay
      </button>
    </aside>
  );
}

export default BookingCard;
