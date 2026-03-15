import "dotenv/config";
import app from "./app.js";
import pool from "./config/db.js";
import { expirePendingBookings } from "./models/bookingModel.js";
import { getPendingExpireMinutes } from "./utils/bookingExpiration.js";

const PORT = Number(process.env.PORT || 5000);
const PENDING_EXPIRE_MINUTES = getPendingExpireMinutes();
const CLEANUP_INTERVAL_MS = Number(process.env.BOOKING_PENDING_CLEANUP_INTERVAL_MS || 300000);

const runPendingCleanup = async () => {
	const affectedRows = await expirePendingBookings(PENDING_EXPIRE_MINUTES);
	if (affectedRows > 0) {
		console.log(`[booking-cleanup] Auto-cancelled ${affectedRows} pending booking(s)`);
	}
};

const startServer = async () => {
	try {
		if (!process.env.JWT_SECRET) {
			throw new Error("Thieu bien moi truong JWT_SECRET");
		}

		await pool.query("SELECT 1");

		await runPendingCleanup();

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
