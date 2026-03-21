export const getPriceInfo = (tour, schedule) => {
  const basePrice = Number(tour?.gia || 0);
  const isOnSale = Boolean(schedule?.is_on_sale);
  const discountPercent = Number(schedule?.discount_percent || 0);

  if (!isOnSale || discountPercent <= 0) {
    return {
      finalPrice: basePrice,
      originalPrice: null,
      discount: 0,
    };
  }

  const clampedDiscount = Math.max(0, Math.min(100, discountPercent));
  const finalPrice = basePrice * (1 - clampedDiscount / 100);

  return {
    finalPrice,
    originalPrice: basePrice,
    discount: clampedDiscount,
  };
};
