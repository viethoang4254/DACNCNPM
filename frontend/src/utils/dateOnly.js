export function toDateKey(value) {
  if (!value) return "";

  const text = String(value);
  const match = text.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) return `${match[1]}-${match[2]}-${match[3]}`;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export function formatDateVi(value, fallback = "-") {
  const key = toDateKey(value);
  if (!key) return fallback;

  const [year, month, day] = key.split("-");
  return `${day}/${month}/${year}`;
}

export function getDaysLeftFromDateKey(value) {
  const key = toDateKey(value);
  if (!key) return Number.POSITIVE_INFINITY;

  const [year, month, day] = key.split("-").map(Number);
  const start = new Date(year, month - 1, day);
  const today = new Date();

  if (Number.isNaN(start.getTime())) return Number.POSITIVE_INFINITY;

  today.setHours(0, 0, 0, 0);
  start.setHours(0, 0, 0, 0);

  return Math.ceil((start - today) / (1000 * 60 * 60 * 24));
}
