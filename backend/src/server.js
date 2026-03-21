import "dotenv/config";
import cron from "node-cron";
import app from "./app.js";
import pool from "./config/db.js";
import { getPendingExpireMinutes } from "./utils/bookingExpiration.js";
import { expirePendingBookingsAndSyncSchedules } from "./services/bookingMaintenanceService.js";
import { refreshAllSchedulesOccupancyAndStatus } from "./services/scheduleStatusService.js";

const PORT = Number(process.env.PORT || 5000);
const PENDING_EXPIRE_MINUTES = getPendingExpireMinutes();
const CLEANUP_INTERVAL_MS = Number(process.env.BOOKING_PENDING_CLEANUP_INTERVAL_MS || 300000);
const SCHEDULE_STATUS_CRON = process.env.SCHEDULE_STATUS_CRON || "0 2 * * *";

const runPendingCleanup = async () => {
	const affectedRows = await expirePendingBookingsAndSyncSchedules(PENDING_EXPIRE_MINUTES);
	if (affectedRows > 0) {
		console.log(`[booking-cleanup] Auto-cancelled ${affectedRows} pending booking(s)`);
	}
};

const runDailyScheduleStatusSync = async () => {
	const affected = await refreshAllSchedulesOccupancyAndStatus();
	if (affected > 0) {
		console.log(`[schedule-cron] Refreshed ${affected} schedule(s)`);
	}
};

const startServer = async () => {
	try {
		if (!process.env.JWT_SECRET) {
			throw new Error("Thieu bien moi truong JWT_SECRET");
		}

		await pool.query("SELECT 1");

		await runPendingCleanup();
		await runDailyScheduleStatusSync();

		cron.schedule(SCHEDULE_STATUS_CRON, () => {
			runDailyScheduleStatusSync().catch((error) => {
				console.error("[schedule-cron] Failed:", error.message);
			});
		});

		const cleanupTimer = setInterval(() => {
			runPendingCleanup().catch((error) => {
				console.error("[booking-cleanup] Failed:", error.message);
			});
		}, CLEANUP_INTERVAL_MS);
		cleanupTimer.unref();

		app.listen(PORT, () => {
			console.log(`Backend dang chay tai cong ${PORT}`);
		});
	} catch (error) {
		console.error("Khong the ket noi MySQL:", error.message);
		process.exit(1);
	}
};

startServer();
