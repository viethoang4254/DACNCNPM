const DEFAULT_EXPIRE_MINUTES = 15;
const MIN_EXPIRE_MINUTES = 10;
const MAX_EXPIRE_MINUTES = 15;

export function getPendingExpireMinutes() {
  const configured = Number(process.env.BOOKING_PENDING_EXPIRE_MINUTES || DEFAULT_EXPIRE_MINUTES);

  if (!Number.isFinite(configured)) {
    return DEFAULT_EXPIRE_MINUTES;
  }

  return Math.min(MAX_EXPIRE_MINUTES, Math.max(MIN_EXPIRE_MINUTES, Math.floor(configured)));
}

export function getBookingPendingCutoff(expireMinutes = getPendingExpireMinutes()) {
  const cutoff = new Date(Date.now() - expireMinutes * 60 * 1000);
  return cutoff.toISOString().slice(0, 19).replace("T", " ");
}
