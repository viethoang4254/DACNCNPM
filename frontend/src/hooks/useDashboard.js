import { useCallback, useEffect, useMemo, useState } from "react";
import {
  getDashboardAlerts,
  getDashboardBookingStatus,
  getDashboardRevenueChart,
  getDashboardSummary,
} from "../services/dashboardService";

const emptySummary = {
  totalUsers: 0,
  totalTours: 0,
  totalBookings: 0,
  totalRevenue: 0,
  growth: {
    users: 0,
    tours: 0,
    bookings: 0,
    revenue: 0,
  },
};

const emptyBookingStatus = {
  paid: 0,
  cod: 0,
  pending: 0,
  cancelled: 0,
};

export default function useDashboard() {
  const [summary, setSummary] = useState(emptySummary);
  const [bookingStatus, setBookingStatus] = useState(emptyBookingStatus);
  const [revenueChart, setRevenueChart] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchDashboard = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const [summaryData, bookingStatusData, revenueData, alertData] =
        await Promise.all([
          getDashboardSummary(),
          getDashboardBookingStatus(),
          getDashboardRevenueChart(),
          getDashboardAlerts(),
        ]);

      setSummary(summaryData || emptySummary);
      setBookingStatus(bookingStatusData || emptyBookingStatus);
      setRevenueChart(Array.isArray(revenueData) ? revenueData : []);
      setAlerts(Array.isArray(alertData) ? alertData : []);
    } catch {
      setError("Không thể tải dữ liệu");
      setSummary(emptySummary);
      setBookingStatus(emptyBookingStatus);
      setRevenueChart([]);
      setAlerts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const isEmpty = useMemo(() => {
    const hasSummaryData =
      Number(summary.totalUsers || 0) > 0 ||
      Number(summary.totalTours || 0) > 0 ||
      Number(summary.totalBookings || 0) > 0 ||
      Number(summary.totalRevenue || 0) > 0;

    const hasBookingStatus = Object.values(bookingStatus).some(
      (value) => Number(value || 0) > 0,
    );

    return !hasSummaryData && !hasBookingStatus && revenueChart.length === 0 && alerts.length === 0;
  }, [summary, bookingStatus, revenueChart, alerts]);

  return {
    summary,
    bookingStatus,
    revenueChart,
    alerts,
    loading,
    error,
    isEmpty,
    refetch: fetchDashboard,
  };
}
