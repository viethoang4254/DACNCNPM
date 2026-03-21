const TOUR_HISTORY_KEY = "tour_history";
const MAX_HISTORY_ITEMS = 10;

const toNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const parseHistory = (value) => {
  if (!value) return [];

  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) return [];

    return parsed
      .map((item) => ({
        tour_id: toNumber(item?.tour_id),
        viewedAt: Number(item?.viewedAt) || Date.now(),
      }))
      .filter((item) => item.tour_id && item.tour_id > 0)
      .slice(0, MAX_HISTORY_ITEMS);
  } catch {
    return [];
  }
};

export const getGuestTourHistory = () => {
  const raw = localStorage.getItem(TOUR_HISTORY_KEY);
  return parseHistory(raw);
};

export const saveGuestTourHistory = (tourId) => {
  const normalizedTourId = toNumber(tourId);
  if (!normalizedTourId || normalizedTourId <= 0) {
    return getGuestTourHistory();
  }

  const now = Date.now();
  const currentHistory = getGuestTourHistory();
  const deduplicated = currentHistory.filter((item) => item.tour_id !== normalizedTourId);

  const nextHistory = [{ tour_id: normalizedTourId, viewedAt: now }, ...deduplicated].slice(0, MAX_HISTORY_ITEMS);

  localStorage.setItem(TOUR_HISTORY_KEY, JSON.stringify(nextHistory));
  return nextHistory;
};

export const TOUR_HISTORY_STORAGE_KEY = TOUR_HISTORY_KEY;
