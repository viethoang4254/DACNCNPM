import {
  getDashboardAlerts,
  getDashboardBookingStatus,
  getDashboardRevenueChart,
  getDashboardSummary,
} from "../models/dashboardModel.js";

export const getDashboardSummaryService = async () => {
  const summary = await getDashboardSummary();
  return {
    statusCode: 200,
    success: true,
    message: "Dashboard summary fetched successfully",
    data: summary,
  };
};

export const getDashboardBookingStatusService = async () => {
  const bookingStatus = await getDashboardBookingStatus();
  return {
    statusCode: 200,
    success: true,
    message: "Dashboard booking status fetched successfully",
    data: bookingStatus,
  };
};

export const getDashboardRevenueChartService = async () => {
  const chart = await getDashboardRevenueChart();
  return {
    statusCode: 200,
    success: true,
    message: "Dashboard revenue chart fetched successfully",
    data: chart,
  };
};

export const getDashboardAlertsService = async () => {
  const alerts = await getDashboardAlerts();
  return {
    statusCode: 200,
    success: true,
    message: "Dashboard alerts fetched successfully",
    data: alerts,
  };
};
