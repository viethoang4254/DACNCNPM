import "dotenv/config";
import app from "./app.js";
import pool from "./config/db.js";

const PORT = Number(process.env.PORT || 5000);

const startServer = async () => {
	try {
		if (!process.env.JWT_SECRET) {
			throw new Error("Thieu bien moi truong JWT_SECRET");
		}

		await pool.query("SELECT 1");
		app.listen(PORT, () => {
			console.log(`Backend dang chay tai cong ${PORT}`);
		});
	} catch (error) {
		console.error("Khong the ket noi MySQL:", error.message);
		process.exit(1);
	}
};

startServer();
