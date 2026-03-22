import apiClient from "../utils/apiClient";

export async function getTourReviews(tourId) {
  const response = await apiClient.get(`/api/tours/${tourId}/reviews`);
  const payload = response?.data?.data || {};

  return {
    reviews: Array.isArray(payload.reviews) ? payload.reviews : [],
    stats: {
      avg_rating: Number(payload?.stats?.avg_rating || 0),
      total: Number(payload?.stats?.total || 0),
    },
  };
}

export async function getReviewEligibility(tourId) {
  const response = await apiClient.get(`/api/reviews/eligibility/${tourId}`);
  return response?.data?.data || {
    canReview: false,
    hasReviewed: false,
    message: "",
  };
}

export async function createReview(payload) {
  const response = await apiClient.post("/api/reviews", payload);
  return response?.data?.data || null;
}

export async function getAdminReviews() {
  const response = await apiClient.get("/api/reviews");
  return Array.isArray(response?.data?.data) ? response.data.data : [];
}

export async function hideReview(reviewId) {
  const response = await apiClient.patch(`/api/admin/reviews/${reviewId}/hide`);
  return response?.data?.data || null;
}

export async function showReview(reviewId) {
  const response = await apiClient.patch(`/api/admin/reviews/${reviewId}/show`);
  return response?.data?.data || null;
}
