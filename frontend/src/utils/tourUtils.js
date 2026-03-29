const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1527631746610-bca00a040d60?auto=format&fit=crop&w=900&q=80";

/**
 * Normalize raw API / mock tour data to the shape expected by TourCard.
 * Raw fields: ten_tour, tinh_thanh, so_ngay, gia, hinh_anh
 * Mapped fields: name, location, days, price, image, plus any sort-related fields.
 */
export function normalizeTour(item) {
  const discountPercent = Number(
    item.discount_percent ?? item.discountPercent ?? 0,
  );
  const isOnSale = Boolean(item.is_on_sale ?? item.isOnSale ?? false);

  return {
    id: item.id,
    name: item.ten_tour || item.name || "Tour du lịch",
    location: item.tinh_thanh || item.location || "Việt Nam",
    transport: item.phuong_tien || item.transport || "",
    days: Number(item.so_ngay || item.days || 1),
    price: Number(item.gia || item.price || 0),
    image: item.hinh_anh || item.image || FALLBACK_IMAGE,
    is_on_sale: isOnSale,
    discount_percent: discountPercent,
    schedule: {
      is_on_sale: isOnSale,
      discount_percent: discountPercent,
    },
    // Fields used by sort strategies (populated once the API supports them)
    review_count: Number(item.review_count || 0),
    avg_rating: Number(item.avg_rating || 0),
    booking_count: Number(item.booking_count || 0),
  };
}

/**
 * Format tour duration as "3N2Đ" (days + nights).
 * A 1-day tour returns "1N", a 3-day tour returns "3N2Đ".
 */
export function formatDuration(days) {
  const d = Math.max(1, Number(days) || 1);
  const nights = d - 1;
  return nights > 0 ? `${d}N${nights}Đ` : `${d}N`;
}
