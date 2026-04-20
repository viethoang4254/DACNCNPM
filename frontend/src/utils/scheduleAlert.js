const ALERT_PRIORITY = {
  critical: 3,
  warning: 2,
  stable: 1,
  neutral: 0,
};

const ALERT_META = {
  critical: { level: "critical", label: "Có lịch sắp hủy", icon: "🔴" },
  warning: { level: "warning", label: "Có lịch thiếu khách", icon: "🟡" },
  stable: { level: "stable", label: "Ổn định", icon: "🟢" },
  neutral: { level: "neutral", label: "Chưa có lịch", icon: "⚪" },
};

const STATUS_LABELS = {
  open: "Mở bán",
  warning: "Cảnh báo",
  guaranteed: "Đảm bảo",
  full: "Đã đầy",
  cancelled: "Sắp hủy",
  completed: "Đã khởi hành",
};

export const getSchedulePercent = (schedule) => {
  if (Number.isFinite(Number(schedule?.percent))) {
    return Number(schedule.percent);
  }

  const maxSlots = Number(schedule?.max_slots || 0);
  const bookedSlots = Number(schedule?.booked_slots || 0);
  if (maxSlots <= 0) return 0;

  return Math.floor((bookedSlots / maxSlots) * 100);
};

export const getScheduleDaysLeft = (schedule) => {
  if (Number.isFinite(Number(schedule?.days_left))) {
    return Number(schedule.days_left);
  }

  if (!schedule?.start_date) return null;

  const text = String(schedule.start_date).slice(0, 10);
  const parts = text.split("-").map(Number);
  if (parts.length !== 3 || parts.some((item) => !Number.isInteger(item))) {
    return null;
  }

  const [year, month, day] = parts;
  const start = new Date(year, month - 1, day);
  if (Number.isNaN(start.getTime())) return null;

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const date = new Date(start.getFullYear(), start.getMonth(), start.getDate());

  return Math.floor((date.getTime() - today.getTime()) / (24 * 60 * 60 * 1000));
};

export const getScheduleAlert = (schedule) => {
  const levelFromApi = String(schedule?.alert_level || "").toLowerCase();
  if (ALERT_META[levelFromApi]) {
    return {
      ...ALERT_META[levelFromApi],
      label: schedule?.alert_label || ALERT_META[levelFromApi].label,
    };
  }

  const daysLeft = getScheduleDaysLeft(schedule);
  const percent = getSchedulePercent(schedule);
  const minRequiredPercent = Math.floor(Number(schedule?.min_required_ratio ?? 0.5) * 100);

  if (daysLeft !== null && daysLeft <= 2 && percent < minRequiredPercent) {
    return ALERT_META.critical;
  }

  if (daysLeft !== null && daysLeft <= 7 && percent < minRequiredPercent) {
    return ALERT_META.warning;
  }

  return ALERT_META.stable;
};

export const getTourAlertFromSchedules = (schedules = []) => {
  if (!Array.isArray(schedules) || schedules.length === 0) {
    return ALERT_META.neutral;
  }

  return schedules
    .map(getScheduleAlert)
    .sort((a, b) => ALERT_PRIORITY[b.level] - ALERT_PRIORITY[a.level])[0] || ALERT_META.stable;
};

export const getScheduleStatusLabel = (status) =>
  STATUS_LABELS[String(status || "").toLowerCase()] || status || "Không rõ";
